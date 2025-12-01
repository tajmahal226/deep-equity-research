/**
 * Bulk Company Research Component
 * 
 * This component allows users to research multiple companies at once.
 * It provides a simple interface where users can input a list of company names
 * and get fast research results for each one.
 * 
 * What this component does:
 * - Accepts a list of company names (one per line or comma-separated)
 * - Sends all companies to the bulk research API
 * - Shows real-time progress as each company is researched
 * - Displays results in individual cards for each company
 * 
 * Files it depends on:
 * - /src/app/api/bulk-company-research/route.ts (the API endpoint)
 * - /src/components/MagicDown (for rendering markdown results)
 * - Various UI components from shadcn/ui
 * 
 * How to use:
 * 1. User enters company names in the textarea
 * 2. User clicks "Start Bulk Research"
 * 3. Component shows progress and results as they come in
 * 4. Each company gets its own card with the research results
 */

"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { validateApiKeys } from "@/utils/api-key-validation";
import toast from "react-hot-toast";
import { useGlobalStore } from "@/store/global";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Download,
  Users,
  Upload
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { logger } from "@/utils/logger";
import { useSettingStore } from "@/store/setting";
import { getProviderStateKey, getProviderApiKey, resolveActiveProvider } from "@/utils/provider";

// Import MagicDown for rendering markdown
const MagicDown = dynamic(() => import("@/components/MagicDown"));

// Type definitions for our component
interface CompanyResult {
  companyName: string;
  status: "pending" | "processing" | "completed" | "error";
  result?: {
    report: {
      title: string;
      content: string;
    };
    sources: any[];
  };
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

interface BulkProgress {
  completed: number;
  errors: number;
  total: number;
  percentage: number;
}

export default function BulkCompanyResearch() {
  const { t } = useTranslation();
  
  // Track active abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any ongoing requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  
  // State management
  const [companyNames, setCompanyNames] = useState<string>(""); // Raw input from user
  const [, setCompanies] = useState<string[]>([]); // Parsed company list
  const [isSearching, setIsSearching] = useState(false); // Are we currently researching?
  const [results, setResults] = useState<CompanyResult[]>([]); // Results for each company
  const [progress, setProgress] = useState<BulkProgress | null>(null); // Overall progress
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set()); // Which cards are expanded
  

  /**
   * Parse the input text to extract company names
   * Handles both comma-separated and newline-separated lists
   */
  const parseCompanyNames = useCallback((input: string): string[] => {
    // Split by newlines first
    let names = input.split('\n');
    
    // If there's only one line, try splitting by commas
    if (names.length === 1) {
      names = input.split(',');
    }
    
    // Clean up each name
    return names
      .map(name => name.trim())
      .filter(name => name.length > 0) // Remove empty entries
      .filter((name, index, self) => self.indexOf(name) === index); // Remove duplicates
  }, []);

  /**
   * Handle file upload for CSV or text files
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCompanyNames(text);
      };
      reader.readAsText(file);
    }
  };

  /**
   * Handle the research button click
   * This is the main function that starts the bulk research process
   */
  const handleStartResearch = async () => {
    // Parse the company names
    // Pre-flight validation: Check if API keys are configured
    const settingStore = useSettingStore.getState();
    const currentProvider = resolveActiveProvider(settingStore);
    const validation = validateApiKeys(currentProvider, currentProvider);
    
    if (!validation.isValid) {
      toast.error(validation.message || "Missing API keys");
      const { setOpenSetting } = useGlobalStore.getState();
      setOpenSetting(true);
      return;
    }

    const parsedCompanies = parseCompanyNames(companyNames);
    
    if (parsedCompanies.length === 0) {
      // Show an error if no companies were entered
      alert("Please enter at least one company name");
      return;
    }
    
    // Update state
    setCompanies(parsedCompanies);
    setIsSearching(true);
    setResults([]);
    setProgress(null);
    
    try {
      // Get current AI provider and model settings from user configuration
      const currentProvider = resolveActiveProvider(settingStore);
      const providerKey = getProviderStateKey(currentProvider);
      const thinkingModel = settingStore[
        `${providerKey}ThinkingModel` as keyof typeof settingStore
      ] as string;
      const taskModel = settingStore[
        `${providerKey}NetworkingModel` as keyof typeof settingStore
      ] as string;

      // Get API keys from user settings
      const thinkingApiKey = getProviderApiKey(settingStore, currentProvider);
      const taskApiKey = getProviderApiKey(settingStore, currentProvider); // Usually same provider
      const searchProvider = settingStore.searchProvider || "model";
      const searchApiKey = getProviderApiKey(settingStore, searchProvider);

      // Prepare the request body
      const requestBody = {
        companies: parsedCompanies,
        language: "en-US", // You can get this from i18n if needed
        
        // Pass user's configured AI models
        thinkingProviderId: currentProvider,
        thinkingModelId: thinkingModel,
        taskProviderId: currentProvider, 
        taskModelId: taskModel,
        
        // Pass user's API keys
        thinkingApiKey: thinkingApiKey,
        taskApiKey: taskApiKey,
        
        // Pass search provider if configured
        searchProviderId: searchProvider,
        searchApiKey: searchApiKey,
      };
      
      // Make the API call with extended timeout for bulk operations
      // Bulk operations with bleeding-edge models need more time
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout
      
      const accessPassword = settingStore.accessPassword?.trim();

      const response = await fetch("/api/bulk-company-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if ACCESS_PASSWORD is configured
          ...(accessPassword && {
            Authorization: `Bearer ${accessPassword}`
          })
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          try {
            errorMessage = await response.text();
          } catch {
            // Ignore
          }
        }
        console.error("Bulk research request failed:", errorMessage);
        throw new Error(errorMessage || `Research failed: ${response.statusText}`);
      }
      
      // Set up Server-Sent Events to receive real-time updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No response body");
      }
      
      // Process the SSE stream
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";
        
        // Process lines in pairs (event + data)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines
          if (!line) continue;
          
          if (line.startsWith("event: ")) {
            const eventType = line.substring(7).trim();
            
            // Look for the next data line
            let dataLine = null;
            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j].trim();
              if (!nextLine) continue; // Skip empty lines
              
              if (nextLine.startsWith("data: ")) {
                dataLine = nextLine;
                i = j; // Skip to the data line we just processed
                break;
              } else if (nextLine.startsWith("event: ")) {
                // Found another event before data, skip this event
                break;
              }
            }
            
            if (dataLine) {
              try {
                const data = JSON.parse(dataLine.substring(6));
                logger.log(`SSE Event: ${eventType}`, data); // Debug logging
                
                // Handle different event types
                switch (eventType) {
                  case "status":
                    // Initial status with all companies
                    setResults(data.companies);
                    break;

                  case "company-start":
                    // A company started processing
                    setResults(prev => prev.map(r =>
                      r.companyName === data.companyName
                        ? { ...r, status: "processing" }
                        : r
                    ));
                    break;

                  case "company-complete":
                    // A company completed successfully
                    setResults(prev => prev.map(r =>
                      r.companyName === data.companyName
                        ? {
                            ...r,
                            status: "completed",
                            result: data.result,
                            completedAt: new Date().toISOString()
                          }
                        : r
                    ));
                    break;

                  case "company-error":
                    // A company had an error
                    setResults(prev => prev.map(r =>
                      r.companyName === data.companyName
                        ? {
                            ...r,
                            status: "error",
                            error: data.error,
                            completedAt: new Date().toISOString()
                          }
                        : r
                    ));
                    break;

                  case "progress":
                    // Overall progress update
                    setProgress(data);
                    break;

                  case "complete":
                    // All companies processed
                    logger.log("Bulk research complete:", data);
                    setIsSearching(false);
                    await reader.cancel();
                    return;

                  case "error":
                    // General, non-company-specific error
                    console.error("Bulk research error:", data);
                    await reader.cancel();
                    throw new Error(data.message || "Research failed");

                  default:
                    // Ignore any undocumented events to keep the client resilient
                    logger.warn(`Unhandled SSE event: ${eventType}`, data);
                }
                } catch (e) {
                  console.error("Error parsing SSE data:", e);
                }
              } // end if (dataLine)
            } // end if (line.startsWith("event: "))
        } // end for loop over lines
      } // end while (true)
      
    } catch (error) {
      console.error("Bulk company research error:", error);
      setIsSearching(false);
      alert(error instanceof Error && error.message ? error.message : "Research failed");
    }
  };

  /**
   * Toggle whether a company card is expanded or collapsed
   */
  const toggleCardExpansion = (companyName: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyName)) {
        newSet.delete(companyName);
      } else {
        newSet.add(companyName);
      }
      return newSet;
    });
  };

  /**
   * Download all results as a single markdown file
   */
  const downloadAllResults = () => {
    const completedResults = results.filter(r => r.status === "completed" && r.result);
    if (completedResults.length === 0) {
      alert("No completed results to download");
      return;
    }
    
    // Combine all results into one markdown document
    const markdown = completedResults.map(r => {
      return `# ${r.result!.report.title}\n\n${r.result!.report.content}\n\n---\n`;
    }).join('\n');
    
    // Create a blob and download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-company-research-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Get the icon for a company's status
   */
  const getStatusIcon = (status: CompanyResult['status']) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-gray-500" />;
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  /**
   * Get the badge variant for a company's status
   */
  const getStatusBadgeVariant = (status: CompanyResult['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "outline";
      case "processing":
        return "secondary";
      case "completed":
        return "default";
      case "error":
        return "destructive";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("bulkCompanyResearch.title", "Bulk Company Research")}
          </CardTitle>
          <CardDescription>
            {t("bulkCompanyResearch.description", "Research multiple companies at once. Enter company names below (one per line or comma-separated).")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-names">
              {t("bulkCompanyResearch.companyNames", "Company Names")}
            </Label>
            <Textarea
              id="company-names"
              placeholder={t("bulkCompanyResearch.placeholder", "Apple\nMicrosoft\nGoogle\n\nor\n\nApple, Microsoft, Google")}
              value={companyNames}
              onChange={(e) => setCompanyNames(e.target.value)}
              rows={6}
              disabled={isSearching}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {companyNames && `${parseCompanyNames(companyNames).length} companies detected`}
              </p>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {t("bulkCompanyResearch.uploadFile", "Upload File")}
                  </span>
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </Label>
            </div>
          </div>

          <Button 
            onClick={handleStartResearch} 
            disabled={!companyNames.trim() || isSearching}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("bulkCompanyResearch.searching", "Researching Companies...")}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {t("bulkCompanyResearch.startResearch", "Start Bulk Research")}
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.completed + progress.errors} of {progress.total} completed</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} />
              {progress.errors > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {progress.errors} companies failed to research
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Research Results</h2>
            {results.some(r => r.status === "completed") && (
              <Button onClick={downloadAllResults} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download All Results
              </Button>
            )}
          </div>

          {/* Individual Company Cards */}
          <div className="grid gap-4">
            {results.map((result) => (
              <Card key={result.companyName} className="overflow-hidden">
                <CardHeader className="cursor-pointer" onClick={() => toggleCardExpansion(result.companyName)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <CardTitle className="text-lg">{result.companyName}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.completedAt && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.completedAt).toLocaleTimeString()}
                        </span>
                      )}
                      {result.status === "completed" && (
                        expandedCards.has(result.companyName) 
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {result.status === "error" && (
                    <CardDescription className="text-red-500 mt-2">
                      Error: {result.error}
                    </CardDescription>
                  )}
                </CardHeader>
                
                {/* Expandable Content for Completed Research */}
                {result.status === "completed" && result.result && (
                  <Collapsible open={expandedCards.has(result.companyName)}>
                    <CollapsibleContent>
                      <CardContent className="border-t pt-4">
                        <MagicDown
                          className="min-h-48 max-h-96 overflow-y-auto"
                          value={result.result.report.content}
                          onChange={() => {}} // Read-only
                        />
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                
                {/* Show loading indicator for processing companies */}
                {result.status === "processing" && (
                  <CardContent className="border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Researching company information...
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
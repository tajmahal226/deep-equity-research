"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Search, Loader2, X, Globe, Factory, Users, Link, Zap, Gauge, Microscope, Download, FileText, Signature } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadFile } from "@/utils/file";
import { logger } from "@/utils/logger";
import { useSettingStore } from "@/store/setting";
import { getProviderStateKey, getProviderApiKey, resolveActiveProvider } from "@/utils/provider";

const MagicDown = dynamic(() => import("@/components/MagicDown"));

type SearchDepth = "fast" | "medium" | "deep";

export default function CompanyDeepDive() {
  // Track active fetch controller for cleanup
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any ongoing requests when component unmounts
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const { t } = useTranslation();
  const settingStore = useSettingStore();
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [subIndustries, setSubIndustries] = useState<string[]>([]);
  const [subIndustryInput, setSubIndustryInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [researchSources, setResearchSources] = useState<string[]>([]);
  const [researchSourceInput, setResearchSourceInput] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [searchDepth, setSearchDepth] = useState<SearchDepth>("medium");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);

  const handleAddTag = (
    input: string,
    setInput: (value: string) => void,
    tags: string[],
    setTags: (value: string[]) => void
  ) => {
    if (input.trim() && !tags.includes(input.trim())) {
      setTags([...tags, input.trim()]);
      setInput("");
    }
  };

  const handleRemoveTag = (
    index: number,
    tags: string[],
    setTags: (value: string[]) => void
  ) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    setInput: (value: string) => void,
    tags: string[],
    setTags: (value: string[]) => void
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(input, setInput, tags, setTags);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!searchResults?.report) return;
    
    const content = searchResults.report.content + 
      (searchResults.sources && searchResults.sources.length > 0 ? 
        `\n\n---\n## Sources\n${searchResults.sources.map((source: any, idx: number) => 
          `${idx + 1}. [${source.title || source.url}](${source.url})`
        ).join('\n')}` : '');
    
    downloadFile(
      content,
      `${companyName}-research.md`,
      "text/markdown;charset=utf-8"
    );
  };

  const handleDownloadPDF = () => {
    if (!searchResults?.report) return;
    
    const originalTitle = document.title;
    document.title = `${companyName} - Company Deep Dive Research`;
    window.print();
    document.title = originalTitle;
  };

  const handleSearch = async () => {
    if (!companyName.trim()) return;
    
    // Abort any existing request
    if (abortController) {
      abortController.abort();
    }
    
    setIsSearching(true);
    setSearchResults(null); // Clear previous results
    
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

      // Prepare the request body with all company information and user's AI settings
      const requestBody = {
        companyName,
        companyWebsite,
        industry,
        subIndustries,
        competitors,
        researchSources,
        additionalContext,
        searchDepth,
        language: "en-US", // You can get this from i18n if needed
        
        // Pass user's configured AI models
        thinkingProviderId: currentProvider,
        thinkingModelId: thinkingModel,
        taskProviderId: currentProvider,
        taskModelId: taskModel,
        
        // Pass user's API keys and reasoning effort
        thinkingApiKey: thinkingApiKey,
        taskApiKey: taskApiKey,
        thinkingReasoningEffort: settingStore.openAIReasoningEffort,
        taskReasoningEffort: settingStore.openAIReasoningEffort,
        
        // Pass search provider if configured
        searchProviderId: searchProvider,
        searchApiKey: searchApiKey,
      };
      
      // Make the API call with appropriate timeout based on search depth
      const timeoutMs = searchDepth === "deep" ? 600000 : // 10 minutes for deep
                       searchDepth === "medium" ? 300000 : // 5 minutes for medium
                       180000; // 3 minutes for fast
      
      const controller = new AbortController();
      setAbortController(controller); // Track for cleanup
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch("/api/company-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if ACCESS_PASSWORD is configured
          ...(process.env.NEXT_PUBLIC_ACCESS_PASSWORD && {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_ACCESS_PASSWORD}`
          })
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Research failed: ${response.statusText}`);
      }
      
      // Set up Server-Sent Events to receive real-time updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No response body");
      }
      
      // Process the SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.substring(7);
            
            // Get the data line (next line after event)
            const dataLine = lines[lines.indexOf(line) + 1];
            if (dataLine?.startsWith("data: ")) {
              const data = JSON.parse(dataLine.substring(6));
              
              // Handle different event types
              switch (eventType) {
                case "progress":
                  logger.log("Progress:", data);
                  // You could update a progress indicator here
                  break;

                case "message":
                  logger.log("Message:", data);
                  // You could stream partial results here
                  break;

                case "complete":
                  logger.log("Research complete:", data);
                  setSearchResults(data);
                  setIsSearching(false);
                  setAbortController(null); // Clear controller
                  await reader.cancel();
                  return;

                case "error":
                  console.error("Research error:", data);
                  setAbortController(null); // Clear controller
                  await reader.cancel();
                  throw new Error(data.message || "Research failed");
              }
            }
          }
        }
      }
      
    } catch (error: any) {
      // Don't log abort errors (they're intentional)
      if (error?.name !== 'AbortError') {
        console.error("Company research error:", error);
      }
      setIsSearching(false);
      setAbortController(null); // Clear controller
      setSearchResults({
        error: error instanceof Error ? error.message : "Research failed",
        company: companyName,
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t("companyDeepDive.title", "Company Deep Dive Research")}
          </CardTitle>
          <CardDescription>
            {t("companyDeepDive.description", "Get comprehensive insights about a specific company including financials, market position, competitors, and strategic analysis.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {t("companyDeepDive.companyName", "Company Name")}
              </Label>
              <Input
                id="company-name"
                placeholder="Silverfort"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-website" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t("companyDeepDive.companyWebsite", "Company Website")}
              </Label>
              <Input
                id="company-website"
                placeholder="www.silverfort.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="flex items-center gap-2">
              <Factory className="w-4 h-4" />
              {t("companyDeepDive.industry", "Industry")}
            </Label>
            <Input
              id="industry"
              placeholder="Cyber Security"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-industry" className="flex items-center gap-2">
              <Factory className="w-4 h-4 opacity-70" />
              {t("companyDeepDive.subIndustry", "Sub-Industry")}
            </Label>
            <Input
              id="sub-industry"
              placeholder="Identity and Access Management"
              value={subIndustryInput}
              onChange={(e) => setSubIndustryInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, subIndustryInput, setSubIndustryInput, subIndustries, setSubIndustries)}
              onBlur={() => handleAddTag(subIndustryInput, setSubIndustryInput, subIndustries, setSubIndustries)}
            />
            {subIndustries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {subIndustries.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(index, subIndustries, setSubIndustries)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitors" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("companyDeepDive.competitors", "Competitors")}
            </Label>
            <Input
              id="competitors"
              placeholder="Crowdstrike, Semperis, Okta, ZScaler"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, competitorInput, setCompetitorInput, competitors, setCompetitors)}
              onBlur={() => handleAddTag(competitorInput, setCompetitorInput, competitors, setCompetitors)}
            />
            {competitors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {competitors.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(index, competitors, setCompetitors)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="research-sources" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              {t("companyDeepDive.researchSources", "Research Sources (Optional)")}
            </Label>
            <Input
              id="research-sources"
              placeholder="www.darkreading.com, Reddit/CyberSecurity"
              value={researchSourceInput}
              onChange={(e) => setResearchSourceInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, researchSourceInput, setResearchSourceInput, researchSources, setResearchSources)}
              onBlur={() => handleAddTag(researchSourceInput, setResearchSourceInput, researchSources, setResearchSources)}
            />
            {researchSources.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {researchSources.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(index, researchSources, setResearchSources)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additional-context">
              {t("companyDeepDive.additionalContext", "Additional Context (Optional)")}
            </Label>
            <Textarea
              id="additional-context"
              placeholder={t("companyDeepDive.contextPlaceholder", "Any specific aspects you want to focus on? (e.g., recent acquisitions, ESG performance, competitive analysis)")}
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("companyDeepDive.searchDepth", "Search Depth")}</Label>
            <RadioGroup value={searchDepth} onValueChange={(value) => setSearchDepth(value as SearchDepth)}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="fast" id="fast" className="mt-1" />
                  <Label htmlFor="fast" className="font-normal cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4" />
                      <span className="font-semibold">{t("companyDeepDive.fast", "Fast")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("companyDeepDive.fastDescription", "1-2 minutes, minimal sources")}
                    </p>
                  </Label>
                </div>
                <div className="flex items-start space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="medium" id="medium" className="mt-1" />
                  <Label htmlFor="medium" className="font-normal cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Gauge className="h-4 w-4" />
                      <span className="font-semibold">{t("companyDeepDive.medium", "Medium")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("companyDeepDive.mediumDescription", "~5 minutes, 20-30 sources")}
                    </p>
                  </Label>
                </div>
                <div className="flex items-start space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="deep" id="deep" className="mt-1" />
                  <Label htmlFor="deep" className="font-normal cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Microscope className="h-4 w-4" />
                      <span className="font-semibold">{t("companyDeepDive.deep", "Deep")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("companyDeepDive.deepDescription", "10-15 minutes, 100+ sources")}
                    </p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={!companyName.trim() || isSearching}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("companyDeepDive.searching", "Researching...")}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {t("companyDeepDive.startResearch", "Start Deep Dive")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {searchResults && (
        <Card className="print:border-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("companyDeepDive.results", "Research Results")}</span>
              {searchResults.report && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="print:hidden"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadMarkdown}>
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Markdown</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="max-md:hidden"
                      onClick={handleDownloadPDF}
                    >
                      <Signature className="h-4 w-4 mr-2" />
                      <span>PDF</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.error ? (
              // Show error if research failed
              <div className="text-red-500">
                <p className="font-semibold">Research Error:</p>
                <p>{searchResults.error}</p>
              </div>
            ) : searchResults.report ? (
              // Show the actual research report
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{searchResults.report.title}</h2>
                
                {/* Main report content */}
                <MagicDown
                  className="min-h-72"
                  value={searchResults.report.content}
                  onChange={() => {}} // Read-only, no changes needed
                />
                
                {/* Show individual sections if available */}
                {searchResults.report.sections && Object.entries(searchResults.report.sections).length > 0 && (
                  <div className="mt-6 space-y-6">
                    {Object.entries(searchResults.report.sections).map(([sectionId, content]) => (
                      <div key={sectionId}>
                        <MagicDown
                          className="min-h-24"
                          value={content as string}
                          onChange={() => {}} // Read-only, no changes needed
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Sources */}
                {searchResults.sources && searchResults.sources.length > 0 && (
                  <div className="mt-8 pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-2">Sources</h3>
                    <ul className="space-y-1">
                      {searchResults.sources.map((source: any, index: number) => (
                        <li key={index}>
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {source.title || source.url}
                          </a>
                          {source.relevance && (
                            <span className="text-gray-500 text-xs ml-2">
                              - {source.relevance}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              // Fallback to showing raw data during development
              <pre className="text-sm overflow-x-auto">{JSON.stringify(searchResults, null, 2)}</pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
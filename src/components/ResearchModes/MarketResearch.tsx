"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettingStore } from "@/store/setting";
import {
  getProviderApiKey,
  resolveActiveProvider,
  resolveProviderModels,
} from "@/utils/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Search, Loader2, BarChart, PieChart, LineChart, Download, FileText, Signature } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadFile } from "@/utils/file";
import dynamic from "next/dynamic";

const MagicDown = dynamic(() => import("@/components/MagicDown"));

export default function MarketResearch() {
  const { t } = useTranslation();
  const settingStore = useSettingStore();
  const [marketTopic, setMarketTopic] = useState("");
  const [researchType, setResearchType] = useState("industry");
  const [timeframe, setTimeframe] = useState("current");
  const [specificQuestions, setSpecificQuestions] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const handleDownloadMarkdown = () => {
    if (!analysisResults?.report) return;
    
    const content = analysisResults.report.content || 
      `# Market Research: ${marketTopic}\n\n${JSON.stringify(analysisResults, null, 2)}`;
    
    downloadFile(
      content,
      `${marketTopic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-market-research.md`,
      "text/markdown;charset=utf-8"
    );
  };

  const handleDownloadPDF = () => {
    if (!analysisResults) return;
    
    const originalTitle = document.title;
    document.title = `${marketTopic} - Market Research Analysis`;
    window.print();
    document.title = originalTitle;
  };

  const handleAnalyze = async () => {
    if (!marketTopic.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResults(null);
    setProgress(0);
    setProgressMessage("");

    try {
      // Determine the active AI provider and resolve the model pair with safe fallbacks
      const currentProvider = resolveActiveProvider(settingStore);
      const { thinkingModel, taskModel } = resolveProviderModels(
        settingStore,
        currentProvider,
      );

      // Create market research query with explicit context so the backend receives
      // a structured brief that captures the chosen research type, timeframe, and
      // any custom questions the user provided.
      const researchTypeLabels: Record<string, string> = {
        industry: t(
          "marketResearch.industryAnalysis",
          "Industry structure and key segments",
        ),
        competitive: t(
          "marketResearch.competitiveLandscape",
          "Competitive landscape and positioning",
        ),
        trends: t(
          "marketResearch.trendsForecast",
          "Emerging trends and forward-looking insights",
        ),
      };

      const timeframeLabels: Record<string, string> = {
        current: t("marketResearch.currentState", "Current state"),
        "1year": t("marketResearch.past1Year", "Past 12 months"),
        "3years": t("marketResearch.past3Years", "Past 3 years"),
        "5years": t("marketResearch.past5Years", "Past 5 years"),
        future: t(
          "marketResearch.futureProjections",
          "Future projections",
        ),
      };

      const querySections = [
        `Market Topic: ${marketTopic.trim()}`,
        `Research Focus: ${researchTypeLabels[researchType] || researchType}`,
        `Timeframe: ${timeframeLabels[timeframe] || timeframe}`,
      ];

      if (specificQuestions.trim()) {
        querySections.push(
          `Key Questions: ${specificQuestions.trim().replace(/\s+/g, " ")}`,
        );
      }

      const marketQuery = querySections.join("\n\n");

      // Get API keys from user settings
      const aiApiKey = getProviderApiKey(settingStore, currentProvider);
      const searchProvider = settingStore.searchProvider || "model";
      const searchApiKey = getProviderApiKey(settingStore, searchProvider);

      const requestBody = {
        query: marketQuery,
        provider: currentProvider,
        thinkingModel: thinkingModel,
        taskModel: taskModel,
        searchProvider: searchProvider,
        language: "en-US",
        maxResult: 10,
        enableCitationImage: true,
        enableReferences: true,
        temperature: settingStore.temperature,
        // Pass user's API keys
        aiApiKey: aiApiKey,
        searchApiKey: searchApiKey,
      };

      const accessPassword = settingStore.accessPassword?.trim();

      const response = await fetch("/api/sse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessPassword && {
            Authorization: `Bearer ${accessPassword}`,
          }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = "";
        try {
          const data = await response.json();
          if (typeof data === "string") {
            errorMessage = data;
          } else if (data && (data.message || data.error)) {
            errorMessage = data.message || data.error;
          } else {
            errorMessage = JSON.stringify(data);
          }
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(
          `Research failed${errorMessage ? ": " + errorMessage : ""}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;

          const eventType = eventLine.replace("event:", "").trim();
          let parsedData: unknown;
          try {
            parsedData = JSON.parse(dataLine.replace("data:", "").trim());
          } catch (error) {
            console.error("Failed to parse SSE payload", error, { eventType, dataLine });
            continue;
          }

          const data = parsedData as Record<string, any>;

          switch (eventType) {
            case "progress": {
              // Map known steps to rough completion percentages
              const stepProgress: Record<string, number> = {
                "report-plan": 25,
                "task-list": 50,
                "search-task": 75,
                "final-report": 100,
              };

              if (data.step === "final-report" && data.status === "end") {
                // Transform final report structure to match expected format
                setAnalysisResults({
                  report: {
                    title: data.data?.title,
                    content: data.data?.finalReport,
                  },
                  learnings: data.data?.learnings,
                  sources: data.data?.sources,
                  images: data.data?.images,
                });
                setProgress(100);
                done = true;
              } else {
                if (typeof data.percentage === "number") {
                  setProgress(data.percentage);
                } else if (data.step && data.status === "end") {
                  const p = stepProgress[data.step];
                  if (p !== undefined) setProgress(p);
                }
                if (data.message) setProgressMessage(data.message);
              }
              break;
            }
            case "message":
              if (data && typeof data === "object") {
                setAnalysisResults((prev: any) => ({ ...prev, ...data }));
              }
              break;
            case "complete":
              setAnalysisResults(data);
              setProgress(100);
              done = true;
              break;
            case "error":
              throw new Error(data.message || "Research failed");
          }
        }
      }
    } catch (error) {
      console.error("Market research error:", error);
      setAnalysisResults({
        error: error instanceof Error ? error.message : "Research failed",
        topic: marketTopic,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t("marketResearch.title", "Market Research & Analysis - TO BE IMPLEMNETED")}
          </CardTitle>
          <CardDescription>
            {t("marketResearch.description", "Analyze market trends, industry dynamics, competitive landscapes, and growth opportunities.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="market-topic">
              {t("marketResearch.marketTopic", "Market/Industry Topic")}
            </Label>
            <Input
              id="market-topic"
              placeholder={t("marketResearch.topicPlaceholder", "e.g., Pentesting Software, Data Quality, Cloud Security, etc.")}
              value={marketTopic}
              onChange={(e) => setMarketTopic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("marketResearch.researchType", "Research Type")}</Label>
            <RadioGroup value={researchType} onValueChange={setResearchType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="industry" id="industry" />
                <Label htmlFor="industry" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    {t("marketResearch.industryAnalysis", "Industry Analysis")}
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="competitive" id="competitive" />
                <Label htmlFor="competitive" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    {t("marketResearch.competitiveLandscape", "Competitive Landscape")}
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trends" id="trends" />
                <Label htmlFor="trends" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    {t("marketResearch.trendsForecast", "Trends & Forecast")}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeframe">
              {t("marketResearch.timeframe", "Analysis Timeframe")}
            </Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger id="timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  {t("marketResearch.currentState", "Current State")}
                </SelectItem>
                <SelectItem value="1year">
                  {t("marketResearch.past1Year", "Past 1 Year")}
                </SelectItem>
                <SelectItem value="3years">
                  {t("marketResearch.past3Years", "Past 3 Years")}
                </SelectItem>
                <SelectItem value="5years">
                  {t("marketResearch.past5Years", "Past 5 Years")}
                </SelectItem>
                <SelectItem value="future">
                  {t("marketResearch.futureProjections", "Future Projections")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specific-questions">
              {t("marketResearch.specificQuestions", "Specific Questions (Optional)")}
            </Label>
            <Textarea
              id="specific-questions"
              placeholder={t("marketResearch.questionsPlaceholder", "Any specific aspects you want to explore? (e.g., market size, growth rate, key players, barriers to entry)")}
              value={specificQuestions}
              onChange={(e) => setSpecificQuestions(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!marketTopic.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("marketResearch.analyzing", "Analyzing Market...")}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {t("marketResearch.startAnalysis", "Start Market Analysis")}
              </>
            )}
          </Button>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progressMessage || t("marketResearch.analyzing", "Analyzing Market...")}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResults && (
        <Card className="print:border-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("marketResearch.results", "Market Analysis Results")}</span>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisResults.report ? (
              <MagicDown
                className="min-h-72"
                value={analysisResults.report.content}
                onChange={() => {}} // Read-only
              />
            ) : (
              <pre className="text-sm">{JSON.stringify(analysisResults, null, 2)}</pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
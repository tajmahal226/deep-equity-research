"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Search, Loader2, BarChart, PieChart, LineChart, Download, FileText, Signature } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [marketTopic, setMarketTopic] = useState("");
  const [researchType, setResearchType] = useState("industry");
  const [timeframe, setTimeframe] = useState("current");
  const [specificQuestions, setSpecificQuestions] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

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
    // TODO: Implement market research logic
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResults({
        topic: marketTopic,
        type: researchType,
        timeframe: timeframe,
        status: "Market research functionality to be implemented"
      });
    }, 2500);
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
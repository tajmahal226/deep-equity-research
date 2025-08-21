/**
 * Research Tabs Component
 * 
 * This component provides a two-row tab navigation system for all research modes.
 * First row: Core research features (Company Deep Dive, Bulk Company, Market Research, Free-Form)
 * Second row: Additional features (Company Discovery, Case Studies, Doc Storage, Prompt Library)
 * 
 * The component uses Radix UI tabs with responsive design:
 * - Desktop: Shows full tab names
 * - Mobile: Shows abbreviated names
 */

"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Search,
  Compass,
  BookOpen,
  FolderOpen,
  Library
} from "lucide-react";

interface ResearchTabsProps {
  defaultTab?: string;
  children: {
    // First row tabs
    companyDeepDive: React.ReactNode;
    bulkCompanyResearch: React.ReactNode;
    marketResearch: React.ReactNode;
    freeFormResearch: React.ReactNode;
    // Second row tabs
    companyDiscovery: React.ReactNode;
    caseStudies: React.ReactNode;
    docStorage: React.ReactNode;
    promptLibrary: React.ReactNode;
  };
}

export default function ResearchTabs({ 
  defaultTab = "free-form", 
  children 
}: ResearchTabsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Two rows of tabs */}
      <div className="space-y-2 mb-6">
        {/* First row - Core Research Features */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company-deep-dive" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabs.companyDeepDive", "Company Deep Dive")}</span>
            <span className="sm:hidden">Company</span>
          </TabsTrigger>
          <TabsTrigger value="bulk-company" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabs.bulkCompanyResearch", "Bulk Company Research")}</span>
            <span className="sm:hidden">Bulk</span>
          </TabsTrigger>
          <TabsTrigger value="market-research" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabs.marketResearch", "Market Research")}</span>
            <span className="sm:hidden">Market</span>
          </TabsTrigger>
          <TabsTrigger value="free-form" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabs.freeFormDeepResearch", "Free-Form Deep Research")}</span>
            <span className="sm:hidden">Free-Form</span>
          </TabsTrigger>
        </TabsList>

        {/* Second row - Additional Features */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company-discovery" className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabs.companyDiscovery", "Company Discovery")}</span>
            <span className="sm:hidden">Discovery</span>
          </TabsTrigger>
          <TabsTrigger value="case-studies" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabs.caseStudies", "Case Studies")}</span>
            <span className="sm:hidden">Cases</span>
          </TabsTrigger>
          <TabsTrigger value="doc-storage" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabs.docStorage", "Doc Storage")}</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="prompt-library" className="flex items-center gap-2">
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">{t("tabs.promptLibrary", "Prompt Library")}</span>
            <span className="sm:hidden">Prompts</span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      {/* Tab Contents - First Row */}
      <TabsContent value="company-deep-dive" className="mt-0">
        {children.companyDeepDive}
      </TabsContent>
      
      <TabsContent value="bulk-company" className="mt-0">
        {children.bulkCompanyResearch}
      </TabsContent>
      
      <TabsContent value="market-research" className="mt-0">
        {children.marketResearch}
      </TabsContent>
      
      <TabsContent value="free-form" className="mt-0">
        {children.freeFormResearch}
      </TabsContent>

      {/* Tab Contents - Second Row */}
      <TabsContent value="company-discovery" className="mt-0">
        {children.companyDiscovery}
      </TabsContent>
      
      <TabsContent value="case-studies" className="mt-0">
        {children.caseStudies}
      </TabsContent>
      
      <TabsContent value="doc-storage" className="mt-0">
        {children.docStorage}
      </TabsContent>
      
      <TabsContent value="prompt-library" className="mt-0">
        {children.promptLibrary}
      </TabsContent>
    </Tabs>
  );
}
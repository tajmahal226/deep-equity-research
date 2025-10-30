/**
 * Company Discovery Component
 * 
 * AI-powered company search and discovery interface
 */

"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Search, 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign,
  MapPin,
  Calendar,
  Star,
  ExternalLink,
  Save,
  Grid3X3,
  List,
  Loader2,
  Target,
  Briefcase,
  Globe,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanyDiscoveryStore, CompanyResult } from "@/store/companyDiscovery";
import { defaultIndustries, defaultLocations, defaultFundingStages } from "@/store/companyDiscovery";
import { useFinancialData } from "@/hooks/useFinancialData";
import { toast } from "sonner";
import { filterCompanies } from "@/utils/company-filters";
import { nanoid } from "nanoid";
import Plimit from "p-limit";

interface SearchProgress {
  step: string;
  status: string;
}

export default function CompanyDiscovery() {
  const { t } = useTranslation();
  const {
    companies,
    isSearching,
    addCompany,
    saveSearch,
    setSearching,
    addRecentSearch,
  } = useCompanyDiscoveryStore();

  const { 
    searchCompanies: searchFinancialCompanies, 
    getCompanyProfile
  } = useFinancialData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedFundingStages, setSelectedFundingStages] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [excludeKeywordInput, setExcludeKeywordInput] = useState("");
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"relevance" | "funding" | "employees">("relevance");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);
  
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const [searchResults, setSearchResults] = useState<CompanyResult[]>([]);
  const [saveSearchForm, setSaveSearchForm] = useState({
    name: "",
    description: "",
  });


  // Handle search execution
  const executeSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setSearching(true);
    setSearchProgress(null);
    setSearchResults([]);
    addRecentSearch(searchQuery);

    try {
      // Use the financial data API for company search
      setSearchProgress({ step: "Searching companies", status: "Finding companies matching your criteria..." });
      
      const searchResponse = await searchFinancialCompanies(
        searchQuery,
        20,
        {
          industries: selectedIndustries,
          locations: selectedLocations,
          fundingStages: selectedFundingStages,
          keywords,
          excludeKeywords,
        } as any
      );
      
      if (searchResponse && searchResponse.results) {
        setSearchProgress({ step: "Processing results", status: "Enriching company data..." });
        
        // Convert financial search results to CompanyResult format
        const limit = Plimit(5);
        const enrichedCompanies = await Promise.all(
          searchResponse.results.map((result, index) =>
            limit(async () => {
              // Get additional company profile data
              const profile = await getCompanyProfile(result.ticker);

              const company: Omit<CompanyResult, "id" | "discoveredAt"> = {
                name: result.name,
                description: profile?.description || `${result.name} is a ${result.sector.toLowerCase()} company.`,
                industry: profile?.industry || result.sector,
                location: profile?.headquarters || "United States",
                website: profile?.website || `https://www.${result.ticker.toLowerCase()}.com`,
                employeeCount: profile?.employees ? `${profile.employees.toLocaleString()}+` : "1000+",
                fundingStage: "Public",
                totalFunding: result.marketCap,
                ticker: result.ticker,
                marketCap: result.marketCap,
                currentPrice: result.price,
                priceChange: result.change,
                priceChangePercent: result.changePercent,
                tags: [result.sector, "Public Company", "Financial Data Available"],
                matchScore: 100 - index, // Deterministic relevance score based on position
                reasoning: `Found through financial database search. Market cap: ${result.marketCap}, Current price: $${result.price}`,
                sources: ["Financial API", "Company Profile Database"],
                competitors: [],
                foundedYear: profile?.founded,
              };

              return company;
            })
          )
        );

        // Add identifiers before filtering so results can be tracked and displayed
        const enrichedWithIds: CompanyResult[] = enrichedCompanies.map((company) => ({
          ...company,
          id: nanoid(),
          discoveredAt: new Date(),
        }));

        // Don't re-filter - search API already handles filtering
        const filteredCompanies = enrichedWithIds;

        setSearchResults(filteredCompanies);

        // Add to store
        filteredCompanies.forEach((company) => {
          addCompany(company);
        });
        setSearchProgress(null);
        toast.success(`Search completed! Found ${filteredCompanies.length} companies`);
      } else {
        throw new Error("No results found");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
      setSearchProgress(null);
    } finally {
      setSearching(false);
    }
  };

  // Filter and sort companies
  const filteredAndSortedCompanies = () => {
    const base = searchResults.length > 0 ? searchResults : companies;
    const filtered = filterCompanies(base, {
      industries: selectedIndustries,
      locations: selectedLocations,
      fundingStages: selectedFundingStages,
      keywords,
      excludeKeywords,
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "funding":
          const fundingOrder = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Series D+", "Growth/Late Stage", "Public"];
          return fundingOrder.indexOf(b.fundingStage) - fundingOrder.indexOf(a.fundingStage);
        case "employees":
          const getEmployeeCount = (range: string) => {
            const numbers = range.match(/\d+/g);
            return numbers ? parseInt(numbers[0]) : 0;
          };
          return getEmployeeCount(b.employeeCount || "0") - getEmployeeCount(a.employeeCount || "0");
        case "relevance":
        default:
          return (b.matchScore || 0) - (a.matchScore || 0);
      }
    });
  };

  // Keyword management
  const addKeyword = (type: "include" | "exclude") => {
    const input = type === "include" ? keywordInput : excludeKeywordInput;
    const current = type === "include" ? keywords : excludeKeywords;
    const setter = type === "include" ? setKeywords : setExcludeKeywords;
    const inputSetter = type === "include" ? setKeywordInput : setExcludeKeywordInput;
    
    if (input && !current.includes(input)) {
      setter([...current, input.trim()]);
      inputSetter("");
    }
  };

  const removeKeyword = (keyword: string, type: "include" | "exclude") => {
    if (type === "include") {
      setKeywords(keywords.filter(k => k !== keyword));
    } else {
      setExcludeKeywords(excludeKeywords.filter(k => k !== keyword));
    }
  };

  // Save search functionality
  const handleSaveSearch = () => {
    if (!saveSearchForm.name.trim()) {
      toast.error("Please enter a search name");
      return;
    }

    saveSearch({
      name: saveSearchForm.name,
      description: saveSearchForm.description,
      industries: selectedIndustries,
      locations: selectedLocations,
      fundingStages: selectedFundingStages,
      employeeRanges: [],
      revenueRanges: [],
      keywords,
      excludeKeywords,
      similarCompanies: [],
    });

    toast.success("Search saved successfully!");
    setShowSaveDialog(false);
    setSaveSearchForm({ name: "", description: "" });
  };

  const openCompanyDetails = (company: CompanyResult) => {
    setSelectedCompany(company);
    setShowCompanyDialog(true);
  };

  const getFundingStageColor = (stage: string) => {
    switch (stage) {
      case "Pre-Seed": return "bg-gray-100 text-gray-800";
      case "Seed": return "bg-yellow-100 text-yellow-800";
      case "Series A": return "bg-blue-100 text-blue-800";
      case "Series B": return "bg-green-100 text-green-800";
      case "Series C": return "bg-purple-100 text-purple-800";
      case "Series D+": return "bg-indigo-100 text-indigo-800";
      case "Growth/Late Stage": return "bg-orange-100 text-orange-800";
      case "Public": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t("companyDiscovery.title", "Company Discovery")}
          </CardTitle>
          <CardDescription>
            Use AI-powered search to discover companies matching your investment criteria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Interface */}
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Describe the companies you're looking for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSearching) {
                      executeSearch();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={executeSearch} 
                disabled={isSearching || !searchQuery.trim()}
                className="min-w-[100px]"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Industries */}
              <div>
                <Label className="text-sm font-medium">Industries</Label>
                <Select onValueChange={(value) => {
                  if (value && !selectedIndustries.includes(value)) {
                    setSelectedIndustries([...selectedIndustries, value]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industries..." />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultIndustries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedIndustries.map((industry) => (
                    <Badge 
                      key={industry} 
                      variant="secondary" 
                      className="text-xs cursor-pointer"
                      onClick={() => setSelectedIndustries(selectedIndustries.filter(i => i !== industry))}
                    >
                      {industry} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <Label className="text-sm font-medium">Locations</Label>
                <Select onValueChange={(value) => {
                  if (value && !selectedLocations.includes(value)) {
                    setSelectedLocations([...selectedLocations, value]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select locations..." />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedLocations.map((location) => (
                    <Badge 
                      key={location} 
                      variant="secondary" 
                      className="text-xs cursor-pointer"
                      onClick={() => setSelectedLocations(selectedLocations.filter(l => l !== location))}
                    >
                      {location} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Funding Stages */}
              <div>
                <Label className="text-sm font-medium">Funding Stages</Label>
                <Select onValueChange={(value) => {
                  if (value && !selectedFundingStages.includes(value)) {
                    setSelectedFundingStages([...selectedFundingStages, value]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stages..." />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultFundingStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedFundingStages.map((stage) => (
                    <Badge 
                      key={stage} 
                      variant="secondary" 
                      className="text-xs cursor-pointer"
                      onClick={() => setSelectedFundingStages(selectedFundingStages.filter(s => s !== stage))}
                    >
                      {stage} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Include Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword("include");
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={() => addKeyword("include")}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {keywords.map((keyword) => (
                    <Badge 
                      key={keyword} 
                      variant="outline" 
                      className="text-xs cursor-pointer"
                      onClick={() => removeKeyword(keyword, "include")}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Exclude Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword to exclude..."
                    value={excludeKeywordInput}
                    onChange={(e) => setExcludeKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword("exclude");
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={() => addKeyword("exclude")}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {excludeKeywords.map((keyword) => (
                    <Badge 
                      key={keyword} 
                      variant="destructive" 
                      className="text-xs cursor-pointer"
                      onClick={() => removeKeyword(keyword, "exclude")}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSaveDialog(true)}
                disabled={!searchQuery.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </Button>
            </div>
          </div>

          {/* Search Progress */}
          {searchProgress && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{searchProgress.step}</div>
                    <div className="text-sm text-muted-foreground">{searchProgress.status}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Header */}
          {(filteredAndSortedCompanies().length > 0 || searchResults.length > 0) && (
            <div className="flex justify-between items-center mt-6">
              <div>
                <h3 className="text-lg font-semibold">
                  {filteredAndSortedCompanies().length} Companies Found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Discover companies matching your criteria
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="funding">Funding Stage</SelectItem>
                    <SelectItem value="employees">Team Size</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {filteredAndSortedCompanies().length === 0 && !isSearching ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or enter a new search query
              </p>
              <Button onClick={() => setSearchQuery("")}>
                <Search className="w-4 h-4 mr-2" />
                Start New Search
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {filteredAndSortedCompanies().map((company) => (
                <Card key={company.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 truncate">{company.name}</h4>
                        <Badge className={`text-xs ${getFundingStageColor(company.fundingStage)}`}>
                          {company.fundingStage}
                        </Badge>
                      </div>
                      {company.matchScore && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          {company.matchScore}%
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {company.description}
                    </p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{company.industry}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{company.location}</span>
                      </div>
                      {company.ticker && company.currentPrice && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono">
                            {company.ticker}: ${company.currentPrice}
                          </span>
                          {company.priceChangePercent && (
                            <span className={`text-xs font-medium ${
                              parseFloat(company.priceChangePercent) >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {parseFloat(company.priceChangePercent) >= 0 ? '+' : ''}{company.priceChangePercent}%
                            </span>
                          )}
                        </div>
                      )}
                      {company.employeeCount && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span>{company.employeeCount} employees</span>
                        </div>
                      )}
                      {(company.marketCap || company.totalFunding) && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span>{company.marketCap || company.totalFunding} {company.marketCap ? 'market cap' : 'raised'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {company.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {company.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{company.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openCompanyDetails(company)}
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                      {company.website && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(company.website, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3 mt-6">
              {filteredAndSortedCompanies().map((company) => (
                <Card key={company.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">{company.name}</h4>
                            <Badge className={`text-xs ${getFundingStageColor(company.fundingStage)}`}>
                              {company.fundingStage}
                            </Badge>
                            {company.matchScore && (
                              <div className="flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                {company.matchScore}%
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {company.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {company.industry}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {company.location}
                            </span>
                            {company.ticker && company.currentPrice && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span className="font-mono">
                                  {company.ticker}: ${company.currentPrice}
                                  {company.priceChangePercent && (
                                    <span className={`ml-1 font-medium ${
                                      parseFloat(company.priceChangePercent) >= 0 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                    }`}>
                                      {parseFloat(company.priceChangePercent) >= 0 ? '+' : ''}{company.priceChangePercent}%
                                    </span>
                                  )}
                                </span>
                              </span>
                            )}
                            {(company.marketCap || company.totalFunding) && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {company.marketCap || company.totalFunding}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {company.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openCompanyDetails(company)}
                          >
                            <BookOpen className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                          {company.website && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(company.website, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save this search configuration for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="searchName">Search Name</Label>
              <Input
                id="searchName"
                value={saveSearchForm.name}
                onChange={(e) => setSaveSearchForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter search name..."
              />
            </div>
            <div>
              <Label htmlFor="searchDescription">Description (optional)</Label>
              <Textarea
                id="searchDescription"
                value={saveSearchForm.description}
                onChange={(e) => setSaveSearchForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this search..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch}>
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Details Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedCompany?.name}
              {selectedCompany?.website && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(selectedCompany.website, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed company information and analysis
            </DialogDescription>
          </DialogHeader>
          
          {selectedCompany && (
            <div className="space-y-6">
              {/* Company Overview */}
              <div>
                <h4 className="font-semibold mb-3">Company Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Briefcase className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{selectedCompany.industry}</div>
                    <div className="text-xs text-muted-foreground">Industry</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <MapPin className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{selectedCompany.location}</div>
                    <div className="text-xs text-muted-foreground">Location</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{selectedCompany.fundingStage}</div>
                    <div className="text-xs text-muted-foreground">Stage</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{selectedCompany.foundedYear || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">Founded</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{selectedCompany.description}</p>
              </div>

              {/* Financial Information */}
              {(selectedCompany.totalFunding || selectedCompany.revenue || selectedCompany.ticker) && (
                <div>
                  <h4 className="font-semibold mb-3">Financial Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCompany.ticker && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Ticker:</strong> {selectedCompany.ticker}
                        </span>
                      </div>
                    )}
                    {selectedCompany.currentPrice && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-mono">
                          <strong>Current Price:</strong> ${selectedCompany.currentPrice}
                          {selectedCompany.priceChangePercent && (
                            <span className={`ml-2 font-medium ${
                              parseFloat(selectedCompany.priceChangePercent) >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              ({parseFloat(selectedCompany.priceChangePercent) >= 0 ? '+' : ''}{selectedCompany.priceChangePercent}%)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {selectedCompany.marketCap && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Market Cap:</strong> ${selectedCompany.marketCap}
                        </span>
                      </div>
                    )}
                    {selectedCompany.totalFunding && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Total Funding:</strong> {selectedCompany.totalFunding}
                        </span>
                      </div>
                    )}
                    {selectedCompany.revenue && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Revenue Range:</strong> {selectedCompany.revenue}
                        </span>
                      </div>
                    )}
                    {selectedCompany.employeeCount && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Employee Count:</strong> {selectedCompany.employeeCount}
                        </span>
                      </div>
                    )}
                    {selectedCompany.lastFundingDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Last Funding:</strong> {new Date(selectedCompany.lastFundingDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h4 className="font-semibold mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCompany.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Competitors */}
              {selectedCompany.competitors && selectedCompany.competitors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Key Competitors</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.competitors.map((competitor) => (
                      <Badge key={competitor} variant="outline">
                        {competitor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Analysis */}
              {selectedCompany.reasoning && (
                <div>
                  <h4 className="font-semibold mb-3">Match Analysis</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">
                        Match Score: {selectedCompany.matchScore}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedCompany.reasoning}</p>
                  </div>
                </div>
              )}

              {/* Sources */}
              {selectedCompany.sources && selectedCompany.sources.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Data Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.sources.map((source) => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompanyDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
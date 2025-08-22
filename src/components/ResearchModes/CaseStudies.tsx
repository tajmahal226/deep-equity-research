/**
 * Case Studies Component
 * 
 * Comprehensive case study management system for investment analysis
 */

"use client";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Users,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Download,
  Share2,
  Tag,
  Star,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
  MapPin,
  ExternalLink,
  Paperclip,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCaseStudiesStore, CaseStudy, Milestone } from "@/store/caseStudies";
import { toast } from "sonner";

export default function CaseStudies() {
  const { t } = useTranslation();
  const {
    caseStudies,
    templates,
    categories,
    tags: availableTags,
    addCaseStudy,
    updateCaseStudy,
    removeCaseStudy,
    duplicateCaseStudy,
    addMilestone,
    searchCaseStudies,
    getCaseStudiesByCategory,
    getCaseStudiesByStatus,
    getPerformanceMetrics,
    getCaseStudyById,
  } = useCaseStudiesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState<CaseStudy | null>(null);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  
  const [caseStudyForm, setCaseStudyForm] = useState({
    title: "",
    description: "",
    companyName: "",
    industry: "",
    fundingStage: "",
    dealSize: "",
    investmentThesis: "",
    status: "active" as CaseStudy["status"],
    category: "",
    tags: [] as string[],
    author: "Current User", // Would be dynamic in real app
    valuation: "",
    ownership: "",
    leadInvestor: "",
    coinvestors: [] as string[],
    keyMetrics: [] as string[],
    risks: [] as string[],
    mitigationStrategies: [] as string[],
    lessonsLearned: [] as string[],
    whatWorked: [] as string[],
    whatDidntWork: [] as string[],
    isPublic: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    type: "business" as Milestone["type"],
    impact: "positive" as Milestone["impact"],
  });

  // Performance metrics
  const performanceMetrics = useMemo(() => getPerformanceMetrics(), [caseStudies]);

  // Filter case studies
  const filteredCaseStudies = useMemo(() => {
    let filtered = caseStudies;

    if (searchQuery) {
      filtered = searchCaseStudies(searchQuery);
    } else {
      if (selectedCategory !== "all") {
        filtered = getCaseStudiesByCategory(selectedCategory);
      }
      if (selectedStatus !== "all") {
        filtered = getCaseStudiesByStatus(selectedStatus as CaseStudy["status"]);
      }
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [caseStudies, searchQuery, selectedCategory, selectedStatus, searchCaseStudies, getCaseStudiesByCategory, getCaseStudiesByStatus]);

  // Form handlers
  const handleCreateCaseStudy = () => {
    if (!caseStudyForm.title.trim() || !caseStudyForm.companyName.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    const newCaseStudy = {
      ...caseStudyForm,
      investmentDate: new Date(),
      keyMilestones: [],
      collaborators: [],
      attachments: [],
    };

    addCaseStudy(newCaseStudy);
    toast.success("Case study created successfully!");
    resetForm();
    setShowCreateDialog(false);
  };

  const handleUpdateCaseStudy = () => {
    if (!editingCaseStudy) return;

    updateCaseStudy(editingCaseStudy.id, caseStudyForm);
    toast.success("Case study updated successfully!");
    setEditingCaseStudy(null);
    resetForm();
    setShowCreateDialog(false);
  };

  const handleDeleteCaseStudy = (id: string) => {
    removeCaseStudy(id);
    toast.success("Case study deleted successfully!");
  };

  const startEditing = (caseStudy: CaseStudy) => {
    setEditingCaseStudy(caseStudy);
    setCaseStudyForm({
      title: caseStudy.title,
      description: caseStudy.description,
      companyName: caseStudy.companyName,
      industry: caseStudy.industry,
      fundingStage: caseStudy.fundingStage,
      dealSize: caseStudy.dealSize || "",
      investmentThesis: caseStudy.investmentThesis,
      status: caseStudy.status,
      category: caseStudy.category,
      tags: caseStudy.tags,
      author: caseStudy.author,
      valuation: caseStudy.valuation || "",
      ownership: caseStudy.ownership || "",
      leadInvestor: caseStudy.leadInvestor || "",
      coinvestors: caseStudy.coinvestors,
      keyMetrics: caseStudy.keyMetrics,
      risks: caseStudy.risks,
      mitigationStrategies: caseStudy.mitigationStrategies,
      lessonsLearned: caseStudy.lessonsLearned,
      whatWorked: caseStudy.whatWorked,
      whatDidntWork: caseStudy.whatDidntWork,
      isPublic: caseStudy.isPublic,
    });
    setShowCreateDialog(true);
  };

  const viewDetails = (caseStudy: CaseStudy) => {
    setSelectedCaseStudy(caseStudy);
    setShowDetailsDialog(true);
  };

  const resetForm = () => {
    setCaseStudyForm({
      title: "",
      description: "",
      companyName: "",
      industry: "",
      fundingStage: "",
      dealSize: "",
      investmentThesis: "",
      status: "active",
      category: "",
      tags: [],
      author: "Current User",
      valuation: "",
      ownership: "",
      leadInvestor: "",
      coinvestors: [],
      keyMetrics: [],
      risks: [],
      mitigationStrategies: [],
      lessonsLearned: [],
      whatWorked: [],
      whatDidntWork: [],
      isPublic: false,
    });
    setTagInput("");
  };

  const addTag = () => {
    if (tagInput && !caseStudyForm.tags.includes(tagInput)) {
      setCaseStudyForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCaseStudyForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addListItem = (field: keyof typeof caseStudyForm, value: string) => {
    if (value.trim()) {
      setCaseStudyForm(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
    }
  };

  const removeListItem = (field: keyof typeof caseStudyForm, index: number) => {
    setCaseStudyForm(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: CaseStudy["status"]) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "exited": return "bg-blue-100 text-blue-800";
      case "write-off": return "bg-red-100 text-red-800";
      case "monitoring": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getOutcomeIcon = (outcome?: CaseStudy["outcome"]) => {
    switch (outcome) {
      case "success": return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "partial": return <TrendingDown className="w-4 h-4 text-yellow-500" />;
      case "failure": return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t("caseStudies.title", "Case Studies")}
          </CardTitle>
          <CardDescription>
            Build and manage investment case studies to track performance and learnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{performanceMetrics.totalDeals}</div>
                    <div className="text-sm text-muted-foreground">Total Deals</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{performanceMetrics.activeDeals}</div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{performanceMetrics.exitedDeals}</div>
                    <div className="text-sm text-muted-foreground">Exited</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{performanceMetrics.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search case studies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
                <SelectItem value="write-off">Write-off</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Case Study
            </Button>
          </div>

          {/* Case Studies Display */}
          {filteredCaseStudies.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No case studies found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search or filters" : "Create your first case study to get started"}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Case Study
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCaseStudies.map((caseStudy) => (
                <Card key={caseStudy.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 truncate">{caseStudy.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${getStatusColor(caseStudy.status)}`}>
                            {caseStudy.status}
                          </Badge>
                          {caseStudy.outcome && getOutcomeIcon(caseStudy.outcome)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewDetails(caseStudy)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startEditing(caseStudy)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateCaseStudy(caseStudy.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCaseStudy(caseStudy.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2 text-xs mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{caseStudy.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{caseStudy.industry}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-muted-foreground" />
                        <span>{caseStudy.fundingStage}</span>
                      </div>
                      {caseStudy.dealSize && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span>{caseStudy.dealSize}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {caseStudy.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {caseStudy.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {caseStudy.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{caseStudy.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Updated {new Date(caseStudy.updatedAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{caseStudy.collaborators.length + 1}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Case Study Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCaseStudy ? "Edit Case Study" : "Create New Case Study"}
            </DialogTitle>
            <DialogDescription>
              {editingCaseStudy ? "Update case study details" : "Document your investment case study"}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="thesis">Investment Thesis</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Case Study Title *</Label>
                  <Input
                    id="title"
                    value={caseStudyForm.title}
                    onChange={(e) => setCaseStudyForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Case study title..."
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={caseStudyForm.companyName}
                    onChange={(e) => setCaseStudyForm(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Company name..."
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={caseStudyForm.description}
                  onChange={(e) => setCaseStudyForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the case study..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={caseStudyForm.industry}
                    onChange={(e) => setCaseStudyForm(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="Industry..."
                  />
                </div>
                <div>
                  <Label htmlFor="fundingStage">Funding Stage</Label>
                  <Select 
                    value={caseStudyForm.fundingStage} 
                    onValueChange={(value) => setCaseStudyForm(prev => ({ ...prev, fundingStage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                      <SelectItem value="Seed">Seed</SelectItem>
                      <SelectItem value="Series A">Series A</SelectItem>
                      <SelectItem value="Series B">Series B</SelectItem>
                      <SelectItem value="Series C">Series C</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dealSize">Deal Size</Label>
                  <Input
                    id="dealSize"
                    value={caseStudyForm.dealSize}
                    onChange={(e) => setCaseStudyForm(prev => ({ ...prev, dealSize: e.target.value }))}
                    placeholder="$10M"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={caseStudyForm.status} 
                    onValueChange={(value: CaseStudy["status"]) => setCaseStudyForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="exited">Exited</SelectItem>
                      <SelectItem value="write-off">Write-off</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={caseStudyForm.category} 
                    onValueChange={(value) => setCaseStudyForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {caseStudyForm.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="thesis" className="space-y-4">
              <div>
                <Label htmlFor="investmentThesis">Investment Thesis</Label>
                <Textarea
                  id="investmentThesis"
                  value={caseStudyForm.investmentThesis}
                  onChange={(e) => setCaseStudyForm(prev => ({ ...prev, investmentThesis: e.target.value }))}
                  placeholder="Why did we invest in this company? What was the opportunity and rationale?"
                  rows={6}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="valuation">Valuation</Label>
                  <Input
                    id="valuation"
                    value={caseStudyForm.valuation}
                    onChange={(e) => setCaseStudyForm(prev => ({ ...prev, valuation: e.target.value }))}
                    placeholder="$50M"
                  />
                </div>
                <div>
                  <Label htmlFor="ownership">Ownership %</Label>
                  <Input
                    id="ownership"
                    value={caseStudyForm.ownership}
                    onChange={(e) => setCaseStudyForm(prev => ({ ...prev, ownership: e.target.value }))}
                    placeholder="15%"
                  />
                </div>
                <div>
                  <Label htmlFor="leadInvestor">Lead Investor</Label>
                  <Input
                    id="leadInvestor"
                    value={caseStudyForm.leadInvestor}
                    onChange={(e) => setCaseStudyForm(prev => ({ ...prev, leadInvestor: e.target.value }))}
                    placeholder="Lead investor name"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Key Risks</Label>
                  <div className="space-y-2">
                    {caseStudyForm.risks.map((risk, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={risk} readOnly />
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeListItem("risks", index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add risk..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addListItem("risks", e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                          if (input?.value) {
                            addListItem("risks", input.value);
                            input.value = "";
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Key Metrics</Label>
                  <div className="space-y-2">
                    {caseStudyForm.keyMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={metric} readOnly />
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeListItem("keyMetrics", index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add metric..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addListItem("keyMetrics", e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                          if (input?.value) {
                            addListItem("keyMetrics", input.value);
                            input.value = "";
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="outcomes" className="space-y-4">
              <div>
                <Label>What Worked</Label>
                <div className="space-y-2">
                  {caseStudyForm.whatWorked.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={item} readOnly />
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeListItem("whatWorked", index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="What worked well..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addListItem("whatWorked", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        if (input?.value) {
                          addListItem("whatWorked", input.value);
                          input.value = "";
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Lessons Learned</Label>
                <div className="space-y-2">
                  {caseStudyForm.lessonsLearned.map((lesson, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={lesson} readOnly />
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeListItem("lessonsLearned", index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Key lesson..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addListItem("lessonsLearned", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        if (input?.value) {
                          addListItem("lessonsLearned", input.value);
                          input.value = "";
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingCaseStudy(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingCaseStudy ? handleUpdateCaseStudy : handleCreateCaseStudy}>
              {editingCaseStudy ? "Update Case Study" : "Create Case Study"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Case Study Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {selectedCaseStudy?.title}
            </DialogTitle>
            <DialogDescription>
              Detailed case study analysis and outcomes
            </DialogDescription>
          </DialogHeader>
          
          {selectedCaseStudy && (
            <div className="space-y-6">
              {/* Overview */}
              <div>
                <h4 className="font-semibold mb-3">Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Building2 className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{selectedCaseStudy.companyName}</div>
                    <div className="text-xs text-muted-foreground">Company</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Briefcase className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{selectedCaseStudy.industry}</div>
                    <div className="text-xs text-muted-foreground">Industry</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Target className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{selectedCaseStudy.fundingStage}</div>
                    <div className="text-xs text-muted-foreground">Stage</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{new Date(selectedCaseStudy.investmentDate).getFullYear()}</div>
                    <div className="text-xs text-muted-foreground">Investment</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{selectedCaseStudy.description}</p>
              </div>

              {/* Investment Thesis */}
              {selectedCaseStudy.investmentThesis && (
                <div>
                  <h4 className="font-semibold mb-3">Investment Thesis</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedCaseStudy.investmentThesis}</p>
                  </div>
                </div>
              )}

              {/* Key Metrics & Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedCaseStudy.keyMetrics.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Key Metrics</h4>
                    <ul className="space-y-2">
                      {selectedCaseStudy.keyMetrics.map((metric, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedCaseStudy.risks.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Key Risks</h4>
                    <ul className="space-y-2">
                      {selectedCaseStudy.risks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Outcomes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedCaseStudy.whatWorked.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">What Worked</h4>
                    <ul className="space-y-2">
                      {selectedCaseStudy.whatWorked.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedCaseStudy.lessonsLearned.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">Lessons Learned</h4>
                    <ul className="space-y-2">
                      {selectedCaseStudy.lessonsLearned.map((lesson, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Star className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-semibold mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCaseStudy.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              {selectedCaseStudy.keyMilestones.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Key Milestones</h4>
                  <div className="space-y-3">
                    {selectedCaseStudy.keyMilestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          milestone.impact === "positive" ? "bg-green-500" :
                          milestone.impact === "negative" ? "bg-red-500" : "bg-gray-500"
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm">{milestone.title}</h5>
                            <Badge variant="outline" className="text-xs">
                              {milestone.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{milestone.description}</p>
                          <div className="text-xs text-muted-foreground">
                            {new Date(milestone.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedCaseStudy) {
                startEditing(selectedCaseStudy);
                setShowDetailsDialog(false);
              }
            }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Case Study
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
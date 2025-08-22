/**
 * Enhanced Prompt Library Component
 * 
 * Full-featured prompt management system for research templates
 */

"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Library, 
  FileText, 
  Share2, 
  BarChart, 
  Search, 
  Plus, 
  Filter,
  Copy,
  Edit2,
  Trash2,
  Eye,
  Tag,
  TrendingUp,
  Clock,
  Star,
  Download,
  Upload
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
import { usePreFilledPromptsStore } from "@/store/preFilledPrompts";
import { toast } from "sonner";

interface PromptFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  isTemplate: boolean;
}

export default function PromptLibrary() {
  const { t } = useTranslation();
  const {
    prompts,
    categories,
    addPrompt,
    removePrompt,
    updatePrompt,
    incrementUsage,
    addCategory,
    getPromptsByCategory,
    searchPrompts,
  } = usePreFilledPromptsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [sortBy, setSortBy] = useState<"recent" | "usage" | "alphabetical">("recent");

  const [formData, setFormData] = useState<PromptFormData>({
    title: "",
    description: "",
    content: "",
    category: "",
    tags: [],
    isTemplate: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [newCategory, setNewCategory] = useState("");

  // Filter and sort prompts
  const filteredPrompts = () => {
    let filtered = searchQuery
      ? searchPrompts(searchQuery)
      : selectedCategory === "all"
      ? prompts
      : getPromptsByCategory(selectedCategory);

    // Sort prompts
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return b.usageCount - a.usageCount;
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "recent":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  const handleCreatePrompt = () => {
    if (!formData.title || !formData.content) {
      toast.error("Please fill in title and content");
      return;
    }

    if (formData.category && !categories.includes(formData.category)) {
      addCategory(formData.category);
    }

    addPrompt({
      ...formData,
      usageCount: 0,
    });

    toast.success("Prompt created successfully!");
    setShowCreateDialog(false);
    resetForm();
  };

  const handleUpdatePrompt = () => {
    if (!editingPrompt || !formData.title || !formData.content) return;

    if (formData.category && !categories.includes(formData.category)) {
      addCategory(formData.category);
    }

    updatePrompt(editingPrompt.id, formData);
    toast.success("Prompt updated successfully!");
    setEditingPrompt(null);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleDeletePrompt = (id: string) => {
    removePrompt(id);
    toast.success("Prompt deleted successfully!");
  };

  const handleCopyPrompt = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success("Prompt copied to clipboard!");
  };

  const handleUsePrompt = (prompt: any) => {
    incrementUsage(prompt.id);
    handleCopyPrompt(prompt.content);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      category: "",
      tags: [],
      isTemplate: false,
    });
    setTagInput("");
  };

  const startEditing = (prompt: any) => {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      description: prompt.description || "",
      content: prompt.content,
      category: prompt.category,
      tags: prompt.tags,
      isTemplate: prompt.isTemplate,
    });
    setShowCreateDialog(true);
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const exportPrompts = () => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'prompt-library.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Prompt library exported!");
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="w-5 h-5" />
            {t("promptLibrary.title", "Prompt Library")}
          </CardTitle>
          <CardDescription>
            Manage and organize your research prompts for consistent analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
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
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="usage">Most Used</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-6">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Prompt
            </Button>
            <Button variant="outline" onClick={exportPrompts}>
              <Download className="w-4 h-4 mr-2" />
              Export Library
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{prompts.length}</div>
                    <div className="text-sm text-muted-foreground">Total Prompts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{categories.length}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {prompts.reduce((acc, p) => acc + p.usageCount, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Uses</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {prompts.filter(p => p.isTemplate).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Templates</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrompts().map((prompt) => (
              <Card key={prompt.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium line-clamp-2">
                        {prompt.title}
                        {prompt.isTemplate && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Template
                          </Badge>
                        )}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {prompt.category}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUsePrompt(prompt)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Use & Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedPrompt(prompt);
                          setShowViewDialog(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startEditing(prompt)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {prompt.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {prompt.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {prompt.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {prompt.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{prompt.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BarChart className="w-3 h-3" />
                      {prompt.usageCount} uses
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPrompts().length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search or filters" : "Create your first prompt to get started"}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Prompt
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? "Edit Prompt" : "Create New Prompt"}
            </DialogTitle>
            <DialogDescription>
              {editingPrompt 
                ? "Update your prompt template"
                : "Create a new prompt template for your research workflow"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter prompt title..."
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this prompt does..."
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="New category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCategory) {
                      setFormData(prev => ({ ...prev, category: newCategory }));
                      setNewCategory("");
                    }
                  }}
                  className="flex-1"
                />
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
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="content">Prompt Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your prompt template here..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingPrompt(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingPrompt ? handleUpdatePrompt : handleCreatePrompt}>
              {editingPrompt ? "Update Prompt" : "Create Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPrompt?.title}
              {selectedPrompt?.isTemplate && (
                <Badge variant="secondary">Template</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedPrompt?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedPrompt && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="outline">{selectedPrompt.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BarChart className="w-3 h-3" />
                  {selectedPrompt.usageCount} uses
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Created {new Date(selectedPrompt.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedPrompt.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Prompt Content</h4>
                <ScrollArea className="h-60 w-full rounded border p-4">
                  <pre className="whitespace-pre-wrap text-sm">{selectedPrompt.content}</pre>
                </ScrollArea>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button onClick={() => selectedPrompt && handleUsePrompt(selectedPrompt)}>
              <Copy className="w-4 h-4 mr-2" />
              Use & Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
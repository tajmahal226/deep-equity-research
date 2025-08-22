/**
 * Enhanced Document Storage Component
 * 
 * Full-featured document management system for research materials
 */

"use client";
import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { 
  FolderOpen, 
  Upload, 
  Search, 
  Archive,
  FileText,
  File,
  Image,
  Play,
  Download,
  Eye,
  Edit2,
  Trash2,
  Tag,
  Filter,
  Grid3X3,
  List,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  Folder,
  SortAsc
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
import { useDocumentsStore, Document } from "@/store/documents";
import { toast } from "sonner";

interface UploadedFile extends File {
  id?: string;
  uploadProgress?: number;
  status?: "uploading" | "processing" | "completed" | "error";
}

export default function DocStorage() {
  const { t } = useTranslation();
  const {
    documents,
    categories,
    totalSize,
    addDocument,
    removeDocument,
    updateDocument,
    addCategory,
    getDocumentsByCategory,
    searchDocuments,
    clearAllDocuments,
  } = useDocumentsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentForm, setDocumentForm] = useState({
    name: "",
    description: "",
    category: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  // File type detection
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (type.includes('image')) return <Image className="w-4 h-4 text-green-500" />;
    if (type.includes('video')) return <Play className="w-4 h-4 text-blue-500" />;
    if (type.includes('presentation') || type.includes('powerpoint')) 
      return <FileText className="w-4 h-4 text-orange-500" />;
    if (type.includes('spreadsheet') || type.includes('excel')) 
      return <FileText className="w-4 h-4 text-green-600" />;
    if (type.includes('document') || type.includes('word')) 
      return <FileText className="w-4 h-4 text-blue-600" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter and sort documents
  const filteredDocuments = () => {
    let filtered = searchQuery
      ? searchDocuments(searchQuery)
      : selectedCategory === "all"
      ? documents
      : getDocumentsByCategory(selectedCategory);

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "size":
          return b.size - a.size;
        case "date":
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });
  };

  // File upload handlers
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).map(file => ({
      ...file,
      id: Math.random().toString(36),
      uploadProgress: 0,
      status: "uploading" as const,
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
    setShowUploadDialog(true);
    
    // Simulate file processing
    newFiles.forEach(file => simulateFileProcessing(file));
  };

  const simulateFileProcessing = async (file: UploadedFile) => {
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, uploadProgress: Math.min((f.uploadProgress || 0) + 10, 90) }
          : f
      ));
    }, 200);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    clearInterval(progressInterval);
    
    // Mark as completed and add to document store
    setUploadFiles(prev => prev.map(f => 
      f.id === file.id 
        ? { ...f, uploadProgress: 100, status: "completed" }
        : f
    ));

    // Extract basic metadata (in a real app, this would be done server-side)
    const extractedContent = await extractFileContent(file);
    
    addDocument({
      name: file.name.replace(/\.[^/.]+$/, ""),
      originalName: file.name,
      type: file.type,
      size: file.size,
      category: "Research Reports", // Default category
      tags: [],
      content: extractedContent,
      isProcessed: true,
      processingStatus: "completed",
      searchableContent: extractedContent?.substring(0, 1000) || "",
      extractedMetadata: {
        title: file.name.replace(/\.[^/.]+$/, ""),
        wordCount: extractedContent?.split(' ').length || 0,
      },
    });

    toast.success(`${file.name} uploaded successfully!`);
  };

  const extractFileContent = async (file: File): Promise<string> => {
    // Simple text extraction for demo purposes
    if (file.type === 'text/plain') {
      return await file.text();
    }
    // For other file types, return placeholder content
    return `Content extracted from ${file.name}. This would contain the actual extracted text in a real implementation.`;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const openDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowDocumentDialog(true);
  };

  const startEditing = (document: Document) => {
    setEditingDocument(document);
    setDocumentForm({
      name: document.name,
      description: document.description || "",
      category: document.category,
      tags: document.tags,
    });
    setShowDocumentDialog(true);
  };

  const handleUpdateDocument = () => {
    if (!editingDocument) return;
    
    updateDocument(editingDocument.id, {
      name: documentForm.name,
      description: documentForm.description,
      category: documentForm.category,
      tags: documentForm.tags,
    });
    
    toast.success("Document updated successfully!");
    setEditingDocument(null);
    setShowDocumentDialog(false);
    resetForm();
  };

  const handleDeleteDocument = (id: string) => {
    removeDocument(id);
    toast.success("Document deleted successfully!");
  };

  const resetForm = () => {
    setDocumentForm({
      name: "",
      description: "",
      category: "",
      tags: [],
    });
    setTagInput("");
  };

  const addTag = () => {
    if (tagInput && !documentForm.tags.includes(tagInput)) {
      setDocumentForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDocumentForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const clearUploads = () => {
    setUploadFiles([]);
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            {t("docStorage.title", "Document Storage")}
          </CardTitle>
          <CardDescription>
            Store and organize all your research documents in one place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{documents.length}</div>
                    <div className="text-sm text-muted-foreground">Total Documents</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-green-500" />
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
                  <HardDrive className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
                    <div className="text-sm text-muted-foreground">Storage Used</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {documents.filter(d => d.isProcessed).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Processed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
              dragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to select
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md"
            />
            <p className="text-xs text-muted-foreground">
              Supports PDF, Word, PowerPoint, Excel, and text files
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
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
                <SelectItem value="date">Most Recent</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="size">File Size</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
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

          {/* Documents Display */}
          {filteredDocuments().length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search or filters" : "Upload your first document to get started"}
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments().map((document) => (
                <Card key={document.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getFileIcon(document.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate text-sm">{document.name}</h4>
                          <Badge variant="outline" className="text-xs mt-1">
                            {document.category}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDocument(document)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startEditing(document)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {document.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {document.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {document.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {document.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{document.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{formatFileSize(document.size)}</span>
                      <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments().map((document) => (
                <Card key={document.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(document.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{document.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {document.category}
                            </Badge>
                            <span>{formatFileSize(document.size)}</span>
                            <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {document.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDocument(document)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startEditing(document)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDocument(document.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Progress</DialogTitle>
            <DialogDescription>
              Uploading and processing your documents
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-60">
            <div className="space-y-4">
              {uploadFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Progress value={file.uploadProgress || 0} className="flex-1" />
                    <div className="flex items-center gap-1">
                      {file.status === "completed" && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {file.status === "uploading" && <Clock className="w-4 h-4 text-blue-500" />}
                      {file.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                      <span className="text-xs text-muted-foreground">
                        {file.uploadProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={clearUploads}>
              Clear
            </Button>
            <Button onClick={() => setShowUploadDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Details/Edit Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? "Edit Document" : selectedDocument?.name}
            </DialogTitle>
            <DialogDescription>
              {editingDocument ? "Update document information" : "Document details and content"}
            </DialogDescription>
          </DialogHeader>
          
          {editingDocument ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  value={documentForm.name}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter document name..."
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={documentForm.description}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={documentForm.category} 
                  onValueChange={(value) => setDocumentForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
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
                  {documentForm.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedDocument && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="outline">{selectedDocument.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <HardDrive className="w-3 h-3" />
                  {formatFileSize(selectedDocument.size)}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Uploaded {new Date(selectedDocument.uploadedAt).toLocaleDateString()}
                </div>
              </div>
              
              {selectedDocument.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedDocument.description}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedDocument.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  {selectedDocument.tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags</p>
                  )}
                </div>
              </div>
              
              {selectedDocument.content && (
                <div>
                  <h4 className="font-medium mb-2">Content Preview</h4>
                  <ScrollArea className="h-40 w-full rounded border p-4">
                    <pre className="whitespace-pre-wrap text-sm">{selectedDocument.content.substring(0, 500)}...</pre>
                  </ScrollArea>
                </div>
              )}
              
              {selectedDocument.extractedMetadata && (
                <div>
                  <h4 className="font-medium mb-2">Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedDocument.extractedMetadata.wordCount && (
                      <div>
                        <span className="font-medium">Word Count:</span> {selectedDocument.extractedMetadata.wordCount}
                      </div>
                    )}
                    {selectedDocument.extractedMetadata.pageCount && (
                      <div>
                        <span className="font-medium">Pages:</span> {selectedDocument.extractedMetadata.pageCount}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDocumentDialog(false);
              setSelectedDocument(null);
              setEditingDocument(null);
              resetForm();
            }}>
              {editingDocument ? "Cancel" : "Close"}
            </Button>
            {editingDocument && (
              <Button onClick={handleUpdateDocument}>
                Update Document
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
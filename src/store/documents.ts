import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";

export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  category: string;
  tags: string[];
  description?: string;
  content?: string; // Extracted text content
  url?: string; // For external documents
  uploadedAt: number;
  lastModified: number;
  extractedMetadata?: {
    title?: string;
    author?: string;
    pageCount?: number;
    wordCount?: number;
    language?: string;
  };
  isProcessed: boolean;
  processingStatus?: "pending" | "processing" | "completed" | "error";
  searchableContent?: string;
}

interface DocumentsState {
  documents: Document[];
  categories: string[];
  totalSize: number;
  addDocument: (document: Omit<Document, "id" | "uploadedAt" | "lastModified">) => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  addCategory: (category: string) => void;
  getDocumentsByCategory: (category: string) => Document[];
  searchDocuments: (query: string) => Document[];
  getDocumentById: (id: string) => Document | undefined;
  clearAllDocuments: () => void;
}

const defaultCategories = [
  "Research Reports",
  "Financial Documents",
  "Presentations", 
  "Due Diligence",
  "Market Analysis",
  "Company Information",
  "Legal Documents",
  "Reference Materials"
];

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documents: [],
      categories: defaultCategories,
      totalSize: 0,
      
      addDocument: (document) =>
        set((state) => {
          const newDocument: Document = {
            ...document,
            id: nanoid(),
            uploadedAt: Date.now(),
            lastModified: Date.now(),
          };

          return {
            documents: [...state.documents, newDocument],
            totalSize: state.totalSize + newDocument.size,
          };
        }),
      
      removeDocument: (id) =>
        set((state) => {
          const document = state.documents.find(d => d.id === id);
          return {
            documents: state.documents.filter(d => d.id !== id),
            totalSize: document ? state.totalSize - document.size : state.totalSize,
          };
        }),
      
      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map(d =>
            d.id === id
              ? { ...d, ...updates, lastModified: Date.now() }
              : d
          ),
        })),
      
      addCategory: (category) =>
        set((state) => ({
          categories: state.categories.includes(category)
            ? state.categories
            : [...state.categories, category],
        })),
      
      getDocumentsByCategory: (category) => {
        const state = get();
        return state.documents.filter(d => d.category === category);
      },
      
      searchDocuments: (query) => {
        const state = get();
        const lowercaseQuery = query.toLowerCase();
        return state.documents.filter(d =>
          d.name.toLowerCase().includes(lowercaseQuery) ||
          d.originalName.toLowerCase().includes(lowercaseQuery) ||
          d.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
          (d.description && d.description.toLowerCase().includes(lowercaseQuery)) ||
          (d.searchableContent && d.searchableContent.toLowerCase().includes(lowercaseQuery)) ||
          (d.extractedMetadata?.title && d.extractedMetadata.title.toLowerCase().includes(lowercaseQuery))
        );
      },
      
      getDocumentById: (id) => {
        const state = get();
        return state.documents.find(d => d.id === id);
      },
      
      clearAllDocuments: () =>
        set(() => ({
          documents: [],
          totalSize: 0,
        })),
    }),
    {
      name: "documents-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
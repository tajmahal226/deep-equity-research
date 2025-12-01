import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { createSafeJSONStorage } from "@/utils/storage";

export interface CaseStudy {
  id: string;
  title: string;
  companyName: string;
  industry: string;
  description: string;
  investmentThesis: string;
  status: "active" | "exited" | "passed" | "write-off" | "monitoring";
  outcome?: "success" | "failure" | "neutral" | "partial";
  createdAt: number;
  updatedAt: number;
  keyMilestones: Milestone[];
  attachments: Attachment[];
  tags: string[];
  category: string; // broadened from literal union to string to allow UI flexibility, though we provide defaults

  // Fields used in component but missing in interface previously?
  // Checking component usage:
  // fundingStage, dealSize, valuation, ownership, leadInvestor, coinvestors, keyMetrics, risks, mitigationStrategies, lessonsLearned, whatWorked, whatDidntWork, isPublic, author
  fundingStage: string;
  dealSize?: string;
  author: string;
  valuation?: string;
  ownership?: string;
  leadInvestor?: string;
  coinvestors: string[];
  keyMetrics: string[];
  risks: string[];
  mitigationStrategies: string[];
  lessonsLearned: string[];
  whatWorked: string[];
  whatDidntWork: string[];
  isPublic: boolean;
  investmentDate: number;
  collaborators: string[];
}

export interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "funding" | "product" | "hiring" | "revenue" | "other";
  impact?: "positive" | "negative" | "neutral";
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: "pdf" | "image" | "link" | "other";
  uploadedAt: number;
}

interface CaseStudiesState {
  caseStudies: CaseStudy[];
  categories: string[];
  isSearching: boolean;
  
  // Actions
  addCaseStudy: (caseStudy: Omit<CaseStudy, "id" | "createdAt" | "updatedAt">) => void;
  updateCaseStudy: (id: string, updates: Partial<CaseStudy>) => void;
  removeCaseStudy: (id: string) => void;
  duplicateCaseStudy: (id: string) => void;
  
  addMilestone: (caseStudyId: string, milestone: Omit<Milestone, "id">) => void;
  updateMilestone: (caseStudyId: string, milestoneId: string, updates: Partial<Milestone>) => void;
  removeMilestone: (caseStudyId: string, milestoneId: string) => void;
  
  addAttachment: (caseStudyId: string, attachment: Omit<Attachment, "id" | "uploadedAt">) => void;
  removeAttachment: (caseStudyId: string, attachmentId: string) => void;
  
  // Queries
  getCaseStudiesByCategory: (category: string) => CaseStudy[];
  getCaseStudiesByStatus: (status: string) => CaseStudy[];
  getCaseStudiesByIndustry: (industry: string) => CaseStudy[];
  searchCaseStudies: (query: string) => CaseStudy[];
  getCaseStudyById: (id: string) => CaseStudy | undefined;
  
  // Analytics
  getPerformanceMetrics: () => {
    totalDeals: number;
    activeDeals: number;
    exitedDeals: number;
    averageReturns: string;
    successRate: number;
    topPerformingIndustries: string[];
  };
}

/**
 * Case Study Store.
 * Manages case studies, milestones, and attachments.
 */
export const useCaseStudiesStore = create<CaseStudiesState>()(
  persist(
    (set, get) => ({
      caseStudies: [],
      categories: ["Growth Equity", "Venture Capital", "Turnaround", "Value Investing", "Buyout"],
      isSearching: false,
      
      addCaseStudy: (caseStudy) =>
        set((state) => ({
          caseStudies: [
            {
              ...caseStudy,
              id: nanoid(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            ...state.caseStudies
          ],
        })),
      
      updateCaseStudy: (id, updates) =>
        set((state) => ({
          caseStudies: state.caseStudies.map(cs =>
            cs.id === id ? { ...cs, ...updates, updatedAt: Date.now() } : cs
          ),
        })),
      
      removeCaseStudy: (id) =>
        set((state) => ({
          caseStudies: state.caseStudies.filter(cs => cs.id !== id),
        })),

      duplicateCaseStudy: (id) =>
        set((state) => {
          const original = state.caseStudies.find(cs => cs.id === id);
          if (!original) return {};

          return {
            caseStudies: [
              {
                ...original,
                id: nanoid(),
                title: `${original.title} (Copy)`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
              ...state.caseStudies
            ]
          };
        }),
      
      addMilestone: (caseStudyId, milestone) =>
        set((state) => ({
          caseStudies: state.caseStudies.map(cs =>
            cs.id === caseStudyId
              ? {
                  ...cs,
                  keyMilestones: [...cs.keyMilestones, { ...milestone, id: nanoid() }],
                  updatedAt: Date.now()
                }
              : cs
          ),
        })),
      
      updateMilestone: (caseStudyId, milestoneId, updates) =>
        set((state) => ({
          caseStudies: state.caseStudies.map(cs =>
            cs.id === caseStudyId
              ? {
                  ...cs,
                  keyMilestones: cs.keyMilestones.map(m =>
                    m.id === milestoneId ? { ...m, ...updates } : m
                  ),
                  updatedAt: Date.now()
                }
              : cs
          ),
        })),
      
      removeMilestone: (caseStudyId, milestoneId) =>
        set((state) => ({
          caseStudies: state.caseStudies.map(cs =>
            cs.id === caseStudyId
              ? {
                  ...cs,
                  keyMilestones: cs.keyMilestones.filter(m => m.id !== milestoneId),
                  updatedAt: Date.now()
                }
              : cs
          ),
        })),
      
      addAttachment: (caseStudyId, attachment) =>
        set((state) => ({
          caseStudies: state.caseStudies.map(cs =>
            cs.id === caseStudyId
              ? {
                  ...cs,
                  attachments: [
                    ...cs.attachments,
                    { ...attachment, id: nanoid(), uploadedAt: Date.now() }
                  ],
                  updatedAt: Date.now()
                }
              : cs
          ),
        })),
      
      removeAttachment: (caseStudyId, attachmentId) =>
        set((state) => ({
          caseStudies: state.caseStudies.map(cs =>
            cs.id === caseStudyId
              ? {
                  ...cs,
                  attachments: cs.attachments.filter(a => a.id !== attachmentId),
                  updatedAt: Date.now()
                }
              : cs
          ),
        })),
      
      getCaseStudiesByCategory: (category) => {
        const state = get();
        return state.caseStudies.filter(cs => cs.category === category);
      },
      
      getCaseStudiesByStatus: (status) => {
        const state = get();
        return state.caseStudies.filter(cs => cs.status === status);
      },
      
      getCaseStudiesByIndustry: (industry) => {
        const state = get();
        return state.caseStudies.filter(cs => cs.industry === industry);
      },
      
      searchCaseStudies: (query) => {
        const state = get();
        const lowercaseQuery = query.toLowerCase();
        return state.caseStudies.filter(cs =>
          cs.title.toLowerCase().includes(lowercaseQuery) ||
          cs.companyName.toLowerCase().includes(lowercaseQuery) ||
          cs.description.toLowerCase().includes(lowercaseQuery) ||
          cs.investmentThesis.toLowerCase().includes(lowercaseQuery) ||
          cs.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
          cs.industry.toLowerCase().includes(lowercaseQuery)
        );
      },
      
      getCaseStudyById: (id) => {
        const state = get();
        return state.caseStudies.find(cs => cs.id === id);
      },
      
      getPerformanceMetrics: () => {
        const state = get();
        const caseStudies = state.caseStudies;
        const totalDeals = caseStudies.length;
        const activeDeals = caseStudies.filter(cs => cs.status === "active").length;
        const exitedDeals = caseStudies.filter(cs => cs.status === "exited").length;
        
        const successfulExits = caseStudies.filter(cs => 
          cs.status === "exited" && cs.outcome === "success"
        ).length;
        const successRate = exitedDeals > 0 ? (successfulExits / exitedDeals) * 100 : 0;
        
        // Calculate industry distribution
        const industryCount: { [key: string]: number } = {};
        caseStudies.forEach(cs => {
          industryCount[cs.industry] = (industryCount[cs.industry] || 0) + 1;
        });
        const topPerformingIndustries = Object.entries(industryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([industry]) => industry);
        
        return {
          totalDeals,
          activeDeals,
          exitedDeals,
          averageReturns: "N/A", // Would calculate from actual returns data
          successRate: Math.round(successRate),
          topPerformingIndustries,
        };
      },
    }),
    {
      name: "case-studies-storage",
      storage: createSafeJSONStorage(),
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { createSafeJSONStorage } from "@/utils/storage";

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  companyName: string;
  industry: string;
  fundingStage: string;
  dealSize?: string;
  investmentDate: number;
  status: "active" | "exited" | "write-off" | "monitoring";
  outcome?: "success" | "partial" | "failure";

  // Investment Thesis
  investmentThesis: string;
  keyMetrics: string[];
  risks: string[];
  mitigationStrategies: string[];

  // Deal Details
  valuation?: string;
  ownership?: string;
  leadInvestor?: string;
  coinvestors: string[];
  boardSeats?: number;

  // Performance Tracking
  currentValuation?: string;
  multipleReturned?: string;
  irrReturned?: string;
  keyMilestones: Milestone[];

  // Analysis
  lessonsLearned: string[];
  whatWorked: string[];
  whatDidntWork: string[];
  wouldInvestAgain?: boolean;
  recommendationScore?: number; // 1-10

  // Metadata
  tags: string[];
  category: string;
  author: string;
  collaborators: string[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  attachments: Attachment[];
}

export interface Milestone {
  id: string;
  date: number;
  title: string;
  description: string;
  type: "funding" | "product" | "business" | "team" | "exit" | "other";
  impact: "positive" | "negative" | "neutral";
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploadedAt: number;
}

export interface CaseStudyTemplate {
  id: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  tags: string[];
  isDefault: boolean;
  createdAt: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  fieldType: "text" | "textarea" | "select" | "multiselect" | "date" | "number";
  options?: string[];
  isRequired: boolean;
  placeholder?: string;
}

interface CaseStudiesState {
  caseStudies: CaseStudy[];
  templates: CaseStudyTemplate[];
  categories: string[];
  tags: string[];
  
  // Case Study Management
  addCaseStudy: (caseStudy: Omit<CaseStudy, "id" | "createdAt" | "updatedAt">) => void;
  updateCaseStudy: (id: string, updates: Partial<CaseStudy>) => void;
  removeCaseStudy: (id: string) => void;
  duplicateCaseStudy: (id: string) => void;
  
  // Template Management
  addTemplate: (template: Omit<CaseStudyTemplate, "id" | "createdAt">) => void;
  updateTemplate: (id: string, updates: Partial<CaseStudyTemplate>) => void;
  removeTemplate: (id: string) => void;

  // Milestone Management
  addMilestone: (caseStudyId: string, milestone: Omit<Milestone, "id">) => void;
  updateMilestone: (caseStudyId: string, milestoneId: string, updates: Partial<Milestone>) => void;
  removeMilestone: (caseStudyId: string, milestoneId: string) => void;
  
  // Attachment Management
  addAttachment: (caseStudyId: string, attachment: Omit<Attachment, "id" | "uploadedAt">) => void;
  removeAttachment: (caseStudyId: string, attachmentId: string) => void;
  
  // Filtering and Search
  getCaseStudiesByCategory: (category: string) => CaseStudy[];
  getCaseStudiesByStatus: (status: CaseStudy["status"]) => CaseStudy[];
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

const defaultCategories = [
  "Public Equity",
  "Venture Capital",
  "Private Equity",
  "Seed Investment",
  "Series A",
  "Series B+",
  "Late Stage",
  "Acquisition",
  "IPO"
];

const defaultTags = [
  "SaaS",
  "B2B",
  "B2C",
  "Marketplace",
  "Fintech",
  "Healthcare",
  "Enterprise",
  "Consumer",
  "AI/ML",
  "Success",
  "Learning",
  "High Growth"
];

// Default case study template
const defaultTemplate: CaseStudyTemplate = {
  id: "default-template",
  name: "Standard Investment Case Study",
  description: "Comprehensive template for documenting investment case studies",
  isDefault: true,
  tags: ["standard", "investment", "comprehensive"],
  createdAt: Date.now(),
  sections: [
    {
      id: "company-overview",
      title: "Company Overview",
      description: "Basic company information",
      fieldType: "textarea",
      isRequired: true,
      placeholder: "Company background, product/service, business model..."
    },
    {
      id: "investment-thesis",
      title: "Investment Thesis",
      description: "Why we invested",
      fieldType: "textarea",
      isRequired: true,
      placeholder: "Key reasons for investment, market opportunity, competitive advantages..."
    },
    {
      id: "deal-structure",
      title: "Deal Structure",
      description: "Investment terms and structure",
      fieldType: "textarea",
      isRequired: false,
      placeholder: "Valuation, ownership, terms, co-investors..."
    },
    {
      id: "key-risks",
      title: "Key Risks",
      description: "Identified risks and concerns",
      fieldType: "textarea",
      isRequired: true,
      placeholder: "Market, execution, competitive, financial risks..."
    },
    {
      id: "performance",
      title: "Performance & Outcomes",
      description: "How the investment performed",
      fieldType: "textarea",
      isRequired: false,
      placeholder: "Financial returns, operational improvements, exit details..."
    },
    {
      id: "lessons-learned",
      title: "Lessons Learned",
      description: "Key takeaways",
      fieldType: "textarea",
      isRequired: true,
      placeholder: "What worked, what didn't, what would you do differently..."
    }
  ]
};

export const useCaseStudiesStore = create<CaseStudiesState>()(
  persist(
    (set, get) => ({
      caseStudies: [],
      templates: [defaultTemplate],
      categories: defaultCategories,
      tags: defaultTags,
      
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
            cs.id === id
              ? { ...cs, ...updates, updatedAt: Date.now() }
              : cs
          ),
        })),
      
      removeCaseStudy: (id) =>
        set((state) => ({
          caseStudies: state.caseStudies.filter(cs => cs.id !== id),
        })),

      duplicateCaseStudy: (id) => {
        const caseStudy = get().getCaseStudyById(id);
        if (caseStudy) {
          get().addCaseStudy({
            ...caseStudy,
            title: `${caseStudy.title} (Copy)`,
            keyMilestones: caseStudy.keyMilestones.map(m => ({ ...m, id: nanoid() })),
            attachments: [], // Don't duplicate attachments
          });
        }
      },

      addTemplate: (template) =>
        set((state) => ({
          templates: [
            {
              ...template,
              id: nanoid(),
              createdAt: Date.now(),
            },
            ...state.templates
          ],
        })),

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      removeTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter(t => t.id !== id || t.isDefault),
        })),
      
      addMilestone: (caseStudyId, milestone) =>
        set((state) => ({
          caseStudies: state.caseStudies.map(cs =>
            cs.id === caseStudyId
              ? {
                  ...cs,
                  keyMilestones: [
                    ...cs.keyMilestones,
                    { ...milestone, id: nanoid() }
                  ],
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

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";

export interface CompanyResult {
  id: string;
  name: string;
  website?: string;
  description: string;
  industry: string;
  subIndustry?: string;
  location: string;
  fundingStage: string;
  totalFunding?: string;
  lastFundingDate?: Date;
  employeeCount?: string;
  revenue?: string;
  foundedYear?: number;
  competitors?: string[];
  tags: string[];
  logo?: string;
  matchScore?: number;
  reasoning?: string;
  sources: string[];
  discoveredAt: Date;
  // Financial data fields
  ticker?: string;
  marketCap?: string;
  currentPrice?: string;
  priceChange?: string;
  priceChangePercent?: string;
}

export interface SearchCriteria {
  id: string;
  name: string;
  description?: string;
  industries: string[];
  locations: string[];
  fundingStages: string[];
  employeeRanges: string[];
  revenueRanges: string[];
  keywords: string[];
  excludeKeywords: string[];
  similarCompanies: string[];
  createdAt: Date;
  lastUsed?: Date;
}

interface CompanyDiscoveryState {
  companies: CompanyResult[];
  savedSearches: SearchCriteria[];
  recentSearches: string[];
  isSearching: boolean;
  
  // Company management
  addCompany: (company: Omit<CompanyResult, "id" | "discoveredAt">) => void;
  removeCompany: (id: string) => void;
  updateCompany: (id: string, updates: Partial<CompanyResult>) => void;
  clearCompanies: () => void;
  
  // Search management
  saveSearch: (search: Omit<SearchCriteria, "id" | "createdAt">) => void;
  removeSavedSearch: (id: string) => void;
  updateSavedSearch: (id: string, updates: Partial<SearchCriteria>) => void;
  
  // Search operations
  setSearching: (searching: boolean) => void;
  addRecentSearch: (query: string) => void;
  
  // Filtering and querying
  getCompaniesByIndustry: (industry: string) => CompanyResult[];
  getCompaniesByFunding: (stage: string) => CompanyResult[];
  searchCompanies: (query: string) => CompanyResult[];
}

const defaultIndustries = [
  "Software & Technology",
  "Fintech",
  "Healthcare & Biotech",
  "E-commerce & Retail",
  "Enterprise Software",
  "Consumer Apps",
  "Artificial Intelligence",
  "Cybersecurity",
  "EdTech",
  "PropTech",
  "Climate Tech",
  "Logistics & Supply Chain",
  "Media & Entertainment",
  "Travel & Hospitality"
];

const defaultLocations = [
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX",
  "Boston, MA",
  "Seattle, WA",
  "Los Angeles, CA",
  "Chicago, IL",
  "London, UK",
  "Berlin, Germany",
  "Tel Aviv, Israel",
  "Singapore",
  "Toronto, Canada"
];

const defaultFundingStages = [
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "Growth/Late Stage",
  "Public"
];

export const useCompanyDiscoveryStore = create<CompanyDiscoveryState>()(
  persist(
    (set, get) => ({
      companies: [],
      savedSearches: [],
      recentSearches: [],
      isSearching: false,
      
      addCompany: (company) =>
        set((state) => ({
          companies: [
            {
              ...company,
              id: nanoid(),
              discoveredAt: new Date(),
            },
            ...state.companies
          ],
        })),
      
      removeCompany: (id) =>
        set((state) => ({
          companies: state.companies.filter(c => c.id !== id),
        })),
      
      updateCompany: (id, updates) =>
        set((state) => ({
          companies: state.companies.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      
      clearCompanies: () =>
        set(() => ({
          companies: [],
        })),
      
      saveSearch: (search) =>
        set((state) => ({
          savedSearches: [
            {
              ...search,
              id: nanoid(),
              createdAt: new Date(),
            },
            ...state.savedSearches
          ],
        })),
      
      removeSavedSearch: (id) =>
        set((state) => ({
          savedSearches: state.savedSearches.filter(s => s.id !== id),
        })),
      
      updateSavedSearch: (id, updates) =>
        set((state) => ({
          savedSearches: state.savedSearches.map(s =>
            s.id === id ? { ...s, ...updates, lastUsed: new Date() } : s
          ),
        })),
      
      setSearching: (searching) =>
        set(() => ({
          isSearching: searching,
        })),
      
      addRecentSearch: (query) =>
        set((state) => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter(q => q !== query).slice(0, 9)
          ],
        })),
      
      getCompaniesByIndustry: (industry) => {
        const state = get();
        return state.companies.filter(c => c.industry === industry);
      },
      
      getCompaniesByFunding: (stage) => {
        const state = get();
        return state.companies.filter(c => c.fundingStage === stage);
      },
      
      searchCompanies: (query) => {
        const state = get();
        const lowercaseQuery = query.toLowerCase();
        return state.companies.filter(c =>
          c.name.toLowerCase().includes(lowercaseQuery) ||
          c.description.toLowerCase().includes(lowercaseQuery) ||
          c.industry.toLowerCase().includes(lowercaseQuery) ||
          c.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
          (c.subIndustry && c.subIndustry.toLowerCase().includes(lowercaseQuery))
        );
      },
    }),
    {
      name: "company-discovery-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { defaultIndustries, defaultLocations, defaultFundingStages };
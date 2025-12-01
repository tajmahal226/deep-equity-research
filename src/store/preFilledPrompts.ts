import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { createSafeJSONStorage } from "@/utils/storage";

/**
 * Pre-filled prompt interface.
 */
interface PreFilledPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  description?: string;
  usageCount: number;
  lastUsed?: number;
  isTemplate: boolean;
  createdAt: number;
}

interface PreFilledPromptsState {
  prompts: PreFilledPrompt[];
  categories: string[];
  addPrompt: (prompt: Omit<PreFilledPrompt, "id" | "createdAt">) => void;
  removePrompt: (id: string) => void;
  updatePrompt: (id: string, updates: Partial<Omit<PreFilledPrompt, "id" | "createdAt">>) => void;
  incrementUsage: (id: string) => void;
  addCategory: (category: string) => void;
  getPromptsByCategory: (category: string) => PreFilledPrompt[];
  searchPrompts: (query: string) => PreFilledPrompt[];
}

// Default categories
const defaultCategories = [
  "Company Research",
  "Market Analysis", 
  "Due Diligence",
  "Competitive Analysis",
  "Financial Analysis",
  "Customer Research",
  "Technology Assessment",
  "Risk Analysis"
];

// Default company research prompt
const defaultCompanyPrompt: PreFilledPrompt = {
  id: "default-company-research",
  title: "Comprehensive Company Research Template",
  category: "Company Research",
  tags: ["template", "public-equity", "comprehensive", "due-diligence"],
  description: "Complete template for public equity company research covering all key areas",
  usageCount: 0,
  isTemplate: true,
  content: `The user is a public equity analyst looking to learn about [company] [company-url].  The following is a template for the research report and areas the user wants to learn about.
Section 1: Company Overview
Brief overview
Overview of the company's products, core technologies, and offerings.
Primary use-cases / pain-points solved, differentiated by industry verticals or business sizes (enterprise vs. mid-market vs. SMB).
How the company makes money? What is its product and pricing strategy, what are its upsell opportunities?
Detailed ROI metrics from the customer perspective (quantitative where possible).
Technical explanation of how their technology functions, including architecture, integrations, and underlying innovations.
 
Section 2: Company and Product Deep Dive
Comprehensive overview of the company's products, core technologies, and offerings.
Technical explanation of how their technology functions, including architecture, integrations, and underlying innovations.
Detailed ROI metrics from the customer perspective (quantitative where possible).
Primary use-cases / pain-points solved, differentiated by industry verticals or business sizes (enterprise vs. mid-market vs. SMB).
 
Section 3: Customers, Buyers, and Channels
Profile of primary customer types, including specific industry verticals, business size, and buying personas (CIO, CISO, CTO, etc.).
Analysis of the company's go-to-market strategy, channel partnerships, and distribution strategy, geographic focus
Overview of typical buying cycles, channels of importance, implementation times and decision-making processes in the company's target markets. Call out geographic differences.
Key purchase criteria in chart that a buyer would evaluate and relative importance and what they are looking for
Key purchase criteria of a user-centric purchaser (vs. budget holder) and relative importance and what they are looking for
How competitors stack rank across each of the above KPCs
 
Market background and context
Define what the is, typical issues / risks, and how they have evolved over time
Discuss the historical context, how it was solved, who the tools / vendors that solved it and how they changed over time
Discuss the more recent evolution of the market, new innovations that created new risks and responses
Discuss hwo incumbent tools fall short in new world
Current market landscape, size, and projected growth rates of relevant sub-markets.
 
Competitive Analysis
Detailed competitive analysis including direct competitors, indirect competitors, and adjacent market players.
Segmentation of competitors and adjacent players across key dimensions: product features, bundles, pricing models, target customer types
Differentiation of competitors by persona / buyer type across product capabilities, pricing models, scalability, integrations, usability, security, and overall customer satisfaction.
Differentiation by customer type (enterprise vs. SMB, vertical-specific, geographical nuances)
Discuss adjacent areas, competitors that span adjacent areas, bundling / platformization trends or opportunities for M&A / bundling and platform trends
 
Broader Trends and Strategic Positioning
Current macro-trends impacting the company's specific infrastructure software categories (cloud migration, shift-left security, AI adoption, DevSecOps, automation, cost management, regulatory shifts, etc.).
Identification of emerging opportunities within their market segments.
Analysis of strategic risks or threats the company might face (technical obsolescence, competitive pressure, market shifts, regulatory risk, execution risks, etc.).
Opportunities for growth – develop a perspective on the various levers the company should take for continued growth / market expansion (pricing / packaging vs. competitors, new products, adjacencies, M&A, GTM partnerships etc.)
 
Bull case / Bear Case
Lay out a sophisticated bull case and bear case that a seasoned investor might think about for the company
Use only the public knowledge you have available, don't make things up about financials or other things you don't have access to
 
Key Questions and Next steps
You have 1 hour with the CEO, what 10 questions would you have for them to get as much insight about the business, competition, long-term strategy of the company and its chance for success?
What further market research would you want to do?
 
Key Recent News and Updates
Most important recent announcements, product launches, partnerships, customer wins, and funding events from the company.
Recent strategic moves and announcements by key competitors.
</Report Contents>
 
<Research input>
The report should be extremely well researched from a variety of web-sources, including company websites, reddit and similar forums, Gartner and similar forums, G2 and similar websites, news, relevant industry group, relevant substacks and medium articles and more.
</Research input>
 
<Success criteria>
The user should be able to deeply understand the market context and the business overview.  The goal is not to try and do financial analysis necessarily, unless you are 100% confident about financials (3-4 sources confirm the same number), If you are unsure about certain areas – you must say so and not make broad inferences without discussing where you have information gaps.  It is absolutely critical that the user not be fed information that is not accurate, or at least has a perspective on relative level of certainty across all areas discussed above.  It is far more important that the user is accurately informed, than detail that is inaccurate or potentially inaccurate
</Success criteria>.`,
  createdAt: Date.now(),
};

// Additional default prompts
const marketAnalysisPrompt: PreFilledPrompt = {
  id: "market-analysis-template",
  title: "Market Analysis Framework",
  category: "Market Analysis",
  tags: ["market-research", "tam", "competitive-landscape", "trends"],
  description: "Comprehensive market analysis covering TAM, competitive dynamics, and growth trends",
  usageCount: 0,
  isTemplate: true,
  content: `Please conduct a comprehensive market analysis for [market/industry]. Focus on the following key areas:

Market Overview:
- Total Addressable Market (TAM) size and growth projections
- Market segmentation and key customer segments
- Geographic market distribution
- Historical market evolution and key milestones

Market Dynamics:
- Primary market drivers and growth catalysts  
- Key challenges and market headwinds
- Technology trends reshaping the market
- Regulatory environment and upcoming changes

Competitive Landscape:
- Market share analysis of top players
- Competitive positioning and differentiation
- New entrants and emerging threats
- M&A activity and consolidation trends

Customer Analysis:
- Buyer personas and decision-making processes
- Key purchase criteria and evaluation factors
- Customer pain points and unmet needs
- Channel preferences and go-to-market strategies

Future Outlook:
- 3-5 year market projections and scenarios
- Emerging opportunities and white spaces
- Potential disruption factors
- Investment and funding trends

Please provide quantitative data where available and cite all sources.`,
  createdAt: Date.now(),
};

const competitiveAnalysisPrompt: PreFilledPrompt = {
  id: "competitive-analysis-template",
  title: "Competitive Intelligence Deep Dive",
  category: "Competitive Analysis",
  tags: ["competitors", "benchmarking", "swot", "positioning"],
  description: "In-depth competitive analysis template for evaluating market position",
  usageCount: 0,
  isTemplate: true,
  content: `Conduct a detailed competitive analysis for [company] in the [industry] space. 

Direct Competitors Analysis:
For each major competitor, analyze:
- Business model and revenue streams
- Product/service offerings and differentiation
- Pricing strategy and market positioning
- Market share and financial performance
- Strengths and weaknesses (SWOT)
- Recent strategic moves and announcements

Competitive Positioning Matrix:
Create a positioning analysis across key dimensions:
- Product features and capabilities
- Target customer segments
- Pricing and business model
- Geographic presence
- Technology and innovation
- Customer satisfaction and brand strength

Indirect Competitors & Substitutes:
- Adjacent market players who could expand
- Substitute solutions or alternative approaches
- Potential new entrants and barriers to entry
- Platform players and ecosystem threats

Competitive Intelligence:
- Recent funding rounds and valuations
- Key executive hires and departures
- Patent filings and IP strategy
- Partnership and M&A activity
- Customer wins and losses
- Product roadmap insights

Strategic Implications:
- [Company]'s competitive advantages and vulnerabilities
- Market gaps and opportunities
- Recommended strategic responses
- Potential partnership or acquisition targets
- Areas for defensive positioning`,
  createdAt: Date.now(),
};

const dueDiligencePrompt: PreFilledPrompt = {
  id: "due-diligence-checklist",
  title: "Investment Due Diligence Checklist",
  category: "Due Diligence",
  tags: ["due-diligence", "investment", "risk-assessment", "checklist"],
  description: "Comprehensive checklist for investment due diligence across key areas",
  usageCount: 0,
  isTemplate: true,
  content: `Investment Due Diligence Analysis for [Company Name]

Business Model & Strategy:
- Revenue model sustainability and scalability
- Unit economics and key metrics
- Competitive moats and differentiation
- Total addressable market and expansion opportunities
- Go-to-market strategy effectiveness
- Strategic partnerships and key relationships

Financial Performance:
- Revenue growth trends and quality
- Profitability metrics and path to profitability
- Cash flow generation and burn rate
- Working capital requirements
- Capital efficiency and return on invested capital
- Budget vs. actual performance track record

Management Team:
- Leadership team backgrounds and track record
- Management depth and succession planning
- Board composition and governance
- Equity ownership and alignment
- Cultural fit and execution capability
- Key person risk assessment

Technology & Product:
- Technology stack and scalability
- Product-market fit evidence
- Development roadmap and R&D capabilities
- IP portfolio and defensibility
- Technical debt and infrastructure needs
- Cybersecurity and data privacy measures

Market Position:
- Customer concentration and retention
- Brand strength and market perception
- Sales and marketing effectiveness
- Channel strategy and distribution
- Customer acquisition cost trends
- Competitive positioning and threats

Risk Assessment:
- Regulatory and compliance risks
- Technology and cybersecurity risks
- Market and competitive risks
- Key personnel and operational risks
- Financial and liquidity risks
- ESG considerations and risks

Investment Thesis Validation:
- Key assumptions and stress testing
- Value creation opportunities
- Exit strategy considerations
- Deal structure and terms evaluation`,
  createdAt: Date.now(),
};

/**
 * Pre-filled prompts store.
 * Manages reusable prompt templates and categories.
 */
export const usePreFilledPromptsStore = create<PreFilledPromptsState>()(
  persist(
    (set, get) => ({
      prompts: [defaultCompanyPrompt, marketAnalysisPrompt, competitiveAnalysisPrompt, dueDiligencePrompt],
      categories: defaultCategories,
      addPrompt: (prompt) =>
        set((state) => ({
          prompts: [
            ...state.prompts,
            {
              ...prompt,
              id: nanoid(),
              createdAt: Date.now(),
              usageCount: prompt.usageCount || 0,
            },
          ],
        })),
      removePrompt: (id) =>
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
        })),
      updatePrompt: (id, updates) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      incrementUsage: (id) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, usageCount: p.usageCount + 1, lastUsed: Date.now() } : p
          ),
        })),
      addCategory: (category) =>
        set((state) => ({
          categories: state.categories.includes(category) 
            ? state.categories 
            : [...state.categories, category],
        })),
      getPromptsByCategory: (category) => {
        const state = get();
        return state.prompts.filter((p) => p.category === category);
      },
      searchPrompts: (query) => {
        const state = get();
        const lowercaseQuery = query.toLowerCase();
        return state.prompts.filter((p) =>
          p.title.toLowerCase().includes(lowercaseQuery) ||
          p.content.toLowerCase().includes(lowercaseQuery) ||
          p.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
          (p.description && p.description.toLowerCase().includes(lowercaseQuery))
        );
      },
    }),
    {
      name: "pre-filled-prompts-storage",
      storage: createSafeJSONStorage(),
    }
  )
);

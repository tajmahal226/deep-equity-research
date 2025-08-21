import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";

interface PreFilledPrompt {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface PreFilledPromptsState {
  prompts: PreFilledPrompt[];
  addPrompt: (prompt: Omit<PreFilledPrompt, "id" | "createdAt">) => void;
  removePrompt: (id: string) => void;
  updatePrompt: (id: string, updates: Partial<Omit<PreFilledPrompt, "id" | "createdAt">>) => void;
}

// Default company research prompt
const defaultCompanyPrompt: PreFilledPrompt = {
  id: "default-company-research",
  title: "Comprehensive Company Research Template",
  content: `The user is a growth equity analyst looking to learn about [company] [company-url].  The following is a template for the research report and areas the user wants to learn about.
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
Key purchase criteria in chart that a buyer would evaluate and relative importance of each, what they are looking for
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
The user should be able to deeply understand the market context and the business overview.  The goal is not to try and do financial analysis necesarily, unless you are 100% confident about financials (3-4 sources confirm the same number), If you are unsure about certain areas – you must say so and not make broad inferences without discussing where you have information gaps.  It is absolutely critical that the user not be fed information that is not accurate, or at least has a perspective on relative level of certainty across all areas discussed above.  It is far more important that the user is accurately informed, than detail that is inaccurate or potentially inaccurate
</Success criteria>.`,
  createdAt: new Date(),
};

export const usePreFilledPromptsStore = create<PreFilledPromptsState>()(
  persist(
    (set) => ({
      prompts: [defaultCompanyPrompt],
      addPrompt: (prompt) =>
        set((state) => ({
          prompts: [
            ...state.prompts,
            {
              ...prompt,
              id: nanoid(),
              createdAt: new Date(),
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
    }),
    {
      name: "pre-filled-prompts-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
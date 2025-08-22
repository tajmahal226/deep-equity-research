import { z } from "zod";
import { McpServer } from "@/libs/mcp-server/mcp";
import DeepResearch from "@/utils/deep-research";
import { multiApiKeyPolling } from "@/utils/model";
import {
  getAIProviderBaseURL,
  getAIProviderApiKey,
  getSearchProviderBaseURL,
  getSearchProviderApiKey,
} from "../utils";
import { logger } from "@/utils/logger";

const AI_PROVIDER = process.env.MCP_AI_PROVIDER || "";
const SEARCH_PROVIDER = process.env.MCP_SEARCH_PROVIDER || "model";
const THINKING_MODEL = process.env.MCP_THINKING_MODEL || "";
const TASK_MODEL = process.env.MCP_TASK_MODEL || "";

function initDeepResearchServer({
  language,
  maxResult,
}: {
  language?: string;
  maxResult?: number;
}) {
  const deepResearch = new DeepResearch({
    language,
    AIProvider: {
      baseURL: getAIProviderBaseURL(AI_PROVIDER),
      apiKey: multiApiKeyPolling(getAIProviderApiKey(AI_PROVIDER)),
      provider: AI_PROVIDER,
      thinkingModel: THINKING_MODEL,
      taskModel: TASK_MODEL,
    },
    searchProvider: {
      baseURL: getSearchProviderBaseURL(SEARCH_PROVIDER),
      apiKey: multiApiKeyPolling(getSearchProviderApiKey(SEARCH_PROVIDER)),
      provider: SEARCH_PROVIDER,
      maxResult,
    },
    onMessage: (event, data) => {
      if (event === "progress") {
        logger.log(
          `[${data.step}]: ${data.name ? `"${data.name}" ` : ""}${data.status}`
        );
        if (data.status === "end" && data.data) {
          logger.log(data.data);
        }
      } else if (event === "error") {
        console.error(data.message);
        throw new Error(data.message);
      }
    },
  });

  return deepResearch;
}

export function initMcpServer() {
  const deepResearchToolDescription =
    "Start deep research on any question, obtain and organize information through search engines, and generate research report.";
  const writeResearchPlanDescription =
    "Generate research plan based on user query.";
  const generateSERPQueryDescription =
    "Generate a list of data collection tasks based on the research plan.";
  const searchTaskDescription =
    "Generate SERP queries based on the research plan.";
  const writeFinalReportDescription =
    "Write a final research report based on the research plan and the results of the information collection tasks.";
  const getStockPriceDescription =
    "Get current stock price and basic financial data for a given ticker symbol.";
  const getCompanyFinancialsDescription =
    "Get comprehensive financial statements (income statement, balance sheet, cash flow) for a company.";
  const getCompanyProfileDescription =
    "Get detailed company profile information including business description, sector, and key metrics.";
  const searchCompaniesDescription =
    "Search for companies by name, ticker, or keywords and get basic company information.";

  const server = new McpServer(
    {
      name: "deep-research",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {
          "deep-research": {
            description: deepResearchToolDescription,
          },
          "write-research-plan": {
            description: writeResearchPlanDescription,
          },
          "generate-SERP-query": {
            description: generateSERPQueryDescription,
          },
          "search-task": {
            description: searchTaskDescription,
          },
          "write-final-report": {
            description: writeFinalReportDescription,
          },
          "get-stock-price": {
            description: getStockPriceDescription,
          },
          "get-company-financials": {
            description: getCompanyFinancialsDescription,
          },
          "get-company-profile": {
            description: getCompanyProfileDescription,
          },
          "search-companies": {
            description: searchCompaniesDescription,
          },
        },
      },
    }
  );

  server.tool(
    "deep-research",
    deepResearchToolDescription,
    {
      query: z.string().describe("The topic for deep research."),
      language: z
        .string()
        .optional()
        .describe("The final report text language."),
      maxResult: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of search results."),
      enableCitationImage: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include content-related images in the final report."
        ),
      enableReferences: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include citation links in search results and final reports."
        ),
    },
    async (
      { query, language, maxResult, enableCitationImage, enableReferences },
      { signal }
    ) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({
          language,
          maxResult,
        });
        const result = await deepResearch.start(
          query,
          enableCitationImage,
          enableReferences
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "write-research-plan",
    writeResearchPlanDescription,
    {
      query: z.string().describe("The topic for deep research."),
      language: z.string().optional().describe("The response Language."),
    },
    async ({ query, language }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({ language });
        const result = await deepResearch.writeReportPlan(query);
        return {
          content: [
            { type: "text", text: JSON.stringify({ reportPlan: result }) },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "generate-SERP-query",
    generateSERPQueryDescription,
    {
      plan: z.string().describe("Research plan for deep research."),
      language: z.string().optional().describe("The response Language."),
    },
    async ({ plan, language }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({ language });
        const result = await deepResearch.generateSERPQuery(plan);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "search-task",
    searchTaskDescription,
    {
      tasks: z
        .array(
          z.object({
            query: z.string().describe("Information to be queried."),
            researchGoal: z.string().describe("The goal of this query task."),
          })
        )
        .describe("Information Collection Task List."),
      language: z.string().optional().describe("The response Language."),
      maxResult: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of search results."),
      enableReferences: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include citation links in search results and final reports."
        ),
    },
    async (
      { tasks, language, maxResult, enableReferences = true },
      { signal }
    ) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({ language, maxResult });
        const result = await deepResearch.runSearchTask(
          tasks,
          enableReferences
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "write-final-report",
    writeFinalReportDescription,
    {
      plan: z.string().describe("Research plan for deep research."),
      tasks: z
        .array(
          z.object({
            query: z.string().describe("Information to be queried."),
            researchGoal: z.string().describe("The goal of this query task."),
            learning: z
              .string()
              .describe(
                "Knowledge learned while performing information gathering tasks."
              ),
            sources: z
              .array(
                z.object({
                  url: z.string().describe("Web link."),
                  title: z.string().optional().describe("Page title."),
                })
              )
              .optional()
              .describe(
                "Web page information that was queried when performing information collection tasks."
              ),
            images: z
              .array(
                z.object({
                  url: z.string().describe("Image link."),
                  description: z
                    .string()
                    .optional()
                    .describe("Image Description."),
                })
              )
              .optional()
              .describe(
                "Image resources obtained when performing information collection tasks."
              ),
          })
        )
        .describe(
          "The data information collected during the execution of the query task."
        ),
      language: z
        .string()
        .optional()
        .describe("The final report text language."),
      maxResult: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of search results."),
      enableCitationImage: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include content-related images in the final report."
        ),
      enableReferences: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to include citation links in search results and final reports."
        ),
    },
    async (
      {
        plan,
        tasks,
        language,
        maxResult,
        enableCitationImage = true,
        enableReferences = true,
      },
      { signal }
    ) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        const deepResearch = initDeepResearchServer({ language, maxResult });
        const result = await deepResearch.writeFinalReport(
          plan,
          tasks,
          enableCitationImage,
          enableReferences
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Financial Data Tools
  server.tool(
    "get-stock-price",
    getStockPriceDescription,
    {
      ticker: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)"),
    },
    async ({ ticker }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        // For now, use a mock implementation. In production, this would connect to a real financial API
        const mockStockData = {
          ticker: ticker.toUpperCase(),
          price: (Math.random() * 1000 + 50).toFixed(2),
          change: ((Math.random() - 0.5) * 20).toFixed(2),
          changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
          volume: Math.floor(Math.random() * 10000000),
          marketCap: `${(Math.random() * 500 + 10).toFixed(1)}B`,
          pe_ratio: (Math.random() * 40 + 10).toFixed(1),
          lastUpdated: new Date().toISOString(),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(mockStockData) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error fetching stock data: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "get-company-financials",
    getCompanyFinancialsDescription,
    {
      ticker: z.string().describe("Stock ticker symbol"),
      period: z.enum(["annual", "quarterly"]).default("annual").describe("Financial period"),
      statements: z.array(z.enum(["income", "balance", "cash_flow"])).default(["income", "balance", "cash_flow"]).describe("Financial statements to retrieve"),
    },
    async ({ ticker, period, statements }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        // Mock financial data implementation
        const mockFinancials: any = {
          ticker: ticker.toUpperCase(),
          period,
          currency: "USD",
          statements: {},
        };

        if (statements.includes("income")) {
          mockFinancials.statements.income = {
            revenue: Math.floor(Math.random() * 100000 + 10000) + "M",
            gross_profit: Math.floor(Math.random() * 50000 + 5000) + "M",
            operating_income: Math.floor(Math.random() * 20000 + 2000) + "M",
            net_income: Math.floor(Math.random() * 15000 + 1000) + "M",
            eps: (Math.random() * 20 + 1).toFixed(2),
          };
        }

        if (statements.includes("balance")) {
          mockFinancials.statements.balance = {
            total_assets: Math.floor(Math.random() * 200000 + 20000) + "M",
            total_liabilities: Math.floor(Math.random() * 100000 + 10000) + "M",
            shareholders_equity: Math.floor(Math.random() * 100000 + 10000) + "M",
            cash_and_equivalents: Math.floor(Math.random() * 50000 + 5000) + "M",
            total_debt: Math.floor(Math.random() * 30000 + 3000) + "M",
          };
        }

        if (statements.includes("cash_flow")) {
          mockFinancials.statements.cash_flow = {
            operating_cash_flow: Math.floor(Math.random() * 20000 + 2000) + "M",
            investing_cash_flow: -Math.floor(Math.random() * 10000 + 1000) + "M",
            financing_cash_flow: -Math.floor(Math.random() * 5000 + 500) + "M",
            free_cash_flow: Math.floor(Math.random() * 15000 + 1500) + "M",
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(mockFinancials) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error fetching financial data: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "get-company-profile",
    getCompanyProfileDescription,
    {
      ticker: z.string().describe("Stock ticker symbol"),
    },
    async ({ ticker }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        // Mock company profile data
        const companies: { [key: string]: any } = {
          AAPL: {
            name: "Apple Inc.",
            sector: "Technology",
            industry: "Consumer Electronics",
            description: "Apple Inc. designs, manufactures, and markets consumer electronics, computer software, and online services.",
            employees: 164000,
            headquarters: "Cupertino, CA",
            founded: "1976",
            website: "https://www.apple.com",
          },
          MSFT: {
            name: "Microsoft Corporation",
            sector: "Technology", 
            industry: "Software",
            description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
            employees: 221000,
            headquarters: "Redmond, WA",
            founded: "1975",
            website: "https://www.microsoft.com",
          },
          GOOGL: {
            name: "Alphabet Inc.",
            sector: "Technology",
            industry: "Internet & Direct Marketing Retail",
            description: "Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.",
            employees: 190000,
            headquarters: "Mountain View, CA", 
            founded: "1998",
            website: "https://www.alphabet.com",
          },
        };

        const profile = companies[ticker.toUpperCase()] || {
          name: `${ticker.toUpperCase()} Corp.`,
          sector: "Various",
          industry: "Diversified",
          description: `${ticker.toUpperCase()} is a public company traded on major exchanges.`,
          employees: Math.floor(Math.random() * 100000 + 1000),
          headquarters: "United States",
          founded: (1950 + Math.floor(Math.random() * 70)).toString(),
          website: `https://www.${ticker.toLowerCase()}.com`,
        };

        profile.ticker = ticker.toUpperCase();

        return {
          content: [{ type: "text", text: JSON.stringify(profile) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error fetching company profile: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "search-companies",
    searchCompaniesDescription,
    {
      query: z.string().describe("Search query (company name, ticker, or keywords)"),
      limit: z.number().default(10).describe("Maximum number of results to return"),
    },
    async ({ query, limit }, { signal }) => {
      signal.addEventListener("abort", () => {
        throw new Error("The client closed unexpectedly!");
      });

      try {
        // Mock company search results
        const mockResults = [
          { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", marketCap: "3000B" },
          { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology", marketCap: "2800B" },
          { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", marketCap: "1800B" },
          { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", marketCap: "1600B" },
          { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", marketCap: "800B" },
          { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology", marketCap: "900B" },
          { ticker: "NFLX", name: "Netflix Inc.", sector: "Communication Services", marketCap: "200B" },
          { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Technology", marketCap: "2200B" },
          { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology", marketCap: "250B" },
          { ticker: "UBER", name: "Uber Technologies Inc.", sector: "Technology", marketCap: "150B" },
        ];

        // Simple keyword-based filtering
        const filteredResults = mockResults.filter(company => 
          company.name.toLowerCase().includes(query.toLowerCase()) ||
          company.ticker.toLowerCase().includes(query.toLowerCase()) ||
          company.sector.toLowerCase().includes(query.toLowerCase())
        );

        const results = filteredResults.slice(0, limit).map(company => ({
          ...company,
          price: (Math.random() * 1000 + 50).toFixed(2),
          change: ((Math.random() - 0.5) * 20).toFixed(2),
          changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
        }));

        return {
          content: [{ type: "text", text: JSON.stringify({ query, results, total: filteredResults.length }) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error searching companies: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  return server;
}

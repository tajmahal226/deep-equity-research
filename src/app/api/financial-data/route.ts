/**
 * Financial Data API Route
 * 
 * Provides access to financial data through MCP server tools
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/utils/logger";

export const runtime = "edge";

type StockDataProvider = "financial_datasets" | "alpha_vantage" | "yahoo_finance";

type NormalizedFinancialProvider = StockDataProvider | "mock" | "auto";

const FinancialDataRequestSchema = z.object({
  action: z.enum(["stock-price", "company-financials", "company-profile", "search-companies"]),
  ticker: z.string().optional(),
  query: z.string().optional(),
  period: z.enum(["annual", "quarterly"]).optional(),
  statements: z.array(z.enum(["income", "balance", "cash_flow"])).optional(),
  limit: z.number().optional(),
  // Client-side API keys for user configuration
  alphaVantageApiKey: z.string().optional(),
  yahooFinanceApiKey: z.string().optional(),
  financialDatasetsApiKey: z.string().optional(),
  financialProvider: z.string().optional(),
  // When true, mock data will use a deterministic random generator
  deterministic: z.boolean().optional(),
});

function normalizeFinancialProvider(provider?: string | null): NormalizedFinancialProvider {
  if (!provider) {
    return "mock";
  }

  const value = provider.toLowerCase();
  if (value.includes("mock")) {
    return "mock";
  }

  if (value.includes("auto") || value === "default") {
    return "auto";
  }

  if (value.includes("financial")) {
    return "financial_datasets";
  }

  if (value.includes("alpha")) {
    return "alpha_vantage";
  }

  if (value.includes("yahoo")) {
    return "yahoo_finance";
  }

  return "auto";
}

// Helper function to get financial provider configuration
function getFinancialConfig(clientConfig?: any) {
  // Use client-provided configuration if available, otherwise fallback to environment variables
  const rawProvider = clientConfig?.financialProvider || process.env.FINANCIAL_PROVIDER || "mock";
  const provider = normalizeFinancialProvider(rawProvider);
  const alphaVantageKey = clientConfig?.alphaVantageApiKey || process.env.ALPHA_VANTAGE_API_KEY || "";
  const yahooKey = clientConfig?.yahooFinanceApiKey || process.env.YAHOO_FINANCE_API_KEY || "";
  const financialDatasetsKey = clientConfig?.financialDatasetsApiKey || process.env.FINANCIAL_DATASETS_API_KEY || "";
  const hasApiKey = Boolean(alphaVantageKey || yahooKey || financialDatasetsKey);
  const deterministic =
    typeof clientConfig?.deterministic === "boolean"
      ? clientConfig.deterministic
      : process.env.FINANCIAL_MOCK_DETERMINISTIC === "true";

  return {
    provider,
    alphaVantageApiKey: alphaVantageKey,
    yahooFinanceApiKey: yahooKey,
    financialDatasetsApiKey: financialDatasetsKey,
    hasApiKey,
    deterministicMockData: deterministic,
  };
}

function getProviderPriority(
  provider: NormalizedFinancialProvider,
  hasApiKey: boolean
): StockDataProvider[] {
  switch (provider) {
    case "financial_datasets":
      return ["financial_datasets", "alpha_vantage", "yahoo_finance"];
    case "alpha_vantage":
      return ["alpha_vantage", "financial_datasets", "yahoo_finance"];
    case "yahoo_finance":
      return ["yahoo_finance"];
    case "auto":
      return ["financial_datasets", "alpha_vantage", "yahoo_finance"];
    case "mock":
      return hasApiKey ? ["financial_datasets", "alpha_vantage", "yahoo_finance"] : [];
    default:
      return [];
  }
}

// Constants for the Park-Miller "minimal standard" linear congruential generator (LCG)
const LCG_MODULUS = 2147483647;      // 2^31 - 1, a large prime modulus
const LCG_MULTIPLIER = 16807;        // 7^5, the standard multiplier
const LCG_MODULUS_MINUS_ONE = 2147483646; // LCG_MODULUS - 1, used for normalization and seed adjustment

// Create either a seeded random number generator or use Math.random
function createRNG(deterministic: boolean, seed = 42) {
  if (!deterministic) return Math.random;
  let s = seed % LCG_MODULUS;
  if (s <= 0) s += LCG_MODULUS_MINUS_ONE;
  return () => {
    s = (s * LCG_MULTIPLIER) % LCG_MODULUS;
    return (s - 1) / LCG_MODULUS_MINUS_ONE;
  };
}

// Helper function to fetch stock data from Financial Datasets
async function fetchFinancialDatasetsStock(ticker: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://api.financialdatasets.ai/v1/companies/tickers/${ticker.toUpperCase()}?apikey=${apiKey}`
    );
    const data = await response.json();
    
    if (data.success && data.data) {
      const company = data.data;
      return {
        ticker: ticker.toUpperCase(),
        price: company.price?.toFixed(2) || "0.00",
        change: company.change?.toFixed(2) || "0.00",
        changePercent: company.changePercent?.toFixed(2) || "0.00",
        volume: company.volume || 0,
        high: company.high?.toFixed(2) || "0.00",
        low: company.low?.toFixed(2) || "0.00",
        open: company.open?.toFixed(2) || "0.00",
        previousClose: company.previousClose?.toFixed(2) || "0.00",
        marketCap: company.marketCap || "N/A",
        pe_ratio: company.peRatio?.toFixed(1) || "N/A",
        lastUpdated: new Date().toISOString(),
        source: "financial_datasets"
      };
    }
    
    throw new Error("Invalid API response");
  } catch (error) {
    logger.log(`[Financial API] Error fetching Financial Datasets data for ${ticker}: ${error}`);
    return null;
  }
}

// Helper function to fetch real stock data from Alpha Vantage
async function fetchRealStockData(ticker: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`
    );
    const data = await response.json();
    
    if (data["Global Quote"]) {
      const quote = data["Global Quote"];
      return {
        ticker: ticker.toUpperCase(),
        price: parseFloat(quote["05. price"]).toFixed(2),
        change: parseFloat(quote["09. change"]).toFixed(2),
        changePercent: parseFloat(quote["10. change percent"].replace('%', '')).toFixed(2),
        volume: parseInt(quote["06. volume"]),
        high: parseFloat(quote["03. high"]).toFixed(2),
        low: parseFloat(quote["04. low"]).toFixed(2),
        open: parseFloat(quote["02. open"]).toFixed(2),
        previousClose: parseFloat(quote["08. previous close"]).toFixed(2),
        lastUpdated: quote["07. latest trading day"],
        source: "alpha_vantage"
      };
    }
    
    throw new Error("Invalid API response");
  } catch (error) {
    logger.log(`[Financial API] Error fetching real data for ${ticker}: ${error}`);
    return null;
  }
}

// Helper function to fetch stock data from Yahoo Finance (using yfinance-like API)
async function fetchYahooFinanceStock(ticker: string, _apiKey?: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = _apiKey;
  try {
    // Note: Yahoo Finance doesn't require API key for basic quotes but might for higher limits
    // Using a free endpoint - in production, you might want to use a paid service like RapidAPI
    // apiKey parameter is kept for future paid API integration but currently unused
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?interval=1d&range=1d`
    );
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      
      if (meta && quote) {
        const currentPrice = meta.regularMarketPrice || quote.close?.[quote.close.length - 1] || 0;
        const previousClose = meta.previousClose || 0;
        const change = currentPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
        
        return {
          ticker: ticker.toUpperCase(),
          price: currentPrice.toFixed(2),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          volume: meta.regularMarketVolume || quote.volume?.[quote.volume.length - 1] || 0,
          high: meta.regularMarketDayHigh || Math.max(...(quote.high || [currentPrice])),
          low: meta.regularMarketDayLow || Math.min(...(quote.low || [currentPrice])),
          open: quote.open?.[0] || currentPrice,
          previousClose: previousClose.toFixed(2),
          marketCap: meta.marketCap || "N/A",
          lastUpdated: new Date().toISOString(),
          source: "yahoo_finance"
        };
      }
    }
    
    throw new Error("Invalid API response");
  } catch (error) {
    logger.log(`[Financial API] Error fetching Yahoo Finance data for ${ticker}: ${error}`);
    return null;
  }
}

/**
 * POST handler for financial data requests.
 * Supports stock prices, company financials, profiles, and search.
 *
 * @param request - The NextRequest object.
 * @returns Financial data response.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = FinancialDataRequestSchema.parse(body);
    
    const { action, ticker, query, period, statements, limit } = validatedData;

    logger.log(`[Financial Data API] ${action} request: ${ticker || query}`);

    const config = getFinancialConfig(validatedData);
    const random = createRNG(config.deterministicMockData);
    const providerPriority = getProviderPriority(config.provider, config.hasApiKey);
    const useRealData = providerPriority.length > 0;

    switch (action) {
      case "stock-price":
        if (!ticker) {
          return NextResponse.json(
            { error: "Ticker is required for stock price request" },
            { status: 400 }
          );
        }
        
        let stockData;
        
        // Try to fetch real data from available providers
        if (useRealData) {
          for (const provider of providerPriority) {
            if (provider === "financial_datasets" && config.financialDatasetsApiKey) {
              stockData = await fetchFinancialDatasetsStock(ticker, config.financialDatasetsApiKey);
            } else if (provider === "alpha_vantage" && config.alphaVantageApiKey) {
              stockData = await fetchRealStockData(ticker, config.alphaVantageApiKey);
            } else if (provider === "yahoo_finance") {
              stockData = await fetchYahooFinanceStock(ticker, config.yahooFinanceApiKey);
            }

            if (stockData) {
              break;
            }
          }
        }

        // Fallback to mock data if all real providers failed or not configured
        if (!stockData) {
          stockData = {
            ticker: ticker.toUpperCase(),
            price: (random() * 1000 + 50).toFixed(2),
            change: ((random() - 0.5) * 20).toFixed(2),
            changePercent: ((random() - 0.5) * 10).toFixed(2),
            volume: Math.floor(random() * 10000000),
            marketCap: `${(random() * 500 + 10).toFixed(1)}B`,
            pe_ratio: (random() * 40 + 10).toFixed(1),
            high_52w: (random() * 1200 + 60).toFixed(2),
            low_52w: (random() * 800 + 30).toFixed(2),
            dividend_yield: (random() * 5).toFixed(2),
            beta: (random() * 2 + 0.5).toFixed(2),
            lastUpdated: new Date().toISOString(),
            source: "mock"
          };
        }
        
        return NextResponse.json({ success: true, data: stockData });

      case "company-financials":
        if (!ticker) {
          return NextResponse.json(
            { error: "Ticker is required for financial data request" },
            { status: 400 }
          );
        }

        const financialData: any = {
          ticker: ticker.toUpperCase(),
          period: period || "annual",
          currency: "USD",
          statements: {},
          lastUpdated: new Date().toISOString(),
        };

        const requestedStatements = statements || ["income", "balance", "cash_flow"];

        if (requestedStatements.includes("income")) {
          financialData.statements.income = {
            revenue: Math.floor(random() * 100000 + 10000),
            revenueGrowth: ((random() - 0.5) * 20).toFixed(1),
            costOfRevenue: Math.floor(random() * 60000 + 6000),
            grossProfit: Math.floor(random() * 40000 + 4000),
            grossProfitMargin: (random() * 50 + 20).toFixed(1),
            operatingExpenses: Math.floor(random() * 30000 + 3000),
            operatingIncome: Math.floor(random() * 20000 + 2000),
            operatingMargin: (random() * 30 + 10).toFixed(1),
            netIncome: Math.floor(random() * 15000 + 1000),
            netMargin: (random() * 20 + 5).toFixed(1),
            eps: (random() * 20 + 1).toFixed(2),
            epsGrowth: ((random() - 0.5) * 30).toFixed(1),
          };
        }

        if (requestedStatements.includes("balance")) {
          financialData.statements.balance = {
            totalAssets: Math.floor(random() * 200000 + 20000),
            currentAssets: Math.floor(random() * 80000 + 8000),
            cashAndEquivalents: Math.floor(random() * 50000 + 5000),
            totalLiabilities: Math.floor(random() * 100000 + 10000),
            currentLiabilities: Math.floor(random() * 40000 + 4000),
            totalDebt: Math.floor(random() * 30000 + 3000),
            shareholdersEquity: Math.floor(random() * 100000 + 10000),
            bookValuePerShare: (random() * 100 + 10).toFixed(2),
            debtToEquity: (random() * 2).toFixed(2),
            currentRatio: (random() * 3 + 0.5).toFixed(2),
          };
        }

        if (requestedStatements.includes("cash_flow")) {
          financialData.statements.cash_flow = {
            operatingCashFlow: Math.floor(random() * 20000 + 2000),
            investingCashFlow: -Math.floor(random() * 10000 + 1000),
            financingCashFlow: -Math.floor(random() * 5000 + 500),
            freeCashFlow: Math.floor(random() * 15000 + 1500),
            capex: Math.floor(random() * 8000 + 800),
            cashFlowPerShare: (random() * 15 + 1).toFixed(2),
            fcfYield: (random() * 10 + 1).toFixed(1),
          };
        }
        
        return NextResponse.json({ success: true, data: financialData });

      case "company-profile":
        if (!ticker) {
          return NextResponse.json(
            { error: "Ticker is required for company profile request" },
            { status: 400 }
          );
        }

        const companies: { [key: string]: any } = {
          AAPL: {
            name: "Apple Inc.",
            sector: "Technology",
            industry: "Consumer Electronics",
            description: "Apple Inc. designs, manufactures, and markets consumer electronics, computer software, and online services worldwide.",
            employees: 164000,
            headquarters: "Cupertino, CA, USA",
            founded: 1976,
            ceo: "Tim Cook",
            website: "https://www.apple.com",
            exchange: "NASDAQ",
            fiscalYearEnd: "September",
          },
          MSFT: {
            name: "Microsoft Corporation",
            sector: "Technology", 
            industry: "Software",
            description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
            employees: 221000,
            headquarters: "Redmond, WA, USA",
            founded: 1975,
            ceo: "Satya Nadella",
            website: "https://www.microsoft.com",
            exchange: "NASDAQ",
            fiscalYearEnd: "June",
          },
          GOOGL: {
            name: "Alphabet Inc.",
            sector: "Technology",
            industry: "Internet & Direct Marketing Retail",
            description: "Alphabet Inc. provides online advertising services and operates as a holding company.",
            employees: 190000,
            headquarters: "Mountain View, CA, USA", 
            founded: 1998,
            ceo: "Sundar Pichai",
            website: "https://www.alphabet.com",
            exchange: "NASDAQ",
            fiscalYearEnd: "December",
          },
          TSLA: {
            name: "Tesla, Inc.",
            sector: "Consumer Discretionary",
            industry: "Auto Manufacturers",
            description: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles and energy generation and storage systems.",
            employees: 140473,
            headquarters: "Austin, TX, USA",
            founded: 2003,
            ceo: "Elon Musk",
            website: "https://www.tesla.com",
            exchange: "NASDAQ",
            fiscalYearEnd: "December",
          },
        };

        const profile = companies[ticker.toUpperCase()] || {
          name: `${ticker.toUpperCase()} Corporation`,
          sector: "Various",
          industry: "Diversified",
          description: `${ticker.toUpperCase()} is a publicly traded company.`,
          employees: Math.floor(random() * 100000 + 1000),
          headquarters: "United States",
          founded: 1950 + Math.floor(random() * 70),
          ceo: "Chief Executive Officer",
          website: `https://www.${ticker.toLowerCase()}.com`,
          exchange: "NYSE",
          fiscalYearEnd: "December",
        };

        profile.ticker = ticker.toUpperCase();
        
        return NextResponse.json({ success: true, data: profile });

      case "search-companies":
        if (!query) {
          return NextResponse.json(
            { error: "Query is required for company search request" },
            { status: 400 }
          );
        }

        const mockResults = [
          { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", marketCap: "3000B", price: "185.25" },
          { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology", marketCap: "2800B", price: "378.85" },
          { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", marketCap: "1800B", price: "140.15" },
          { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", marketCap: "1600B", price: "155.75" },
          { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", marketCap: "800B", price: "248.50" },
          { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology", marketCap: "900B", price: "355.20" },
          { ticker: "NFLX", name: "Netflix Inc.", sector: "Communication Services", marketCap: "200B", price: "485.30" },
          { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Technology", marketCap: "2200B", price: "875.25" },
          { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology", marketCap: "250B", price: "285.75" },
          { ticker: "UBER", name: "Uber Technologies Inc.", sector: "Technology", marketCap: "150B", price: "75.40" },
          { ticker: "SPOT", name: "Spotify Technology S.A.", sector: "Technology", marketCap: "50B", price: "285.60" },
          { ticker: "SHOP", name: "Shopify Inc.", sector: "Technology", marketCap: "90B", price: "72.15" },
        ];

        // Filter results based on query
        const filteredResults = mockResults.filter(company => 
          company.name.toLowerCase().includes(query.toLowerCase()) ||
          company.ticker.toLowerCase().includes(query.toLowerCase()) ||
          company.sector.toLowerCase().includes(query.toLowerCase())
        );

        const searchLimit = limit || 10;
        const results = filteredResults.slice(0, searchLimit).map(company => ({
          ...company,
          change: ((random() - 0.5) * 20).toFixed(2),
          changePercent: ((random() - 0.5) * 10).toFixed(2),
        }));

        return NextResponse.json({ 
          success: true, 
          data: { 
            query, 
            results, 
            total: filteredResults.length,
            limit: searchLimit 
          } 
        });

      default:
        return NextResponse.json(
          { error: "Invalid action specified" },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.log("Financial Data API error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process financial data request" },
      { status: 500 }
    );
  }
}

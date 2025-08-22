/**
 * Financial Data API Route
 * 
 * Provides access to financial data through MCP server tools
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/utils/logger";

export const runtime = "edge";

const FinancialDataRequestSchema = z.object({
  action: z.enum(["stock-price", "company-financials", "company-profile", "search-companies"]),
  ticker: z.string().optional(),
  query: z.string().optional(),
  period: z.enum(["annual", "quarterly"]).optional(),
  statements: z.array(z.enum(["income", "balance", "cash_flow"])).optional(),
  limit: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = FinancialDataRequestSchema.parse(body);
    
    const { action, ticker, query, period, statements, limit } = validatedData;

    logger.log(`[Financial Data API] ${action} request: ${ticker || query}`);

    // For now, return mock data. In production, this would integrate with real financial APIs
    switch (action) {
      case "stock-price":
        if (!ticker) {
          return NextResponse.json(
            { error: "Ticker is required for stock price request" },
            { status: 400 }
          );
        }
        
        const stockData = {
          ticker: ticker.toUpperCase(),
          price: (Math.random() * 1000 + 50).toFixed(2),
          change: ((Math.random() - 0.5) * 20).toFixed(2),
          changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
          volume: Math.floor(Math.random() * 10000000),
          marketCap: `${(Math.random() * 500 + 10).toFixed(1)}B`,
          pe_ratio: (Math.random() * 40 + 10).toFixed(1),
          high_52w: (Math.random() * 1200 + 60).toFixed(2),
          low_52w: (Math.random() * 800 + 30).toFixed(2),
          dividend_yield: (Math.random() * 5).toFixed(2),
          beta: (Math.random() * 2 + 0.5).toFixed(2),
          lastUpdated: new Date().toISOString(),
        };
        
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
            revenue: Math.floor(Math.random() * 100000 + 10000),
            revenueGrowth: ((Math.random() - 0.5) * 20).toFixed(1),
            costOfRevenue: Math.floor(Math.random() * 60000 + 6000),
            grossProfit: Math.floor(Math.random() * 40000 + 4000),
            grossProfitMargin: (Math.random() * 50 + 20).toFixed(1),
            operatingExpenses: Math.floor(Math.random() * 30000 + 3000),
            operatingIncome: Math.floor(Math.random() * 20000 + 2000),
            operatingMargin: (Math.random() * 30 + 10).toFixed(1),
            netIncome: Math.floor(Math.random() * 15000 + 1000),
            netMargin: (Math.random() * 20 + 5).toFixed(1),
            eps: (Math.random() * 20 + 1).toFixed(2),
            epsGrowth: ((Math.random() - 0.5) * 30).toFixed(1),
          };
        }

        if (requestedStatements.includes("balance")) {
          financialData.statements.balance = {
            totalAssets: Math.floor(Math.random() * 200000 + 20000),
            currentAssets: Math.floor(Math.random() * 80000 + 8000),
            cashAndEquivalents: Math.floor(Math.random() * 50000 + 5000),
            totalLiabilities: Math.floor(Math.random() * 100000 + 10000),
            currentLiabilities: Math.floor(Math.random() * 40000 + 4000),
            totalDebt: Math.floor(Math.random() * 30000 + 3000),
            shareholdersEquity: Math.floor(Math.random() * 100000 + 10000),
            bookValuePerShare: (Math.random() * 100 + 10).toFixed(2),
            debtToEquity: (Math.random() * 2).toFixed(2),
            currentRatio: (Math.random() * 3 + 0.5).toFixed(2),
          };
        }

        if (requestedStatements.includes("cash_flow")) {
          financialData.statements.cash_flow = {
            operatingCashFlow: Math.floor(Math.random() * 20000 + 2000),
            investingCashFlow: -Math.floor(Math.random() * 10000 + 1000),
            financingCashFlow: -Math.floor(Math.random() * 5000 + 500),
            freeCashFlow: Math.floor(Math.random() * 15000 + 1500),
            capex: Math.floor(Math.random() * 8000 + 800),
            cashFlowPerShare: (Math.random() * 15 + 1).toFixed(2),
            fcfYield: (Math.random() * 10 + 1).toFixed(1),
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
          employees: Math.floor(Math.random() * 100000 + 1000),
          headquarters: "United States",
          founded: 1950 + Math.floor(Math.random() * 70),
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
          change: ((Math.random() - 0.5) * 20).toFixed(2),
          changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
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
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getFinancialConfig, POST as financialDataPost } from "../../src/app/api/financial-data/route";

const originalEnv = { ...process.env };

describe("financial data config", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses client-supplied configuration", () => {
    const cfg = getFinancialConfig({
      financialProvider: "alpha",
      alphaVantageApiKey: "client",
    });
    expect(cfg).toMatchObject({ provider: "alpha", alphaVantageApiKey: "client", hasApiKey: true });
  });

  it("falls back to environment variables", () => {
    process.env.FINANCIAL_PROVIDER = "alpha";
    process.env.ALPHA_VANTAGE_API_KEY = "env";
    const cfg = getFinancialConfig();
    expect(cfg).toMatchObject({ provider: "alpha", alphaVantageApiKey: "env", hasApiKey: true });
  });

  it("defaults to mock provider when no keys", () => {
    delete process.env.FINANCIAL_PROVIDER;
    delete process.env.ALPHA_VANTAGE_API_KEY;
    delete process.env.YAHOO_FINANCE_API_KEY;
    delete process.env.FINANCIAL_DATASETS_API_KEY;
    const cfg = getFinancialConfig();
    expect(cfg).toMatchObject({ provider: "mock", hasApiKey: false });
  });
});

describe("financial data API", () => {
  it("searches companies", async () => {
    const req = new Request("http://localhost/api/financial-data", {
      method: "POST",
      body: JSON.stringify({ action: "search-companies", query: "tech", financialProvider: "mock" }),
    });
    const res = await financialDataPost(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.results.length).toBeGreaterThan(0);
  });

  it("gets company profile", async () => {
    const req = new Request("http://localhost/api/financial-data", {
      method: "POST",
      body: JSON.stringify({ action: "company-profile", ticker: "AAPL", financialProvider: "mock" }),
    });
    const res = await financialDataPost(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.ticker).toBe("AAPL");
  });

  it("gets company financials", async () => {
    const req = new Request("http://localhost/api/financial-data", {
      method: "POST",
      body: JSON.stringify({ action: "company-financials", ticker: "AAPL", financialProvider: "mock" }),
    });
    const res = await financialDataPost(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.statements.income).toBeDefined();
  });

  it("gets stock price", async () => {
    const req = new Request("http://localhost/api/financial-data", {
      method: "POST",
      body: JSON.stringify({ action: "stock-price", ticker: "AAPL", financialProvider: "mock" }),
    });
    const res = await financialDataPost(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.ticker).toBe("AAPL");
  });
});

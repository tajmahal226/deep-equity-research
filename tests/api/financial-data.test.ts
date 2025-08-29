import { describe, it, expect } from "vitest";
import { POST as financialDataPost } from "@/app/api/financial-data/route";

describe("Financial Data API", () => {
  it("returns mock stock price data when no provider configured", async () => {
    const req = new Request("http://localhost/api/financial-data", {
      method: "POST",
      body: JSON.stringify({ action: "stock-price", ticker: "AAPL" }),
    });

    const res = await financialDataPost(req as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.ticker).toBe("AAPL");
    expect(json.data.price).toBeDefined();
  });

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

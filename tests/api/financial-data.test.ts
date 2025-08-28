import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/financial-data/route";

describe("Financial Data API", () => {
  it("returns mock stock price data when no provider configured", async () => {
    const req = new Request("http://localhost/api/financial-data", {
      method: "POST",
      body: JSON.stringify({ action: "stock-price", ticker: "AAPL" }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.ticker).toBe("AAPL");
    expect(json.data.price).toBeDefined();
  });

  it("searches companies with mock provider", async () => {
    const req = new Request("http://localhost/api/financial-data", {
      method: "POST",
      body: JSON.stringify({ action: "search-companies", query: "Apple" }),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.results)).toBe(true);
    expect(json.data.results.length).toBeGreaterThan(0);
  });
});


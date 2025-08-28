import { describe, it, expect } from "vitest";
import {
  getAIProviderBaseURL,
  getSearchProviderBaseURL,
  getSearchProviderApiKey,
} from "../../src/app/api/utils";

describe("API provider utils", () => {
  it("returns base URL for known AI provider", () => {
    expect(getAIProviderBaseURL("openai")).toBe("https://api.openai.com/v1");
  });

  it("throws for unknown AI provider", () => {
    expect(() => getAIProviderBaseURL("unknown")).toThrowError(
      "Unsupported Provider: unknown",
    );
  });

  it("returns base URL for known search providers", () => {
    expect(getSearchProviderBaseURL("tavily")).toBe("https://api.tavily.com");
    expect(getSearchProviderBaseURL("firecrawl")).toBe("https://api.firecrawl.dev");
    expect(getSearchProviderBaseURL("exa")).toBe("https://api.exa.ai");
    expect(getSearchProviderBaseURL("bocha")).toBe("https://api.bochaai.com");
    expect(getSearchProviderBaseURL("searxng")).toBe("http://0.0.0.0:8080");
    expect(getSearchProviderBaseURL("model")).toBe("");
  });

  it("resolves search provider API keys", () => {
    process.env.TAVILY_API_KEY = "tav-key";
    expect(getSearchProviderApiKey("tavily")).toBe("tav-key");
    delete process.env.TAVILY_API_KEY;
    expect(getSearchProviderApiKey("tavily")).toBe("");
    expect(getSearchProviderApiKey("searxng")).toBe("");
  });

  it("throws for unknown search provider", () => {
    expect(() => getSearchProviderBaseURL("unknown")).toThrowError(
      "Unsupported Provider: unknown",
    );
  });
});

import { describe, it, expect } from "vitest";
import {
  getAIProviderBaseURL,
  getSearchProviderBaseURL,
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

  it("returns base URL for known search provider", () => {
    expect(getSearchProviderBaseURL("tavily")).toBe("https://api.tavily.com");
  });

  it("throws for unknown search provider", () => {
    expect(() => getSearchProviderBaseURL("unknown")).toThrowError(
      "Unsupported Provider: unknown",
    );
  });
});

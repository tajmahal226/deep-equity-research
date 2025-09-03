import { describe, it, expect } from "vitest";
import { getProviderStateKey, getProviderApiKey } from "@/utils/provider";

describe("getProviderStateKey", () => {
  it("maps special providers to state keys", () => {
    expect(getProviderStateKey("openai")).toBe("openAI");
    expect(getProviderStateKey("openrouter")).toBe("openRouter");
    expect(getProviderStateKey("xai")).toBe("xAI");
  });

  it("returns provider unchanged when mapping not needed", () => {
    expect(getProviderStateKey("anthropic")).toBe("anthropic");
    expect(getProviderStateKey("deepseek")).toBe("deepseek");
  });
});

describe("getProviderApiKey", () => {
  const store = {
    apiKey: "generic-key",
    openAIApiKey: "openai-key",
    tavilyApiKey: "tavily-key",
  };

  it("prefers provider specific keys", () => {
    expect(getProviderApiKey(store, "openai")).toBe("openai-key");
  });

  it("falls back to generic key if provider specific key missing", () => {
    expect(getProviderApiKey(store, "anthropic")).toBe("generic-key");
  });

  it("works with search providers", () => {
    expect(getProviderApiKey(store, "tavily")).toBe("tavily-key");
  });
});


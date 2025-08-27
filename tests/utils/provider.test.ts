import { describe, it, expect } from "vitest";
import { getProviderStateKey } from "@/utils/provider";

describe("getProviderStateKey", () => {
  it("maps special providers to state keys", () => {
    expect(getProviderStateKey("openai")).toBe("openAI");
    expect(getProviderStateKey("openrouter")).toBe("openRouter");
    expect(getProviderStateKey("openaicompatible")).toBe("openAICompatible");
    expect(getProviderStateKey("xai")).toBe("xAI");
  });

  it("returns provider unchanged when mapping not needed", () => {
    expect(getProviderStateKey("anthropic")).toBe("anthropic");
    expect(getProviderStateKey("deepseek")).toBe("deepseek");
  });
});


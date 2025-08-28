import { describe, it, expect } from "vitest";
import { getDefaultModelConfig } from "../../src/app/api/bulk-company-research/route";

describe("Bulk Company Research defaults", () => {
  const cases: Record<string, { thinkingModel: string; networkingModel: string }> = {
    openai: { thinkingModel: "gpt-4o", networkingModel: "gpt-4o-mini" },
    anthropic: { thinkingModel: "claude-3-5-sonnet-20241022", networkingModel: "claude-3-5-haiku-20241022" },
    deepseek: { thinkingModel: "deepseek-reasoner", networkingModel: "deepseek-chat" },
    mistral: { thinkingModel: "mistral-large-latest", networkingModel: "mistral-medium-latest" },
    xai: { thinkingModel: "grok-2-1212", networkingModel: "grok-2-mini-1212" },
    azure: { thinkingModel: "gpt-4o", networkingModel: "gpt-4o-mini" },
    google: { thinkingModel: "gemini-2.0-flash-exp", networkingModel: "gemini-1.5-flash" },
    openrouter: { thinkingModel: "anthropic/claude-3.5-sonnet", networkingModel: "anthropic/claude-3.5-haiku" },
  };

  for (const [provider, expected] of Object.entries(cases)) {
    it(`provides defaults for ${provider}`, () => {
      expect(getDefaultModelConfig(provider)).toEqual(expected);
    });
  }

  it("falls back to OpenAI when provider unknown", () => {
    expect(getDefaultModelConfig("unknown" as any)).toEqual({ thinkingModel: "gpt-4o", networkingModel: "gpt-4o-mini" });
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("@ai-sdk/deepseek", () => ({
  createDeepSeek: vi.fn(() =>
    vi.fn((_model: string, _settings: any) => ({ model: _model, settings: _settings }))
  ),
}));

vi.mock("ai", () => {
  const generateText = vi.fn(() => ({ text: "analysis" }));
  return { generateText, streamText: vi.fn() };
});

import { generateText } from "ai";
import { CompanyDeepResearch } from "../../src/utils/company-deep-research";

// This test ensures the DeepSeek provider path works for company deep dive research

describe("CompanyDeepResearch DeepSeek provider", () => {
  it("runs fast research using DeepSeek models", async () => {
    const researcher = new CompanyDeepResearch({
      companyName: "Test Co",
      searchDepth: "fast",
      language: "en-US",
      subIndustries: [],
      competitors: [],
      researchSources: [],
      thinkingModelConfig: {
        providerId: "deepseek",
        modelId: "deepseek-reasoner",
        apiKey: "test-key",
      },
      taskModelConfig: {
        providerId: "deepseek",
        modelId: "deepseek-chat",
        apiKey: "test-key",
      },
      onProgress: vi.fn(),
      onMessage: vi.fn(),
      onError: vi.fn(),
    });

    await researcher.runFastResearch();
    expect(generateText).toHaveBeenCalled();
  });
});


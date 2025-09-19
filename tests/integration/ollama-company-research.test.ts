import { describe, it, expect, vi } from "vitest";

vi.mock("ollama-ai-provider", () => ({
  createOllama: vi.fn(() =>
    vi.fn((_model: string, _settings: any) => ({ model: _model, settings: _settings }))
  ),
}));

vi.mock("ai", () => {
  const generateText = vi.fn(() => ({ text: "analysis" }));
  return { generateText, streamText: vi.fn() };
});

import { generateText } from "ai";
import { CompanyDeepResearch } from "../../src/utils/company-deep-research";

describe("CompanyDeepResearch Ollama provider", () => {
  it("runs fast research without requiring an API key", async () => {
    const researcher = new CompanyDeepResearch({
      companyName: "Test Co",
      searchDepth: "fast",
      language: "en-US",
      subIndustries: [],
      competitors: [],
      researchSources: [],
      thinkingModelConfig: {
        providerId: "ollama",
        modelId: "llama3.1:8b",
      },
      taskModelConfig: {
        providerId: "ollama",
        modelId: "llama3.1:8b",
      },
      onProgress: vi.fn(),
      onMessage: vi.fn(),
      onError: vi.fn(),
    });

    await researcher.runFastResearch();

    expect(generateText).toHaveBeenCalled();
  });
});

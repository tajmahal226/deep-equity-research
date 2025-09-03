import { describe, it, expect, vi } from "vitest";

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() =>
    vi.fn((_model: string, _settings: any) => ({ model: _model, settings: _settings }))
  ),
}));

vi.mock("ai", () => {
  const generateText = vi.fn(() => ({ text: "analysis" }));
  return { generateText, streamText: vi.fn() };
});

import { generateText } from "ai";
import { CompanyDeepResearch } from "../../src/utils/company-deep-research";

describe("CompanyDeepResearch Google provider", () => {
  it("enables search grounding for Google networking models", async () => {
    const researcher = new CompanyDeepResearch({
      companyName: "Test Co",
      searchDepth: "fast",
      language: "en-US",
      subIndustries: [],
      competitors: [],
      researchSources: [],
      thinkingModelConfig: {
        providerId: "google",
        modelId: "gemini-2.0-flash-exp",
        apiKey: "test-key",
      },
      taskModelConfig: {
        providerId: "google",
        modelId: "gemini-2.0-flash",
        apiKey: "test-key",
      },
      onProgress: vi.fn(),
      onMessage: vi.fn(),
      onError: vi.fn(),
    });

    await researcher.runFastResearch();

    expect(generateText).toHaveBeenCalled();
    const callArgs = (generateText as any).mock.calls[0][0];
    expect(callArgs.useSearchGrounding).toBe(true);
  });
});

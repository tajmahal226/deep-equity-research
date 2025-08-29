import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Test that CompanyDeepResearch initializes search provider correctly
// for different search depths and provider IDs

describe("Bulk Company Research search provider configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Provide default OpenAI key for model initialization
    process.env.OPENAI_API_KEY = "test-openai-key";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const cases = [
    { providerId: "tavily", envVar: "TAVILY_API_KEY" },
    { providerId: "firecrawl", envVar: "FIRECRAWL_API_KEY" },
    { providerId: "exa", envVar: "EXA_API_KEY" },
  ];

  const depths: Array<{ depth: "medium" | "deep"; max: number }> = [
    { depth: "medium", max: 5 },
    { depth: "deep", max: 10 },
  ];

  cases.forEach(({ providerId, envVar }) => {
    depths.forEach(({ depth, max }) => {
      it(`uses ${providerId} with ${depth} search depth`, async () => {
        // Set provider-specific API key
        process.env[envVar] = `${providerId}-key`;

        const createSearchProviderMock = vi
          .fn()
          .mockResolvedValue({ sources: [], images: [] });
        const createAIProviderMock = vi.fn().mockResolvedValue({});

        vi.doMock("@/utils/deep-research/search", () => ({
          createSearchProvider: createSearchProviderMock,
        }));
        vi.doMock("@/utils/deep-research/provider", () => ({
          createAIProvider: createAIProviderMock,
          filterModelSettings: (
            _provider: string,
            _model: string,
            settings: any,
          ) => settings,
        }));

        const { CompanyDeepResearch } = await import(
          "../../src/utils/company-deep-research"
        );
        const { getSearchProviderBaseURL } = await import(
          "../../src/app/api/utils"
        );

        const researcher = new CompanyDeepResearch({
          companyName: "TestCo",
          searchDepth: depth,
          searchProviderId: providerId,
          thinkingModelConfig: { providerId: "openai", modelId: "gpt-4" },
          taskModelConfig: { providerId: "openai", modelId: "gpt-4" },
        });

        await (researcher as any).init();
        await (researcher as any).searchProvider("test query");

        expect(createSearchProviderMock).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: providerId,
            baseURL: getSearchProviderBaseURL(providerId),
            apiKey: `${providerId}-key`,
            maxResult: max,
            query: "test query",
          })
        );
      });
    });
  });
});


import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompanyDeepResearch } from "../../src/utils/company-deep-research";

const originalEnv = { ...process.env };

describe("Company Research Initialization Integration Test", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("handles missing API keys gracefully", async () => {
    delete process.env.OPENAI_API_KEY;

    // Create a research config without API keys (simulating production scenario)
    const config = {
      companyName: "Test Company",
      searchDepth: "fast" as const,
      language: "en-US",
      thinkingModelConfig: {
        modelId: "gpt-4o",
        providerId: "openai",
        apiKey: undefined, // No API key provided
      },
      taskModelConfig: {
        modelId: "gpt-4o",
        providerId: "openai",
        apiKey: undefined, // No API key provided
      },
      subIndustries: [],
      competitors: [],
      researchSources: [],
      onProgress: vi.fn(),
      onMessage: vi.fn(),
      onError: vi.fn(),
    };

    const researcher = new CompanyDeepResearch(config);

    // Test that initialization fails gracefully with helpful error message
    try {
      await researcher.runFastResearch();
      expect.fail("Should have thrown an error for missing API key");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatch(/No API key found for openai/i);
      expect(error.message).toMatch(/settings gear icon/i); // Should provide user guidance
    }

    // Verify error callback was called with helpful message
    expect(config.onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/API key/i)
      })
    );
  });

  it("provides helpful error messages for different providers", async () => {
    const testCases = [
      {
        provider: "anthropic",
        expectedMessage: /Anthropic API key.*Claude/i
      },
      {
        provider: "deepseek", 
        expectedMessage: /DeepSeek API key/i
      },
      {
        provider: "xai",
        expectedMessage: /xAI API key.*Grok/i
      }
    ];

    for (const testCase of testCases) {
      delete process.env[`${testCase.provider.toUpperCase()}_API_KEY`];
      const config = {
        companyName: "Test Company",
        searchDepth: "fast" as const,
        language: "en-US",
        thinkingModelConfig: {
          modelId: "test-model",
          providerId: testCase.provider,
          apiKey: undefined,
        },
        taskModelConfig: {
          modelId: "test-model",
          providerId: testCase.provider,
          apiKey: undefined,
        },
        subIndustries: [],
        competitors: [],
        researchSources: [],
        onProgress: vi.fn(),
        onMessage: vi.fn(),
        onError: vi.fn(),
      };

      const researcher = new CompanyDeepResearch(config);

      try {
        await researcher.runFastResearch();
        expect.fail(`Should have thrown error for ${testCase.provider}`);
      } catch (error) {
        expect(error.message).toMatch(testCase.expectedMessage);
        expect(error.message).toMatch(/settings gear icon/i);
      }
    }
  });

  it.skip("works when API keys are provided", async () => {
    // This integration test would require network access; skipping in CI environment
  });
});
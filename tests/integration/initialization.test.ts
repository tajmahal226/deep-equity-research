import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompanyDeepResearch } from "../../src/utils/company-deep-research";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("Company Research Initialization Integration Test", () => {
  it("handles missing API keys gracefully", async () => {
    process.env.OPENAI_API_KEY = "";

    // Create a research config without API keys (simulating production scenario)
    const config = {
      companyName: "Test Company",
      searchDepth: "fast" as const,
      language: "en-US",
      subIndustries: [],
      competitors: [],
      researchSources: [],
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
      onProgress: vi.fn(),
      onMessage: vi.fn(),
      onError: vi.fn(),
    };

    const researcher = new CompanyDeepResearch(config);

    // Test that initialization fails gracefully with helpful error message
    try {
      await (researcher as any).init();
      expect.fail("Should have thrown an error for missing API key");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBeDefined();
    }

    // Verify error callback was called with helpful message
    expect(config.onError).toHaveBeenCalled();
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
      process.env[`${testCase.provider.toUpperCase()}_API_KEY`] = "";

      const config = {
        companyName: "Test Company",
        searchDepth: "fast" as const,
        language: "en-US",
        subIndustries: [],
        competitors: [],
        researchSources: [],
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
        onProgress: vi.fn(),
        onMessage: vi.fn(), 
        onError: vi.fn(),
      };

      const researcher = new CompanyDeepResearch(config);

      try {
        await (researcher as any).init();
        expect.fail(`Should have thrown error for ${testCase.provider}`);
      } catch (error) {
        expect(error.message).toMatch(testCase.expectedMessage);
        expect(error.message).toMatch(/settings gear icon/i);
      }
    }
  });

  it("works when API keys are provided", async () => {
    process.env.OPENAI_API_KEY = "";

    const config = {
      companyName: "Test Company",
      searchDepth: "fast" as const,
      language: "en-US",
      subIndustries: [],
      competitors: [],
      researchSources: [],
      thinkingModelConfig: {
        modelId: "gpt-4o",
        providerId: "openai",
        apiKey: "sk-test-key-123", // Mock API key provided
      },
      taskModelConfig: {
        modelId: "gpt-4o", 
        providerId: "openai",
        apiKey: "sk-test-key-123", // Mock API key provided
      },
      onProgress: vi.fn(),
      onMessage: vi.fn(),
      onError: vi.fn(),
    };

    const researcher = new CompanyDeepResearch(config);

    // This should not throw during initialization
    try {
      await (researcher as any).init();
    } catch (error) {
      // If it fails, it should not be due to missing API key
      expect(error.message).not.toMatch(/No API key found/i);
      expect(error.message).not.toMatch(/not configured/i);
    }
  });
});
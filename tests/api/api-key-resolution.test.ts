import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getAIProviderApiKey, getAIProviderApiKeyWithFallback } from "../../src/app/api/utils";

describe("API Key Resolution", () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getAIProviderApiKey", () => {
    it("returns OpenAI API key when set", () => {
      process.env.OPENAI_API_KEY = "sk-test123";
      expect(getAIProviderApiKey("openai")).toBe("sk-test123");
    });

    it("returns empty string when OpenAI key not set", () => {
      delete process.env.OPENAI_API_KEY;
      expect(getAIProviderApiKey("openai")).toBe("");
    });

    it("returns Anthropic API key when set", () => {
      process.env.ANTHROPIC_API_KEY = "ant-test123";
      expect(getAIProviderApiKey("anthropic")).toBe("ant-test123");
    });

    it("returns empty string for providers that don't need keys", () => {
      expect(getAIProviderApiKey("ollama")).toBe("");
      expect(getAIProviderApiKey("pollinations")).toBe("");
    });

    it("throws error for unsupported provider", () => {
      expect(() => getAIProviderApiKey("unsupported")).toThrowError(
        "Unsupported Provider: unsupported"
      );
    });

    it("handles all supported providers", () => {
      const providers = [
        "google", "openai", "anthropic", "deepseek", "xai", "mistral",
        "cohere", "together", "groq", "perplexity", "azure", "openrouter",
        "openaicompatible", "pollinations", "ollama"
      ];
      
      providers.forEach(provider => {
        expect(() => getAIProviderApiKey(provider)).not.toThrow();
      });
    });
  });

  describe("getAIProviderApiKeyWithFallback", () => {
    it("returns API key when available", () => {
      process.env.OPENAI_API_KEY = "sk-test123";
      expect(getAIProviderApiKeyWithFallback("openai")).toBe("sk-test123");
    });

    it("returns empty string when key missing in development", () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = "development";
      
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = getAIProviderApiKeyWithFallback("openai");
      
      expect(result).toBe("");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("No API key found for openai")
      );
      
      consoleSpy.mockRestore();
    });

    it("returns empty string when key missing in production", () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = "production";
      
      expect(getAIProviderApiKeyWithFallback("openai")).toBe("");
    });

    it("provides setup guidance in development", () => {
      delete process.env.ANTHROPIC_API_KEY;
      process.env.NODE_ENV = "development";
      
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      getAIProviderApiKeyWithFallback("anthropic");
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("ANTHROPIC_API_KEY=your-key-here")
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe("Environment Variable Integration", () => {
    it("works with all provider environment variables", () => {
      const envMapping = {
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY", 
        "google": "GOOGLE_GENERATIVE_AI_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
        "xai": "XAI_API_KEY",
        "mistral": "MISTRAL_API_KEY",
        "azure": "AZURE_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
      };

      Object.entries(envMapping).forEach(([provider, envVar]) => {
        const testKey = `test-${provider}-key`;
        process.env[envVar] = testKey;
        expect(getAIProviderApiKey(provider)).toBe(testKey);
        delete process.env[envVar];
      });
    });
  });
});
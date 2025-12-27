// tests/utils/api.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProvider } from "@/utils/api";
import { OpenAIProvider } from "@/utils/api/openai";
import { AnthropicProvider } from "@/utils/api/anthropic";

// Mock dependencies using vi.hoisted to ensure they are initialized before vi.mock
const { mockGenerateText, mockStreamText } = vi.hoisted(() => {
  return {
    mockGenerateText: vi.fn(),
    mockStreamText: vi.fn(),
  };
});

vi.mock("ai", async (importOriginal) => {
  return {
    // @ts-expect-error
    ...await importOriginal(),
    generateText: mockGenerateText,
    streamText: mockStreamText,
  };
});

// Mock fetch for getModels
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProvider", () => {
    it("should return an OpenAIProvider when the provider is openai", () => {
      const provider = createProvider("openai", "test-api-key");
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it("should return an AnthropicProvider when the provider is anthropic", () => {
      const provider = createProvider("anthropic", "test-api-key");
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it("should throw an error when the provider is unsupported", () => {
      expect(() => createProvider("unsupported", "test-api-key")).toThrow(
        "Unsupported provider: unsupported"
      );
    });
  });

  describe("OpenAIProvider", () => {
    const apiKey = "test-api-key";
    let provider: OpenAIProvider;

    beforeEach(() => {
      provider = new OpenAIProvider(apiKey);
    });

    describe("generateReport", () => {
      it("should generate a report successfully", async () => {
        mockGenerateText.mockResolvedValue({ text: "Generated report content" });
        const result = await provider.generateReport("Test prompt", { model: "gpt-4o" });
        expect(result).toBe("Generated report content");
        expect(mockGenerateText).toHaveBeenCalledWith(expect.objectContaining({
          prompt: "Test prompt",
        }));
      });

      it("should handle errors during generation", async () => {
        mockGenerateText.mockRejectedValue(new Error("API Error"));
        await expect(provider.generateReport("Test prompt", {})).rejects.toThrow(
          "Failed to generate report from OpenAI."
        );
      });
    });

    describe("streamReport", () => {
      it("should stream a report successfully", async () => {
        const mockStream = new ReadableStream();
        mockStreamText.mockResolvedValue({ textStream: mockStream });

        const result = await provider.streamReport("Test prompt", { model: "gpt-4o" });
        expect(result).toBe(mockStream);
        expect(mockStreamText).toHaveBeenCalledWith(expect.objectContaining({
            prompt: "Test prompt"
        }));
      });

      it("should handle errors during streaming", async () => {
        mockStreamText.mockRejectedValue(new Error("Stream Error"));
        await expect(provider.streamReport("Test prompt", {})).rejects.toThrow(
          "Failed to stream report from OpenAI."
        );
      });
    });

    describe("getModels", () => {
      it("should fetch and return a list of models", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [
                    { id: "gpt-4o" },
                    { id: "gpt-3.5-turbo" }
                ]
            })
        });

        const models = await provider.getModels();
        expect(models).toEqual(["gpt-4o", "gpt-3.5-turbo"]);
        expect(mockFetch).toHaveBeenCalledWith("https://api.openai.com/v1/models", expect.objectContaining({
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        }));
      });

      it("should handle fetch errors", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            statusText: "Unauthorized",
            text: async () => "Invalid API Key"
        });

        await expect(provider.getModels()).rejects.toThrow(
          "Failed to get models from OpenAI."
        );
      });

      it("should handle network errors", async () => {
        mockFetch.mockRejectedValue(new Error("Network Error"));
        await expect(provider.getModels()).rejects.toThrow(
          "Failed to get models from OpenAI."
        );
      });
    });
  });
});

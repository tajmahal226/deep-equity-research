// tests/utils/api.test.ts

import { describe, it, expect } from "vitest";
import { createProvider } from "@/utils/api";
import { OpenAIProvider } from "@/utils/api/openai";
import { AnthropicProvider } from "@/utils/api/anthropic";

describe("API Adapter", () => {
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
    it("should be tested", () => {
      // TODO: Add tests for the OpenAIProvider
    });
  });
});

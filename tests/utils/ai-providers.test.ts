import { describe, it, expect } from "vitest";
import { createAIProvider } from "@/utils/deep-research/provider";

describe("createAIProvider", () => {
  it("should return a LanguageModel object for openai", async () => {
    const model = await createAIProvider({
      provider: "openai",
      apiKey: "test-key",
      model: "gpt-4o",
      baseURL: "https://example.com",
    });

    expect(model).toBeDefined();
    expect(model.provider).toBe("openai.chat");
    expect(model.modelId).toBe("gpt-4o");
    expect(model.specificationVersion).toBe("v1");
  });

  it("should return a LanguageModel object for google", async () => {
    const model = await createAIProvider({
      provider: "google",
      apiKey: "test-key",
      model: "gemini-pro",
    });

    expect(model).toBeDefined();
    expect(model.provider).toBe("google.generative-ai");
    expect(model.modelId).toBe("gemini-pro");
    expect(model.specificationVersion).toBe("v1");
  });

  it("should throw error if provider is unsupported", async () => {
    await expect(createAIProvider({
      provider: "unknown-provider",
      apiKey: "test-key",
      model: "gpt-4",
    } as any)).rejects.toThrow("Unsupported provider: unknown-provider");
  });

  it("should throw error if apiKey is missing (except ollama)", async () => {
    await expect(createAIProvider({
      provider: "openai",
      apiKey: "",
      model: "gpt-4",
    } as any)).rejects.toThrow("API key is required.");
  });
});

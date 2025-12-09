import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAIProvider } from "@/utils/deep-research/provider";

// Mock the AI SDK providers
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => vi.fn(() => ({
    specificationVersion: "v1",
    provider: "openai",
    modelId: "gpt-4o",
    doGenerate: vi.fn(),
    doStream: vi.fn(),
  }))),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => vi.fn(() => ({
    specificationVersion: "v1",
    provider: "anthropic",
    modelId: "claude-3-5-sonnet-20241022",
  }))),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => ({
    specificationVersion: "v1",
    provider: "google",
    modelId: "gemini-2.0-flash",
  }))),
}));

vi.mock("@ai-sdk/deepseek", () => ({
  createDeepSeek: vi.fn(() => vi.fn(() => ({
    specificationVersion: "v1",
    provider: "deepseek",
    modelId: "deepseek-chat",
  }))),
}));

vi.mock("@ai-sdk/mistral", () => ({
  createMistral: vi.fn(() => vi.fn(() => ({
    specificationVersion: "v1",
    provider: "mistral",
    modelId: "mistral-large-latest",
  }))),
}));

vi.mock("@ai-sdk/xai", () => ({
  createXai: vi.fn(() => vi.fn(() => ({
    specificationVersion: "v1",
    provider: "xai",
    modelId: "grok-2-1212",
  }))),
}));

describe("createAIProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a model object for OpenAI provider", async () => {
    const model = await createAIProvider({
      provider: "openai",
      apiKey: "test-key",
      model: "gpt-4o",
      baseURL: "https://api.openai.com/v1",
    });

    expect(model).toBeDefined();
    expect(model.provider).toBe("openai");
    expect(model.modelId).toBe("gpt-4o");
  });

  it("should return a model object for Anthropic provider", async () => {
    const model = await createAIProvider({
      provider: "anthropic",
      apiKey: "test-key",
      model: "claude-3-5-sonnet-20241022",
      baseURL: "https://api.anthropic.com",
    });

    expect(model).toBeDefined();
    expect(model.provider).toBe("anthropic");
  });

  it("should return a model object for Google provider", async () => {
    const model = await createAIProvider({
      provider: "google",
      apiKey: "test-key",
      model: "gemini-2.0-flash",
      baseURL: "https://generativelanguage.googleapis.com",
    });

    expect(model).toBeDefined();
    expect(model.provider).toBe("google");
  });

  it("should default to OpenAI when provider is empty", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const model = await createAIProvider({
      provider: "",
      apiKey: "test-key",
      model: "gpt-4o",
      baseURL: "https://api.openai.com/v1",
    });

    expect(model).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[createAIProvider] Provider is empty, defaulting to openai"
    );

    consoleSpy.mockRestore();
  });

  it("should default to gpt-4o when model is empty", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const model = await createAIProvider({
      provider: "openai",
      apiKey: "test-key",
      model: "",
      baseURL: "https://api.openai.com/v1",
    });

    expect(model).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[createAIProvider] Model is empty, defaulting to gpt-4o"
    );

    consoleSpy.mockRestore();
  });

  it("should handle OpenRouter provider using OpenAI-compatible API", async () => {
    const model = await createAIProvider({
      provider: "openrouter",
      apiKey: "test-key",
      model: "anthropic/claude-3.5-sonnet",
      baseURL: "https://openrouter.ai/api/v1",
    });

    expect(model).toBeDefined();
  });

  it("should handle Ollama provider using OpenAI-compatible API", async () => {
    const model = await createAIProvider({
      provider: "ollama",
      apiKey: "",
      model: "llama3.1:8b",
      baseURL: "http://localhost:11434/v1",
    });

    expect(model).toBeDefined();
  });

  it("should fall back to OpenAI for unknown providers", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const model = await createAIProvider({
      provider: "unknown-provider",
      apiKey: "test-key",
      model: "some-model",
      baseURL: "https://example.com",
    });

    expect(model).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[createAIProvider] Unknown provider "unknown-provider", falling back to OpenAI'
    );

    consoleSpy.mockRestore();
  });
});

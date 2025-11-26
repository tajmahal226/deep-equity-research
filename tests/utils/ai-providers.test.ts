import { describe, it, expect, vi } from "vitest";
import { createAIProvider } from "@/utils/deep-research/provider";
import { createProvider } from "@/utils/api";
import { OpenAIProvider } from "@/utils/api/openai";

vi.mock("@/utils/api", () => ({
  createProvider: vi.fn(),
}));

describe("createAIProvider", () => {
  it("should return a LanguageModel object", async () => {
    const provider = {
      generateReport: vi.fn(),
      streamReport: vi.fn(),
      getModels: vi.fn(),
    };
    (createProvider as any).mockReturnValue(provider);

    const model = await createAIProvider({
      provider: "openai",
      apiKey: "test-key",
      model: "gpt-4o",
      baseURL: "https://example.com",
    });

    expect(model).toBeDefined();
    expect(model.doGenerate).toBeDefined();
    expect(model.doStream).toBeDefined();
  });

  it("should call the provider's generateReport method when doGenerate is called", async () => {
    const provider = {
      generateReport: vi.fn(),
      streamReport: vi.fn(),
      getModels: vi.fn(),
    };
    (createProvider as any).mockReturnValue(provider);

    const model = await createAIProvider({
      provider: "openai",
      apiKey: "test-key",
      model: "gpt-4o",
      baseURL: "https://example.com",
    });

    await model.doGenerate({ prompt: "test prompt" } as any);

    expect(provider.generateReport).toHaveBeenCalledWith("test prompt", {
      model: "gpt-4o",
    });
  });

  it("should call the provider's streamReport method when doStream is called", async () => {
    const provider = {
      generateReport: vi.fn(),
      streamReport: vi.fn(),
      getModels: vi.fn(),
    };
    (createProvider as any).mockReturnValue(provider);

    const model = await createAIProvider({
      provider: "openai",
      apiKey: "test-key",
      model: "gpt-4o",
      baseURL: "https://example.com",
    });

    await model.doStream({ prompt: "test prompt" } as any);

    expect(provider.streamReport).toHaveBeenCalledWith("test prompt", {
      model: "gpt-4o",
    });
  });
});

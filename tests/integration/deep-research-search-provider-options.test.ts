import { describe, it, expect, beforeEach, vi } from "vitest";
import DeepResearch from "@/utils/deep-research";

vi.mock("ai", () => {
  function createFakeStream() {
    async function* stream() {
      yield { type: "text-delta" as const, textDelta: "chunk" };
      yield { type: "finish" as const };
    }

    return {
      fullStream: stream(),
    };
  }

  const streamText = vi.fn(createFakeStream);
  (streamText as unknown as { createFakeStream?: typeof createFakeStream }).createFakeStream = createFakeStream;

  return {
    streamText,
    generateText: vi.fn(),
  };
});

vi.mock("@ai-sdk/openai", () => {
  const webSearchPreview = vi.fn(() => ({ id: "web_search_preview" }));
  const createOpenAI = vi.fn(() => {
    const client = vi.fn((_model: string, _settings: any) => ({
      model: _model,
      settings: _settings,
    })) as any;

    client.tools = { webSearchPreview };
    client.responses = vi.fn(() => ({
      doGenerate: vi.fn(),
      doStream: vi.fn(),
    }));

    return client;
  });

  return {
    openai: { tools: { webSearchPreview } },
    createOpenAI,
  };
});

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: vi.fn(() =>
    vi.fn((_model: string, _settings: any) => ({
      model: _model,
      settings: _settings,
    }))
  ),
}));

import { streamText } from "ai";

const streamTextMock = vi.mocked(streamText);
const createFakeStream = (streamTextMock as unknown as { createFakeStream: () => { fullStream: AsyncGenerator<any, void, unknown> } }).createFakeStream;

const BASE_OPTIONS = {
  searchProvider: {
    provider: "model" as const,
    baseURL: "https://example.com",
    maxResult: 7,
  },
};

describe("DeepResearch model-powered search integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamTextMock.mockImplementation(createFakeStream);
  });

  it("enables OpenAI web search preview when GPT-4o task models are used", async () => {
    const dr = new DeepResearch({
      ...BASE_OPTIONS,
      AIProvider: {
        provider: "openai",
        baseURL: "https://api.openai.com/v1",
        apiKey: "test-key",
        thinkingModel: "gpt-5",
        taskModel: "gpt-4o-mini",
        temperature: 0.6,
      },
    });

    await dr.runSearchTask([
      { query: "openai", researchGoal: "test" },
    ]);

    expect(streamTextMock).toHaveBeenCalled();
    const args = streamTextMock.mock.calls[0]?.[0];
    expect(args?.tools?.web_search_preview).toBeDefined();
  });

  it("injects OpenRouter web plugin configuration when OpenRouter task models drive search", async () => {
    const dr = new DeepResearch({
      ...BASE_OPTIONS,
      AIProvider: {
        provider: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: "test-key",
        thinkingModel: "openrouter/anthropic/claude-3.5-sonnet",
        taskModel: "openrouter/openai/gpt-4o-mini",
        temperature: 0.6,
      },
    });

    await dr.runSearchTask([
      { query: "openrouter", researchGoal: "test" },
    ]);

    expect(streamTextMock).toHaveBeenCalled();
    const args = streamTextMock.mock.calls[0]?.[0];
    expect(args?.providerOptions?.openrouter?.plugins).toEqual([
      { id: "web", max_results: BASE_OPTIONS.searchProvider.maxResult },
    ]);
  });
});

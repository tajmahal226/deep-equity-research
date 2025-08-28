import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/sse/route";

// Mock DeepResearch to avoid real network requests and simulate SSE events
vi.mock("@/utils/deep-research", () => {
  return {
    default: class MockDeepResearch {
      opts: any;
      constructor(opts: any) {
        this.opts = opts;
      }
      async start() {
        // Simulate progress and completion events
        this.opts.onMessage("progress", { step: "start", status: "begin" });
        this.opts.onMessage("complete", { report: { content: "done" } });
      }
    },
  };
});

// List of AI providers to verify provider handling
const aiProviders = [
  "google",
  "openai",
  "anthropic",
  "deepseek",
  "xai",
  "mistral",
  "cohere",
  "together",
  "groq",
  "perplexity",
  "azure",
  "openrouter",
  "openaicompatible",
  "pollinations",
  "ollama",
];

// List of search providers
const searchProviders = [
  "tavily",
  "firecrawl",
  "exa",
  "bocha",
  "searxng",
  "model",
];

describe("Market Research SSE API - AI Providers", () => {
  aiProviders.forEach((provider) => {
    it(`streams events for ${provider}`, async () => {
      const req = new Request("http://localhost/api/sse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "Test market",
          provider,
          thinkingModel: "thinking-model",
          taskModel: "task-model",
          searchProvider: "model",
          language: "en-US",
          maxResult: 1,
          aiApiKey: "",
          searchApiKey: "",
        }),
      });

      const res = await POST(req as any);
      const text = await res.text();

      expect(text).toContain("event: infor");
      expect(text).toContain("event: progress");
      expect(text).toContain("event: complete");
    });
  });
});

describe("Market Research SSE API - Search Providers", () => {
  searchProviders.forEach((searchProvider) => {
    it(`accepts search provider ${searchProvider}`, async () => {
      const req = new Request("http://localhost/api/sse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "Search test",
          provider: "openai",
          thinkingModel: "thinking-model",
          taskModel: "task-model",
          searchProvider,
          language: "en-US",
          maxResult: 1,
          aiApiKey: "",
          searchApiKey: "",
        }),
      });

      const res = await POST(req as any);
      const text = await res.text();

      expect(text).toContain("event: progress");
      expect(text).toContain("event: complete");
    });
  });
});


import { describe, it, expect } from "vitest";
import DeepResearch from "@/utils/deep-research";
import { getAIProviderBaseURL } from "@/app/api/utils";

describe("Market Research Module - OpenRouter Provider", () => {
  it("initializes thinking and task models", async () => {
    const dr = new DeepResearch({
      AIProvider: {
        provider: "openrouter",
        baseURL: getAIProviderBaseURL("openrouter"),
        apiKey: "test-key",
        thinkingModel: "anthropic/claude-3.5-sonnet",
        taskModel: "anthropic/claude-3.5-sonnet",
        temperature: 0.7,
      },
      searchProvider: {
        provider: "model",
        baseURL: "",
      },
    });

    const thinking = await dr.getThinkingModel();
    expect(thinking).toBeDefined();

    const task = await dr.getTaskModel();
    expect(task).toBeDefined();
  });
});

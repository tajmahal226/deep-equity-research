import { describe, it, expect } from "vitest";
import DeepResearch from "@/utils/deep-research";
import { getAIProviderBaseURL } from "@/app/api/utils";

describe("Market Research Module - OpenAI Provider", () => {
  it("initializes thinking and task models", async () => {
    const dr = new DeepResearch({
      AIProvider: {
        provider: "openai",
        baseURL: getAIProviderBaseURL("openai"),
        apiKey: "test-key",
        thinkingModel: "gpt-5",
        taskModel: "gpt-4o-mini",
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

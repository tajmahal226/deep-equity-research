import { describe, it, expect } from "vitest";
import DeepResearch from "@/utils/deep-research";
import { getAIProviderBaseURL } from "@/app/api/utils";

describe("Market Research Module - Google Provider", () => {
  it("initializes thinking and task models", async () => {
    const dr = new DeepResearch({
      AIProvider: {
        provider: "google",
        baseURL: getAIProviderBaseURL("google"),
        apiKey: "test-key",
        thinkingModel: "gemini-2.5-flash-thinking",
        taskModel: "gemini-2.5-pro",
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

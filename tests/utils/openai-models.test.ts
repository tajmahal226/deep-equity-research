import { describe, expect, it } from "vitest";
import {
  normalizeOpenAIModel,
  normalizeOpenAISlugForModel,
  usesOpenAIResponsesAPI,
} from "@/utils/openai-models";

describe("normalizeOpenAIModel", () => {
  it("maps hypothetical GPT-5.2 variants to supported models", () => {
    expect(normalizeOpenAIModel("gpt-5.2-pro")).toBe("o1");
    expect(normalizeOpenAIModel("gpt-5.2-pro-reasoning")).toBe("o1");
    expect(normalizeOpenAIModel("gpt-5.2-pro-chat")).toBe("gpt-4o");
    expect(normalizeOpenAIModel("gpt-5.2-turbo")).toBe("gpt-4o");
    expect(normalizeOpenAIModel("gpt-5.2-turbo-reasoning")).toBe("o1-mini");
  });

  it("maps GPT-5 placeholders to the closest available chat models", () => {
    expect(normalizeOpenAIModel("gpt-5")).toBe("o1");
    expect(normalizeOpenAIModel("gpt-5-turbo")).toBe("gpt-4o");
    expect(normalizeOpenAIModel("gpt-5-32k")).toBe("gpt-4o");
    expect(normalizeOpenAIModel("gpt-5-chat-latest")).toBe("gpt-4o");
  });

  it("returns the original model when no mapping exists", () => {
    expect(normalizeOpenAIModel("gpt-4o")).toBe("gpt-4o");
    expect(normalizeOpenAIModel("o1-mini")).toBe("o1-mini");
  });
});

describe("usesOpenAIResponsesAPI", () => {
  it("detects responses API models including mapped placeholders", () => {
    expect(usesOpenAIResponsesAPI("gpt-5.2-pro")).toBe(true);
    expect(usesOpenAIResponsesAPI("gpt-5")).toBe(true);
    expect(usesOpenAIResponsesAPI("o1-preview")).toBe(true);
    expect(usesOpenAIResponsesAPI("o3-mini")).toBe(true);
  });

  it("treats chat-first models as chat/completions", () => {
    expect(usesOpenAIResponsesAPI("gpt-4o")).toBe(false);
    expect(usesOpenAIResponsesAPI("gpt-5.2-pro-chat")).toBe(false);
  });
});

describe("normalizeOpenAISlugForModel", () => {
  it("routes responses models to the responses endpoint", () => {
    const result = normalizeOpenAISlugForModel([
      "v1",
      "chat",
      "completions",
    ], "gpt-5.2-pro");

    expect(result.model).toBe("o1");
    expect(result.slug).toEqual(["v1", "responses"]);
  });

  it("keeps chat endpoints for chat-first models", () => {
    const result = normalizeOpenAISlugForModel([
      "v1",
      "chat",
      "completions",
    ], "gpt-5.2-pro-chat");

    expect(result.model).toBe("gpt-4o");
    expect(result.slug).toEqual(["v1", "chat", "completions"]);
  });

  it("defaults to v1 when slug is empty", () => {
    const result = normalizeOpenAISlugForModel([], "o1-mini");

    expect(result.slug).toEqual(["v1", "responses"]);
  });
});


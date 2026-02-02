import { describe, expect, it } from "vitest";
import {
  normalizeOpenAIModel,
  normalizeOpenAISlugForModel,
  usesOpenAIResponsesAPI,
} from "@/utils/openai-models";

describe("normalizeOpenAIModel", () => {
  it("preserves legitimate 2026 models without mapping them to old versions", () => {
    expect(normalizeOpenAIModel("gpt-5.2-pro")).toBe("gpt-5.2-pro");
    expect(normalizeOpenAIModel("gpt-5.2-pro-reasoning")).toBe("gpt-5.2-pro-reasoning");
    expect(normalizeOpenAIModel("gpt-5")).toBe("gpt-5");
  });

  it("maps semantic aliases to their concrete models", () => {
    expect(normalizeOpenAIModel("gpt-latest")).toBe("gpt-5.2");
    expect(normalizeOpenAIModel("gpt-reasoning")).toBe("o3-mini");
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
    expect(usesOpenAIResponsesAPI("gpt-4-turbo")).toBe(false);
  });
});

describe("normalizeOpenAISlugForModel", () => {
  it("routes responses models to the responses endpoint", () => {
    const result = normalizeOpenAISlugForModel([
      "v1",
      "chat",
      "completions",
    ], "gpt-5.2-pro");

    expect(result.model).toBe("gpt-5.2-pro");
    expect(result.slug).toEqual(["v1", "responses"]);
  });

  it("keeps chat endpoints for chat-first models", () => {
    const result = normalizeOpenAISlugForModel([
      "v1",
      "chat",
      "completions",
    ], "gpt-4o");

    expect(result.model).toBe("gpt-4o");
    expect(result.slug).toEqual(["v1", "chat", "completions"]);
  });

  it("defaults to v1 when slug is empty", () => {
    const result = normalizeOpenAISlugForModel([], "o1-mini");

    expect(result.slug).toEqual(["v1", "responses"]);
  });
});


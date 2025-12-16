const OPENAI_MODEL_MAPPING: Record<string, string> = {
  // GPT-5.2 series (hypothetical) -> map to best available
  "gpt-5.2-pro": "o1",
  "gpt-5.2-pro-reasoning": "o1",
  "gpt-5.2-pro-chat": "gpt-4o",
  "gpt-5.2-turbo": "gpt-4o",
  "gpt-5.2-turbo-reasoning": "o1-mini",
  // GPT-5 series (hypothetical) -> map to best available
  "gpt-5": "o1",
  "gpt-5-turbo": "gpt-4o",
  "gpt-5-32k": "gpt-4o",
  "gpt-5-chat-latest": "gpt-4o",
};

export function normalizeOpenAIModel(model: string): string {
  if (!model) return model;
  const trimmed = model.trim();
  return OPENAI_MODEL_MAPPING[trimmed] || trimmed;
}

export function usesOpenAIResponsesAPI(model: string): boolean {
  const normalized = normalizeOpenAIModel(model).toLowerCase();
  return (
    normalized.startsWith("o1") ||
    normalized.startsWith("o3") ||
    normalized.startsWith("o4") ||
    normalized.startsWith("gpt-5") ||
    normalized.startsWith("gpt-4.1")
  );
}

export function normalizeOpenAISlugForModel(
  slugSegments: readonly string[],
  model?: string,
): { slug?: string[]; model?: string } {
  if (!model) return { slug: [...slugSegments] };

  const normalizedModel = normalizeOpenAIModel(model);

  if (usesOpenAIResponsesAPI(normalizedModel)) {
    const apiVersion = slugSegments[0] || "v1";
    return { slug: [apiVersion, "responses"], model: normalizedModel };
  }

  return { slug: [...slugSegments], model: normalizedModel };
}


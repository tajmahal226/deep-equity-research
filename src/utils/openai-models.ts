const OPENAI_MODEL_MAPPING: Record<string, string> = {
  // Map user-friendly names to actual OpenAI model IDs
  
  // GPT-5.2 series - map to GPT-4o series for chat compatibility
  // (GPT-5.2 uses Responses API which requires different handling)
  "gpt-5.2-pro": "gpt-4o",
  "gpt-5.2": "gpt-4o",
  "gpt-5.2-mini": "gpt-4o-mini",
  "gpt-5.2-nano": "gpt-4o-mini",
  
  // GPT-5 series - map to GPT-4o series for chat compatibility
  "gpt-5": "gpt-4o",
  "gpt-5-mini": "gpt-4o-mini",
  "gpt-5-nano": "gpt-4o-mini",
  
  // Open-weight models - not available via API, map to GPT-4o
  "gpt-oss-120b": "gpt-4o",
  "gpt-oss-20b": "gpt-4o-mini",
  
  // Legacy aliases
  "gpt-latest": "gpt-4o",
  "gpt-reasoning": "o3-mini",
  
  // Legacy / other mappings can be added here
};

export function normalizeOpenAIModel(model: string): string {
  if (!model) return model;
  const trimmed = model.trim();
  return OPENAI_MODEL_MAPPING[trimmed] || trimmed;
}

export function usesOpenAIResponsesAPI(model: string): boolean {
  const normalized = normalizeOpenAIModel(model).toLowerCase();
  // These models use the OpenAI Responses API (not Chat Completions)
  return (
    normalized.startsWith("o1") ||
    normalized.startsWith("o3") ||
    normalized.startsWith("o4") ||
    normalized.startsWith("gpt-5") ||
    normalized.startsWith("gpt-4.1") ||
    normalized.startsWith("gpt-5.2")
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


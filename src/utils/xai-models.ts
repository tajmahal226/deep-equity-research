/**
 * xAI Model Utilities
 * 
 * Handles model normalization for xAI (Grok) models.
 * Some newer Grok models use v1 spec which is not supported by AI SDK 5.
 * This utility maps unsupported models to compatible alternatives.
 */

// Models that use v1 spec (reasoning models) - need to be mapped to v2 compatible models
const XAI_MODEL_MAPPING: Record<string, string> = {
  // Grok-4 series (latest as of 2026-02-01)
  // Note: Grok-4 reasoning models use v1 spec, map to non-reasoning equivalents
  "grok-4-reasoning": "grok-4",
  "grok-4-fast-reasoning": "grok-4",
  "grok-4-mini-reasoning": "grok-4-1-fast-non-reasoning",
  // Grok-4.1 series
  "grok-4-1-reasoning": "grok-4",
  "grok-4-1-fast-reasoning": "grok-4-1-fast-non-reasoning",
  // Legacy: Grok-3 reasoning variants -> map to base grok-3
  "grok-3-reasoning": "grok-3",
  "grok-3-fast-reasoning": "grok-3",
  "grok-3-mini-reasoning": "grok-3-mini",
};

/**
 * Normalize xAI model names to AI SDK 5 compatible versions.
 * Reasoning models (v1 spec) are mapped to their non-reasoning equivalents.
 */
export function normalizeXAIModel(model: string): string {
  if (!model) return model;
  const trimmed = model.trim();
  return XAI_MODEL_MAPPING[trimmed] || trimmed;
}

/**
 * Check if a model is a reasoning model that needs special handling.
 * These models use v1 spec and need to be mapped.
 */
export function isXAIReasoningModel(model: string): boolean {
  const normalized = model.toLowerCase();
  return normalized.includes("reasoning");
}

/**
 * Get the appropriate non-reasoning model for a given Grok model.
 * This ensures compatibility with AI SDK 5.
 */
export function getXAIBaseModel(model: string): string {
  const normalized = normalizeXAIModel(model).toLowerCase();
  
  // Grok-4 series mapping
  if (normalized.startsWith("grok-4")) {
    if (normalized.includes("mini")) {
      return "grok-4-1-fast-non-reasoning";
    }
    if (normalized.includes("fast")) {
      return "grok-4-1-fast-non-reasoning";
    }
    return "grok-4";
  }
  
  // Grok-3 series mapping
  if (normalized.startsWith("grok-3")) {
    if (normalized.includes("mini")) {
      return "grok-3-mini";
    }
    return "grok-3";
  }
  
  // Grok-2 series mapping (legacy)
  if (normalized.startsWith("grok-2")) {
    if (normalized.includes("mini")) {
      return "grok-2-mini";
    }
    return "grok-2";
  }
  
  return model;
}

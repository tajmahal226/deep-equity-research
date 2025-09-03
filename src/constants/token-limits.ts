export const OPENAI_MODEL_TOKEN_LIMITS: Record<string, number> = {
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "gpt-4.1": 128000,
  "gpt-4.1-mini": 128000,
  "gpt-5": 256000,
  "gpt-5-chat-latest": 256000,
  "o3-mini": 128000,
  "o3-pro": 128000,
};

export const ANTHROPIC_MODEL_TOKEN_LIMITS: Record<string, number> = {
  "claude-3-opus-20240229": 200000,
  "claude-3-sonnet-20240229": 200000,
  "claude-3-haiku-20240307": 200000,
  "claude-3-5-sonnet-20240620": 200000,
  "claude-3-5-haiku-20241022": 200000,
};

export const DEEPSEEK_MODEL_TOKEN_LIMITS: Record<string, number> = {
  "deepseek-chat": 64000,
  "deepseek-reasoner": 64000,
};

export const XAI_MODEL_TOKEN_LIMITS: Record<string, number> = {
  // Grok models generally support large context windows (~128k tokens)
  // Include common prefixes so matchModel() can handle versioned variants
  "grok-beta": 128000,
  "grok-1": 128000,
  "grok-1-mini": 128000,
  "grok-2": 128000,
  "grok-2-mini": 128000,
  "grok-3": 128000,
  "grok-3-mini": 128000,
};

// Fallback limit used when we don't have an explicit token limit for a
// provider/model pair.  This prevents unbounded requests that can exhaust
// tokens or cause timeouts when the model's true limit is unknown.
export const DEFAULT_MODEL_TOKEN_LIMIT = 4000;

function matchModel(map: Record<string, number>, model: string): number | undefined {
  if (map[model] !== undefined) return map[model];
  const entry = Object.entries(map).find(([key]) => model.startsWith(key));
  return entry ? entry[1] : undefined;
}

export function getMaxTokens(provider: string, model: string): number {
  const key = provider.toLowerCase();
  let limit: number | undefined;
  switch (key) {
    case "openai":
      limit = matchModel(OPENAI_MODEL_TOKEN_LIMITS, model);
      break;
    case "anthropic":
      limit = matchModel(ANTHROPIC_MODEL_TOKEN_LIMITS, model);
      break;
    case "deepseek":
      limit = matchModel(DEEPSEEK_MODEL_TOKEN_LIMITS, model);
      break;
    case "xai":
      limit = matchModel(XAI_MODEL_TOKEN_LIMITS, model);
      break;
    default:
      limit = undefined;
  }

  return limit ?? DEFAULT_MODEL_TOKEN_LIMIT;
}

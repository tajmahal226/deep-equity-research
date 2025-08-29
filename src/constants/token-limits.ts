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
  "grok-beta": 128000,
};

function matchModel(map: Record<string, number>, model: string): number | undefined {
  if (map[model] !== undefined) return map[model];
  const entry = Object.entries(map).find(([key]) => model.startsWith(key));
  return entry ? entry[1] : undefined;
}

export function getMaxTokens(provider: string, model: string): number | undefined {
  const key = provider.toLowerCase();
  switch (key) {
    case "openai":
    case "azure":
    case "openaicompatible":
      return matchModel(OPENAI_MODEL_TOKEN_LIMITS, model);
    case "anthropic":
      return matchModel(ANTHROPIC_MODEL_TOKEN_LIMITS, model);
    case "deepseek":
      return matchModel(DEEPSEEK_MODEL_TOKEN_LIMITS, model);
    case "xai":
      return matchModel(XAI_MODEL_TOKEN_LIMITS, model);
    default:
      return undefined;
  }
}

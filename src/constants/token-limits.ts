// Provider/model token limit mapping.  These values are sourced from
// official provider documentation where available.  Models not listed here
// will fall back to provider-level defaults which are intentionally
// conservative to avoid unbounded requests.

export const MODEL_TOKEN_LIMITS: Record<string, Record<string, number>> = {
  openai: {
    "gpt-4o": 128000,
    "gpt-4o-mini": 128000,
    "gpt-4.1": 128000,
    "gpt-4.1-mini": 128000,
    "gpt-5": 256000,
    "gpt-5-chat-latest": 256000,
    "o3-mini": 128000,
    "o3-pro": 128000,
  },
  anthropic: {
    "claude-3-opus-20240229": 200000,
    "claude-3-sonnet-20240229": 200000,
    "claude-3-haiku-20240307": 200000,
    "claude-3-5-sonnet-20240620": 200000,
    "claude-3-5-haiku-20241022": 200000,
  },
  deepseek: {
    "deepseek-chat": 64000,
    "deepseek-reasoner": 64000,
  },
  xai: {
    "grok-beta": 128000,
  },
  google: {
    "gemini-1.5-flash": 1_000_000,
    "gemini-1.5-pro": 1_000_000,
  },
  groq: {
    "llama3-8b-8192": 8192,
    "llama3-70b-8192": 8192,
    "mixtral-8x7b-32768": 32768,
  },
  mistral: {
    "mistral-small-latest": 32768,
    "mistral-medium-latest": 32768,
    "mistral-large-latest": 32768,
    "codestral-latest": 32768,
  },
  perplexity: {
    "llama-3.1-sonar-small-128k-online": 128000,
    "llama-3.1-sonar-large-128k-online": 128000,
  },
  cohere: {
    "command-r": 128000,
    "command-r-plus": 128000,
  },
};

// Default token limits for providers.  Used when a provider is known but
// the specific model is not listed above.
export const PROVIDER_DEFAULT_TOKEN_LIMITS: Record<string, number> = {
  openai: 128000,
  azure: 128000,
  openaicompatible: 128000,
  anthropic: 200000,
  deepseek: 64000,
  xai: 128000,
  google: 1_000_000,
  groq: 8192,
  mistral: 32768,
  perplexity: 128000,
  cohere: 128000,
  together: 32768,
  openrouter: 128000,
  ollama: 32768,
};

// Global fallback limit when neither a model nor provider limit is known.
// This prevents unbounded requests that could exhaust tokens or time out.
export const DEFAULT_MODEL_TOKEN_LIMIT = 4000;

function matchModel(map: Record<string, number> | undefined, model: string): number | undefined {
  if (!map) return undefined;
  if (map[model] !== undefined) return map[model];
  const entry = Object.entries(map).find(([key]) => model.startsWith(key));
  return entry ? entry[1] : undefined;
}

export function getMaxTokens(provider: string, model: string): number {
  const key = provider.toLowerCase();
  const limit = matchModel(MODEL_TOKEN_LIMITS[key], model);
  if (limit !== undefined) return limit;

  return PROVIDER_DEFAULT_TOKEN_LIMITS[key] ?? DEFAULT_MODEL_TOKEN_LIMIT;
}

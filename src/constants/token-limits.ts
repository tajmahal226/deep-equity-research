export const OPENAI_MODEL_TOKEN_LIMITS: Record<string, number> = {
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "gpt-4.1": 128000,
  "gpt-4.1-mini": 128000,
  "gpt-5.2-pro": 512000,
  "gpt-5.2-pro-reasoning": 512000,
  "gpt-5.2-pro-chat": 512000,
  "gpt-5.2-turbo": 256000,
  "gpt-5.2-turbo-reasoning": 256000,
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

// Gemini models expose very large context windows. Google advertises up to 2M
// tokens for Gemini 1.5 Pro and 1M tokens for the Flash family. We round down
// slightly to keep a comfortable margin for system prompts and tool outputs.
export const GOOGLE_GEMINI_MODEL_TOKEN_LIMITS: Record<string, number> = {
  "gemini-1.5-pro": 2000000,
  "gemini-1.5-flash": 1000000,
  "gemini-1.5-flash-8b": 1000000,
  // Gemini 2.0 experimental models currently inherit the 1M token context.
  "gemini-2.0-flash": 1000000,
  "gemini-2.0-flash-lite": 1000000,
  // Gemini 3 models continue to advertise 2M (Pro) and 1M (Flash) windows.
  "gemini-3-pro": 2000000,
  "gemini-3-pro-vision": 2000000,
  "gemini-3-flash": 1000000,
  "gemini-3-flash-vision": 1000000,
  "gemini-3-flash-thinking": 1000000,
};

// Mistral lists 32K context windows for their text models unless otherwise
// stated. Codestral exposes the same limit for code-specific reasoning.
export const MISTRAL_MODEL_TOKEN_LIMITS: Record<string, number> = {
  "mistral-large": 32000,
  "mistral-small": 32000,
  "mistral-medium": 32000,
  "mistral-nemo": 32000,
  "codestral": 32000,
};

// Cohere command models top out at 128K except for command-light, which is
// capped at a smaller 16K window.
export const COHERE_MODEL_TOKEN_LIMITS: Record<string, number> = {
  "command-r-plus": 128000,
  "command-r+": 128000,
  "command-r": 128000,
  "command-light": 16000,
  "command": 128000,
};

// Groq serves multiple hosted open-source models. The limits below mirror the
// context windows published by Groq for each backbone.
export const GROQ_MODEL_TOKEN_LIMITS: Record<string, number> = {
  "llama3-70b": 8192,
  "llama3-8b": 8192,
  "mixtral-8x7b": 32768,
  "mixtral-8x22b": 65536,
  "gemma2-9b": 8192,
  "gemma-7b": 8192,
};

// OpenRouter proxies inherit the upstream model limits. These prefixes match
// the most common routes so we can reuse the authoritative numbers above.
export const OPENROUTER_MODEL_TOKEN_LIMITS: Record<string, number> = {
  "openrouter/anthropic/claude-3": 200000,
  "openrouter/anthropic/claude-3.5": 200000,
  "openrouter/openai/gpt-4o": 128000,
  "openrouter/openai/gpt-4.1": 128000,
  "openrouter/openai/gpt-5": 256000,
  "openrouter/google/gemini-1.5-pro": 2000000,
  "openrouter/google/gemini-1.5-flash": 1000000,
  "openrouter/mistral/mistral-large": 32000,
  // Perplexity routes mirror native Sonar limits (128k) across chat/online variants.
  "openrouter/perplexity/llama-3.1-sonar": 128000,
};

// Perplexity advertises 128K context windows for their Sonar chat/completion
// models. Legacy instruct variants use the same window, so we reuse the
// Sonar numbers as the default for that provider.
export const PERPLEXITY_MODEL_TOKEN_LIMITS: Record<string, number> = {
  // The llm names already encode the 128k window (e.g. `llama-3.1-sonar-large-128k-online`).
  // Matching on the shared sonar prefix keeps the mapping resilient to new size variants.
  "llama-3.1-sonar": 128000,
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

// Maps should store lowercase keys. We lowercase incoming model ids before matching
// so callers can pass canonical or display-case identifiers interchangeably.
function matchModel(map: Record<string, number>, model: string): number | undefined {
  const normalizedModel = model.toLowerCase();
  if (map[normalizedModel] !== undefined) return map[normalizedModel];
  const entry = Object.entries(map).find(([key]) => normalizedModel.startsWith(key));
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
    case "google":
    case "gemini":
      limit = matchModel(GOOGLE_GEMINI_MODEL_TOKEN_LIMITS, model);
      break;
    case "mistral":
      limit = matchModel(MISTRAL_MODEL_TOKEN_LIMITS, model);
      break;
    case "cohere":
      limit = matchModel(COHERE_MODEL_TOKEN_LIMITS, model);
      break;
    case "groq":
      limit = matchModel(GROQ_MODEL_TOKEN_LIMITS, model);
      break;
    case "openrouter":
      limit = matchModel(OPENROUTER_MODEL_TOKEN_LIMITS, model);
      break;
    case "perplexity":
      limit = matchModel(PERPLEXITY_MODEL_TOKEN_LIMITS, model);
      break;
    case "xai":
      limit = matchModel(XAI_MODEL_TOKEN_LIMITS, model);
      break;
    default:
      limit = undefined;
  }

  return limit ?? DEFAULT_MODEL_TOKEN_LIMIT;
}

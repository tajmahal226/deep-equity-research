import type { SettingStore, SettingFunction } from "@/store/setting";

const PROVIDER_STATE_KEY_MAP: Record<string, string> = {
  openai: "openAI",
  openrouter: "openRouter",
  xai: "xAI",
};

export function getProviderStateKey(provider: string): string {
  return PROVIDER_STATE_KEY_MAP[provider] || provider;
}

/**
 * Lookup a provider's API key from the settings store using a provider id.
 * Falls back to the generic `apiKey` field if a provider-specific key is not found.
 */
export function getProviderApiKey(
  store: Record<string, any>,
  provider: string,
): string {
  const keyName = `${getProviderStateKey(provider)}ApiKey`;
  return store[keyName] || store.apiKey || "";
}

/**
 * Resolve the currently active provider using the persisted settings.
 *
 * If the user selected a provider and supplied the corresponding API key we
 * honor that preference. Otherwise we look for the first provider with an
 * available API key so that research flows do not fail due to an empty key
 * (for example when the settings were reset or a provider was selected
 * without configuring credentials). Ollama is treated as always available
 * because it does not require a key.
 */
export function resolveActiveProvider(
  store: SettingStore & SettingFunction,
): string {
  const storeWithIndex = store as unknown as SettingStore & Record<string, unknown>;
  const preferred = store.provider?.trim();

  if (preferred) {
    if (preferred === "ollama") {
      return preferred;
    }

    const preferredKey = getProviderApiKey(storeWithIndex, preferred);
    if (preferredKey) {
      return preferred;
    }
  }

  const fallbackOrder = [
    "openai",
    "anthropic",
    "deepseek",
    "xai",
    "mistral",
    "fireworks",
    "moonshot",
    "openrouter",
    "google",
    "cohere",
    "together",
    "groq",
    "perplexity",
    "ollama",
  ];

  for (const candidate of fallbackOrder) {
    if (candidate === preferred) continue;

    if (candidate === "ollama") {
      return candidate;
    }

    const apiKey = getProviderApiKey(storeWithIndex, candidate);
    if (apiKey) {
      return candidate;
    }
  }

  return preferred || "openai";
}

type ProviderModelPair = {
  thinkingModel: string;
  taskModel: string;
};

const PROVIDER_MODEL_DEFAULTS: Record<string, ProviderModelPair> = {
  anthropic: {
    thinkingModel: "claude-opus-4-5",
    taskModel: "claude-sonnet-4-5",
  },
  deepseek: {
    thinkingModel: "deepseek-reasoner",
    taskModel: "deepseek-chat",
  },
  mistral: {
    thinkingModel: "mistral-large-2512",
    taskModel: "mistral-medium-2508",
  },
  xai: {
    thinkingModel: "grok-4",
    taskModel: "grok-4-1-fast-non-reasoning",
  },
  google: {
    thinkingModel: "gemini-3-pro-preview",
    taskModel: "gemini-3-flash-preview",
  },
  openrouter: {
    thinkingModel: "anthropic/claude-opus-4-5",
    taskModel: "anthropic/claude-sonnet-4-5",
  },
  openai: {
    thinkingModel: "gpt-5.2-pro",
    taskModel: "gpt-5.2",
  },
  fireworks: {
    thinkingModel: "accounts/fireworks/models/kimi-k2p5",
    taskModel: "accounts/fireworks/models/llama4-maverick-instruct-basic",
  },
  moonshot: {
    thinkingModel: "kimi-k2.5",
    taskModel: "kimi-k2.5",
  },
  cohere: {
    thinkingModel: "command-r-plus",
    taskModel: "command-r",
  },
  together: {
    thinkingModel: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    taskModel: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
  },
  groq: {
    thinkingModel: "llama-4-maverick",
    taskModel: "llama-4-scout",
  },
  perplexity: {
    thinkingModel: "sonar-reasoning-pro",
    taskModel: "sonar",
  },
  ollama: {
    thinkingModel: "llama4:maverick",
    taskModel: "llama4:scout",
  },
};

function getProviderModelFromStore(
  store: SettingStore,
  provider: string,
  role: "Thinking" | "Networking",
) {
  const providerKey = getProviderStateKey(provider);
  const key = `${providerKey}${role}Model` as keyof SettingStore;
  const value = store[key];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  // Legacy fallback for providers that historically used unprefixed keys
  const legacyKey =
    role === "Thinking" ? ("thinkingModel" as keyof SettingStore) : ("networkingModel" as keyof SettingStore);
  const legacyValue = store[legacyKey];
  return typeof legacyValue === "string" ? legacyValue.trim() : "";
}

/**
 * Resolve a provider's thinking/task model pair with intelligent fallbacks.
 *
 * The setting store may not have explicit models persisted for a provider –
 * especially for optional providers like OpenRouter or Mistral that default to
 * empty strings.  This helper first checks the store and, if no value exists,
 * falls back to a curated set of defaults that we know work well with the deep
 * research flows.
 */
export function resolveProviderModels(
  store: SettingStore,
  provider: string,
): ProviderModelPair {
  const defaults = PROVIDER_MODEL_DEFAULTS[provider] ||
    PROVIDER_MODEL_DEFAULTS.openai;

  const thinkingModel =
    getProviderModelFromStore(store, provider, "Thinking") ||
    defaults.thinkingModel;

  const taskModel =
    getProviderModelFromStore(store, provider, "Networking") ||
    defaults.taskModel;

  return { thinkingModel, taskModel };
}

export function getProviderModelDefaults(provider: string): ProviderModelPair {
  return PROVIDER_MODEL_DEFAULTS[provider] || PROVIDER_MODEL_DEFAULTS.openai;
}

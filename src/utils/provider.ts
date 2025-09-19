import type { SettingStore } from "@/store/setting";

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

type ProviderModelPair = {
  thinkingModel: string;
  taskModel: string;
};

const PROVIDER_MODEL_DEFAULTS: Record<string, ProviderModelPair> = {
  anthropic: {
    thinkingModel: "claude-3-5-sonnet-20241022",
    taskModel: "claude-3-5-haiku-20241022",
  },
  deepseek: {
    thinkingModel: "deepseek-reasoner",
    taskModel: "deepseek-chat",
  },
  mistral: {
    thinkingModel: "mistral-large-latest",
    taskModel: "mistral-medium-latest",
  },
  xai: {
    thinkingModel: "grok-2-1212",
    taskModel: "grok-2-mini-1212",
  },
  google: {
    thinkingModel: "gemini-2.5-flash-thinking",
    taskModel: "gemini-2.5-pro",
  },
  openrouter: {
    thinkingModel: "anthropic/claude-3.5-sonnet",
    taskModel: "anthropic/claude-3.5-sonnet",
  },
  openai: {
    thinkingModel: "gpt-4o",
    taskModel: "gpt-4o-mini",
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
  return typeof value === "string" ? value.trim() : "";
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


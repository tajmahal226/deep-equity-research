export function getProviderStateKey(provider: string): string {
  const specialCases: Record<string, string> = {
    openai: "openAI",
    openrouter: "openRouter",
    openaicompatible: "openAICompatible",
    xai: "xAI",
  };
  return specialCases[provider] || provider;
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


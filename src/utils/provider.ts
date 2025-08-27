export function getProviderStateKey(provider: string): string {
  const specialCases: Record<string, string> = {
    openai: "openAI",
    openrouter: "openRouter",
    openaicompatible: "openAICompatible",
    xai: "xAI",
  };
  return specialCases[provider] || provider;
}


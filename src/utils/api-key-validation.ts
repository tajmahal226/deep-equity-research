/**
 * API Key Validation Utility
 * 
 * Validates that required API keys are present before making research requests
 */

import { useSettingStore } from "@/store/setting";

export interface ValidationResult {
  isValid: boolean;
  missingKeys: string[];
  message?: string;
}

/**
 * Get the required API key for a given provider
 */
function getProviderApiKey(providerId: string): string {
  const settings = useSettingStore.getState();
  
  switch (providerId) {
    case "openai":
      return settings.openAIApiKey || "";
    case "anthropic":
      return settings.anthropicApiKey || "";
    case "google":
      return settings.apiKey || "";
    case "deepseek":
      return settings.deepseekApiKey || "";
    case "mistral":
      return settings.mistralApiKey || "";
    case "xai":
      return settings.xAIApiKey || "";
    case "cohere":
      return settings.cohereApiKey || "";
    case "openrouter":
      return settings.openRouterApiKey || "";
    case "ollama":
      return ""; // Ollama doesn't require an API key
    default:
      return "";
  }
}

/**
 * Get provider display name
 */
function getProviderDisplayName(providerId: string): string {
  const names: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google (Gemini)",
    deepseek: "DeepSeek",
    mistral: "Mistral",
    xai: "xAI (Grok)",
    cohere: "Cohere",
    openrouter: "OpenRouter",
    ollama: "Ollama",
  };
  
  return names[providerId] || providerId;
}

/**
 * Validate that API keys are present for the selected models
 */
export function validateApiKeys(
  thinkingProviderId?: string,
  taskProviderId?: string
): ValidationResult {
  const missingKeys: string[] = [];
  
  // Check thinking model API key
  if (thinkingProviderId && thinkingProviderId !== "ollama") {
    const thinkingApiKey = getProviderApiKey(thinkingProviderId);
    if (!thinkingApiKey) {
      missingKeys.push(getProviderDisplayName(thinkingProviderId));
    }
  }
  
  // Check task model API key
  if (taskProviderId && taskProviderId !== "ollama") {
    const taskApiKey = getProviderApiKey(taskProviderId);
    if (!taskApiKey && !missingKeys.includes(getProviderDisplayName(taskProviderId))) {
      missingKeys.push(getProviderDisplayName(taskProviderId));
    }
  }
  
  if (missingKeys.length > 0) {
    return {
      isValid: false,
      missingKeys,
      message: `Please add API keys for: ${missingKeys.join(", ")}`,
    };
  }
  
  return {
    isValid: true,
    missingKeys: [],
  };
}

/**
 * Check if in local mode and has at least one API key configured
 */
export function hasAnyApiKey(): boolean {
  const settings = useSettingStore.getState();
  
  return Boolean(
    settings.apiKey ||
    settings.openAIApiKey ||
    settings.anthropicApiKey ||
    settings.deepseekApiKey ||
    settings.mistralApiKey ||
    settings.xAIApiKey ||
    settings.cohereApiKey ||
    settings.openRouterApiKey
  );
}

/**
 * Get list of providers that have API keys configured
 */
export function getConfiguredProviders(): string[] {
  const settings = useSettingStore.getState();
  const configured: string[] = [];
  
  if (settings.openAIApiKey) configured.push("OpenAI");
  if (settings.anthropicApiKey) configured.push("Anthropic");
  if (settings.apiKey) configured.push("Google");
  if (settings.deepseekApiKey) configured.push("DeepSeek");
  if (settings.mistralApiKey) configured.push("Mistral");
  if (settings.xAIApiKey) configured.push("xAI");
  if (settings.cohereApiKey) configured.push("Cohere");
  if (settings.openRouterApiKey) configured.push("OpenRouter");
  
  return configured;
}

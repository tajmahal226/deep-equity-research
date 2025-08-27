import { completePath } from "@/utils/url";

// AI provider API base url
const GOOGLE_GENERATIVE_AI_API_BASE_URL =
  process.env.GOOGLE_GENERATIVE_AI_API_BASE_URL ||
  "https://generativelanguage.googleapis.com";
const OPENROUTER_API_BASE_URL =
  process.env.OPENROUTER_API_BASE_URL || "https://openrouter.ai/api";
const OPENAI_API_BASE_URL =
  process.env.OPENAI_API_BASE_URL || "https://api.openai.com";
const ANTHROPIC_API_BASE_URL =
  process.env.ANTHROPIC_API_BASE_URL || "https://api.anthropic.com";
const DEEPSEEK_API_BASE_URL =
  process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
const XAI_API_BASE_URL = process.env.XAI_API_BASE_URL || "https://api.x.ai";
const MISTRAL_API_BASE_URL =
  process.env.MISTRAL_API_BASE_URL || "https://api.mistral.ai";
const COHERE_API_BASE_URL =
  process.env.COHERE_API_BASE_URL || "https://api.cohere.ai";
const TOGETHER_API_BASE_URL =
  process.env.TOGETHER_API_BASE_URL || "https://api.together.xyz";
const GROQ_API_BASE_URL = process.env.GROQ_API_BASE_URL || "https://api.groq.com";
const PERPLEXITY_API_BASE_URL =
  process.env.PERPLEXITY_API_BASE_URL || "https://api.perplexity.ai";
const AZURE_RESOURCE_NAME = process.env.AZURE_RESOURCE_NAME;
const AZURE_API_BASE_URL = AZURE_RESOURCE_NAME ? `https://${AZURE_RESOURCE_NAME}.openai.azure.com/openai/deployments` : "";
const OPENAI_COMPATIBLE_API_BASE_URL =
  process.env.OPENAI_COMPATIBLE_API_BASE_URL || "";
const POLLINATIONS_API_BASE_URL =
  process.env.POLLINATIONS_API_BASE_URL ||
  "https://text.pollinations.ai/openai";
const OLLAMA_API_BASE_URL =
  process.env.OLLAMA_API_BASE_URL || "http://0.0.0.0:11434";
// Search provider API base url
const TAVILY_API_BASE_URL =
  process.env.TAVILY_API_BASE_URL || "https://api.tavily.com";
const FIRECRAWL_API_BASE_URL =
  process.env.FIRECRAWL_API_BASE_URL || "https://api.firecrawl.dev";
const EXA_API_BASE_URL = process.env.EXA_API_BASE_URL || "https://api.exa.ai";
const BOCHA_API_BASE_URL =
  process.env.BOCHA_API_BASE_URL || "https://api.bochaai.com";
const SEARXNG_API_BASE_URL =
  process.env.SEARXNG_API_BASE_URL || "http://0.0.0.0:8080";

// API keys are resolved dynamically from environment variables within
// their respective lookup functions. This avoids stale values when tests or
// runtime code modify `process.env` after module initialization.

export function getAIProviderBaseURL(provider: string) {
  switch (provider) {
    case "google":
      return completePath(GOOGLE_GENERATIVE_AI_API_BASE_URL, "/v1beta");
    case "openai":
      return completePath(OPENAI_API_BASE_URL, "/v1");
    case "anthropic":
      return completePath(ANTHROPIC_API_BASE_URL, "/v1");
    case "deepseek":
      return completePath(DEEPSEEK_API_BASE_URL, "/v1");
    case "xai":
      return completePath(XAI_API_BASE_URL, "/v1");
    case "mistral":
      return completePath(MISTRAL_API_BASE_URL, "/v1");
    case "cohere":
      return completePath(COHERE_API_BASE_URL, "/v1");
    case "together":
      return completePath(TOGETHER_API_BASE_URL, "/v1");
    case "groq":
      return completePath(GROQ_API_BASE_URL, "/openai/v1");
    case "perplexity":
      return completePath(PERPLEXITY_API_BASE_URL, "/");
    case "azure":
      return AZURE_API_BASE_URL;
    case "openrouter":
      return completePath(OPENROUTER_API_BASE_URL, "/api/v1");
    case "openaicompatible":
      return completePath(OPENAI_COMPATIBLE_API_BASE_URL, "/v1");
    case "pollinations":
      return completePath(POLLINATIONS_API_BASE_URL, "/v1");
    case "ollama":
      return completePath(OLLAMA_API_BASE_URL, "/api");
    default:
      throw new Error("Unsupported Provider: " + provider);
  }
}

export function getAIProviderApiKey(provider: string) {
  const providersWithoutKeys = ["ollama", "pollinations"];
  if (providersWithoutKeys.includes(provider)) return "";

  const envVarNames: Record<string, string> = {
    google: "GOOGLE_GENERATIVE_AI_API_KEY",
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    xai: "XAI_API_KEY",
    mistral: "MISTRAL_API_KEY",
    cohere: "COHERE_API_KEY",
    together: "TOGETHER_API_KEY",
    groq: "GROQ_API_KEY",
    perplexity: "PERPLEXITY_API_KEY",
    azure: "AZURE_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    openaicompatible: "OPENAI_COMPATIBLE_API_KEY",
  };
  const envVarMap: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(envVarNames).map(([provider, env]) => [provider, process.env[env]])
  );

  if (!(provider in envVarMap)) {
    throw new Error("Unsupported Provider: " + provider);
  }

  const apiKey = envVarMap[provider] || "";

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[API Key Debug] Provider: ${provider}, Key available: ${!!apiKey}, Key length: ${apiKey?.length || 0}`
    );
  }

  if (!apiKey) {
    const envVarName = envVarNames[provider];
    console.warn(
      `[API Key Warning] No API key found for provider: ${provider}. Set ${envVarName} environment variable.`
    );
  }

  return apiKey;
}

/**
 * Get API key with fallback for development/demo purposes
 * This allows the app to work even without API keys configured
 */
export function getAIProviderApiKeyWithFallback(provider: string): string {
  const apiKey = getAIProviderApiKey(provider);
  
  // If no API key is found and we're in development, provide guidance
  if (!apiKey && process.env.NODE_ENV === 'development') {
    console.warn(`\n🔑 [Setup Required] No API key found for ${provider}.`);
    console.warn(`   To fix this, add your API key to .env.local:`);
    console.warn(`   ${provider.toUpperCase()}_API_KEY=your-key-here\n`);
    
    // Return empty string - the error handling in the calling code will handle this gracefully
    return '';
  }
  
  return apiKey;
}

export function getSearchProviderBaseURL(provider: string) {
  switch (provider) {
    case "tavily":
      return TAVILY_API_BASE_URL;
    case "firecrawl":
      return FIRECRAWL_API_BASE_URL;
    case "exa":
      return EXA_API_BASE_URL;
    case "bocha":
      return BOCHA_API_BASE_URL;
    case "searxng":
      return SEARXNG_API_BASE_URL;
    case "model":
      return "";
    default:
      throw new Error("Unsupported Provider: " + provider);
  }
}

export function getSearchProviderApiKey(provider: string) {
  // Use the same envVarNames + Object.fromEntries pattern as AI providers for consistency
  const envVarNames = [
    ["tavily", "TAVILY_API_KEY"],
    ["firecrawl", "FIRECRAWL_API_KEY"],
    ["exa", "EXA_API_KEY"],
    ["bocha", "BOCHA_API_KEY"],
  ];
  const envVarMap: Record<string, string | undefined> = Object.fromEntries(
    envVarNames.map(([key, env]) => [key, process.env[env]])
  );

  if (provider === "searxng" || provider === "model") return "";

  if (!(provider in envVarMap)) {
    throw new Error("Unsupported Provider: " + provider);
  }

  return envVarMap[provider] || "";
}

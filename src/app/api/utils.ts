import { completePath } from "@/utils/url";

// AI provider API base url
const GOOGLE_GENERATIVE_AI_API_BASE_URL =
  process.env.GOOGLE_GENERATIVE_AI_API_BASE_URL ||
  "https://generativelanguage.googleapis.com";
const OPENROUTER_API_BASE_URL =
  process.env.OPENROUTER_API_BASE_URL || "https://openrouter.ai";
const OPENAI_API_BASE_URL =
  process.env.OPENAI_API_BASE_URL || "https://api.openai.com";
const ANTHROPIC_API_BASE_URL =
  process.env.ANTHROPIC_API_BASE_URL || "https://api.anthropic.com";
const DEEPSEEK_API_BASE_URL =
  process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
const XAI_API_BASE_URL = process.env.XAI_API_BASE_URL || "https://api.x.ai/v1";
const FIREWORKS_API_BASE_URL =
  process.env.FIREWORKS_API_BASE_URL || "https://api.fireworks.ai";
const MOONSHOT_API_BASE_URL =
  process.env.MOONSHOT_API_BASE_URL || "https://api.moonshot.cn";
const MISTRAL_API_BASE_URL =
  process.env.MISTRAL_API_BASE_URL || "https://api.mistral.ai";
const COHERE_API_BASE_URL =
  process.env.COHERE_API_BASE_URL || "https://api.cohere.ai";
const TOGETHER_API_BASE_URL =
  process.env.TOGETHER_API_BASE_URL || "https://api.together.xyz";
const GROQ_API_BASE_URL = process.env.GROQ_API_BASE_URL || "https://api.groq.com";
const PERPLEXITY_API_BASE_URL =
  process.env.PERPLEXITY_API_BASE_URL || "https://api.perplexity.ai";
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

// Map of AI provider IDs to arrays of their corresponding environment variable names.
// This allows us to log accurate setup instructions for providers whose
// variable name doesn't follow the default `${PROVIDER}_API_KEY` convention
// and to support legacy aliases (e.g. Google).
const AI_PROVIDER_ENV_VARS: Record<string, string[]> = {
  google: [
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GOOGLE_API_KEY",
    "GEMINI_API_KEY",
  ],
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  deepseek: ["DEEPSEEK_API_KEY"],
  xai: ["XAI_API_KEY"],
  fireworks: ["FIREWORKS_API_KEY"],
  moonshot: ["MOONSHOT_API_KEY"],
  mistral: ["MISTRAL_API_KEY"],
  cohere: ["COHERE_API_KEY"],
  together: ["TOGETHER_API_KEY"],
  groq: ["GROQ_API_KEY"],
  perplexity: ["PERPLEXITY_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
};

export function getAIProviderEnvVarNames(provider: string): string[] {
  return AI_PROVIDER_ENV_VARS[provider] ?? [];
}

// API keys are resolved dynamically from environment variables within their
// respective lookup functions. This avoids stale values when tests or runtime
// code modify `process.env` after module initialization.

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
    case "fireworks":
      return completePath(FIREWORKS_API_BASE_URL, "/inference/v1");
    case "moonshot":
      return completePath(MOONSHOT_API_BASE_URL, "/v1");
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
    case "openrouter": {
      const base = OPENROUTER_API_BASE_URL.replace(/\/+$/, "");
      const normalizedBase = base.endsWith("/api") ? base : `${base}/api`;
      return completePath(normalizedBase, "/v1");
    }
    case "ollama":
      return completePath(OLLAMA_API_BASE_URL, "/api");
    default:
      throw new Error("Unsupported Provider: " + provider);
  }
}

/**
 * Get API key from server-side environment variables (optional)
 * 
 * NOTE: Server-side API keys are OPTIONAL. This function is primarily used by
 * the MCP server endpoint which requires server configuration. For normal research
 * operations, users should provide their own API keys via the Settings UI.
 * 
 * If you're deploying this app for multiple users, DO NOT set these environment
 * variables - let users provide their own keys to avoid cost and security risks.
 */
export function getAIProviderApiKey(provider: string) {
  const providersWithoutKeys = ["ollama"];
  if (providersWithoutKeys.includes(provider)) return "";

  const envVarNames = getAIProviderEnvVarNames(provider);
  if (envVarNames.length === 0) {
    throw new Error("Unsupported Provider: " + provider);
  }

  const apiKey = envVarNames.map(name => process.env[name]).find(Boolean) || "";

  if (process.env.NODE_ENV === "development" && apiKey) {
    console.log(
      `[API Key Debug] Provider: ${provider}, Server-side key available: ${!!apiKey}, Key length: ${apiKey?.length || 0}`
    );
  }

  return apiKey;
}

/**
 * Get API key with fallback for development/demo purposes
 * 
 * DEPRECATED: This function is kept for backward compatibility with MCP server.
 * New code should NOT use server-side keys as fallbacks.
 */
export function getAIProviderApiKeyWithFallback(provider: string): string {
  const apiKey = getAIProviderApiKey(provider);

  if (!apiKey && process.env.NODE_ENV === 'development') {
    const envVarNames = getAIProviderEnvVarNames(provider);
    if (envVarNames.length === 0) {
      return '';
    }
    console.warn(`\n🔑 [MCP Server] No server-side API key found for ${provider}.`);
    console.warn(`   MCP server requires server-side keys. Add to .env.local:`);
    envVarNames.forEach(name => {
      console.warn(`   ${name}=your-key-here`);
    });
    console.warn('');
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

/**
 * Get search provider API key from server-side environment variables (optional)
 * 
 * NOTE: Server-side search API keys are OPTIONAL. Users should provide their
 * own search provider keys via the Settings UI. Server-side keys are only for
 * MCP server or specific deployment scenarios.
 */
export function getSearchProviderApiKey(provider: string) {
  const envVarMap: Record<string, string | undefined> = {
    tavily: process.env.TAVILY_API_KEY,
    firecrawl: process.env.FIRECRAWL_API_KEY,
    exa: process.env.EXA_API_KEY,
    bocha: process.env.BOCHA_API_KEY,
  };

  if (provider === "searxng" || provider === "model") return "";

  if (!(provider in envVarMap)) {
    throw new Error("Unsupported Provider: " + provider);
  }

  return envVarMap[provider] || "";
}

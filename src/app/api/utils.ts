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

const GOOGLE_GENERATIVE_AI_API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const XAI_API_KEY = process.env.XAI_API_KEY || "";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const COHERE_API_KEY = process.env.COHERE_API_KEY || "";
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "";
const AZURE_API_KEY = process.env.AZURE_API_KEY || "";
const OPENAI_COMPATIBLE_API_KEY = process.env.OPENAI_COMPATIBLE_API_KEY || "";
// Search provider API key
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "";
const EXA_API_KEY = process.env.EXA_API_KEY || "";
const BOCHA_API_KEY = process.env.BOCHA_API_KEY || "";

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
  let apiKey = "";
  
  switch (provider) {
    case "google":
      apiKey = GOOGLE_GENERATIVE_AI_API_KEY;
      break;
    case "openai":
      apiKey = OPENAI_API_KEY;
      break;
    case "anthropic":
      apiKey = ANTHROPIC_API_KEY;
      break;
    case "deepseek":
      apiKey = DEEPSEEK_API_KEY;
      break;
    case "xai":
      apiKey = XAI_API_KEY;
      break;
    case "mistral":
      apiKey = MISTRAL_API_KEY;
      break;
    case "cohere":
      apiKey = COHERE_API_KEY;
      break;
    case "together":
      apiKey = TOGETHER_API_KEY;
      break;
    case "groq":
      apiKey = GROQ_API_KEY;
      break;
    case "perplexity":
      apiKey = PERPLEXITY_API_KEY;
      break;
    case "azure":
      apiKey = AZURE_API_KEY;
      break;
    case "openrouter":
      apiKey = OPENROUTER_API_KEY;
      break;
    case "openaicompatible":
      apiKey = OPENAI_COMPATIBLE_API_KEY;
      break;
    case "pollinations":
    case "ollama":
      return ""; // These providers don't require API keys
    default:
      throw new Error("Unsupported Provider: " + provider);
  }
  
  // Enhanced debugging for API key resolution
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Key Debug] Provider: ${provider}, Key available: ${!!apiKey}, Key length: ${apiKey?.length || 0}`);
  }
  
  // Log warning if API key is missing for providers that need it
  const providersWithoutKeys = ['ollama', 'pollinations'];
  if (!apiKey && !providersWithoutKeys.includes(provider)) {
    console.warn(`[API Key Warning] No API key found for provider: ${provider}. Set ${provider.toUpperCase()}_API_KEY environment variable.`);
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
  switch (provider) {
    case "tavily":
      return TAVILY_API_KEY;
    case "firecrawl":
      return FIRECRAWL_API_KEY;
    case "exa":
      return EXA_API_KEY;
    case "bocha":
      return BOCHA_API_KEY;
    case "searxng":
    case "model":
      return "";
    default:
      throw new Error("Unsupported Provider: " + provider);
  }
}

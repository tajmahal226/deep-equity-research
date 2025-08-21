import { completePath } from "@/utils/url";
import { env } from "@/utils/env";

// AI provider API base url
const GOOGLE_GENERATIVE_AI_API_BASE_URL =
  env.GOOGLE_GENERATIVE_AI_API_BASE_URL ||
  "https://generativelanguage.googleapis.com";
const OPENROUTER_API_BASE_URL =
  env.OPENROUTER_API_BASE_URL || "https://openrouter.ai/api";
const OPENAI_API_BASE_URL =
  env.OPENAI_API_BASE_URL || "https://api.openai.com";
const ANTHROPIC_API_BASE_URL =
  env.ANTHROPIC_API_BASE_URL || "https://api.anthropic.com";
const DEEPSEEK_API_BASE_URL =
  env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
const XAI_API_BASE_URL = env.XAI_API_BASE_URL || "https://api.x.ai";
const MISTRAL_API_BASE_URL =
  env.MISTRAL_API_BASE_URL || "https://api.mistral.ai";
const AZURE_API_BASE_URL = `https://${env.AZURE_RESOURCE_NAME}.openai.azure.com/openai/deployments`;
const OPENAI_COMPATIBLE_API_BASE_URL =
  env.OPENAI_COMPATIBLE_API_BASE_URL || "";
const POLLINATIONS_API_BASE_URL =
  env.POLLINATIONS_API_BASE_URL ||
  "https://text.pollinations.ai/openai";
const OLLAMA_API_BASE_URL =
  env.OLLAMA_API_BASE_URL || "http://0.0.0.0:11434";
// Search provider API base url
const TAVILY_API_BASE_URL =
  env.TAVILY_API_BASE_URL || "https://api.tavily.com";
const FIRECRAWL_API_BASE_URL =
  env.FIRECRAWL_API_BASE_URL || "https://api.firecrawl.dev";
const EXA_API_BASE_URL = env.EXA_API_BASE_URL || "https://api.exa.ai";
const BOCHA_API_BASE_URL =
  env.BOCHA_API_BASE_URL || "https://api.bochaai.com";
const SEARXNG_API_BASE_URL =
  env.SEARXNG_API_BASE_URL || "http://0.0.0.0:8080";

const GOOGLE_GENERATIVE_AI_API_KEY =
  env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY || "";
const OPENAI_API_KEY = env.OPENAI_API_KEY || "";
const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY || "";
const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY || "";
const XAI_API_KEY = env.XAI_API_KEY || "";
const MISTRAL_API_KEY = env.MISTRAL_API_KEY || "";
const AZURE_API_KEY = env.AZURE_API_KEY || "";
const OPENAI_COMPATIBLE_API_KEY = env.OPENAI_COMPATIBLE_API_KEY || "";
// Search provider API key
const TAVILY_API_KEY = env.TAVILY_API_KEY || "";
const FIRECRAWL_API_KEY = env.FIRECRAWL_API_KEY || "";
const EXA_API_KEY = env.EXA_API_KEY || "";
const BOCHA_API_KEY = env.BOCHA_API_KEY || "";

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
  switch (provider) {
    case "google":
      return GOOGLE_GENERATIVE_AI_API_KEY;
    case "openai":
      return OPENAI_API_KEY;
    case "anthropic":
      return ANTHROPIC_API_KEY;
    case "deepseek":
      return DEEPSEEK_API_KEY;
    case "xai":
      return XAI_API_KEY;
    case "mistral":
      return MISTRAL_API_KEY;
    case "azure":
      return AZURE_API_KEY;
    case "openrouter":
      return OPENROUTER_API_KEY;
    case "openaicompatible":
      return OPENAI_COMPATIBLE_API_KEY;
    case "pollinations":
    case "ollama":
      return "";
    default:
      throw new Error("Unsupported Provider: " + provider);
  }
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

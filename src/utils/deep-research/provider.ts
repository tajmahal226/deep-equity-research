import { LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMistral } from "@ai-sdk/mistral";
import { createXai } from "@ai-sdk/xai";

export interface AIProviderOptions {
  provider: string;
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  model: string;
  settings?: any;
  enableTools?: boolean;
}

/**
 * Creates an AI provider instance compatible with the AI SDK v5.
 *
 * @param options - Configuration options for the provider.
 * @returns A LanguageModel instance.
 */
export async function createAIProvider({
  provider,
  baseURL,
  apiKey,
  model,
  headers,
}: AIProviderOptions): Promise<LanguageModel> {
  // Validate required fields
  if (!provider) {
    console.warn("[createAIProvider] Provider is empty, defaulting to openai");
    provider = "openai";
  }
  if (!model) {
    console.warn("[createAIProvider] Model is empty, defaulting to gpt-4o");
    model = "gpt-4o";
  }

  // console.log(`[createAIProvider] Creating provider: ${provider}, model: ${model}, baseURL: ${baseURL}`);

  try {
    switch (provider) {
      case "openai": {
        const openai = createOpenAI({
          apiKey: apiKey || "",
          baseURL: baseURL || undefined,
          compatibility: "strict",
        });
        return openai(model);
      }

      case "anthropic": {
        const anthropic = createAnthropic({
          apiKey: apiKey || "",
          baseURL: baseURL || undefined,
          headers: headers || {
            "anthropic-dangerous-direct-browser-access": "true",
          },
        });
        return anthropic(model);
      }

      case "google": {
        const google = createGoogleGenerativeAI({
          apiKey: apiKey || "",
          baseURL: baseURL || undefined,
        });
        return google(model);
      }

      case "deepseek": {
        const deepseek = createDeepSeek({
          apiKey: apiKey || "",
          baseURL: baseURL || undefined,
        });
        return deepseek(model);
      }

      case "mistral": {
        const mistral = createMistral({
          apiKey: apiKey || "",
          baseURL: baseURL || undefined,
        });
        return mistral(model);
      }

      case "xai": {
        const xai = createXai({
          apiKey: apiKey || "",
          baseURL: baseURL || undefined,
        });
        return xai(model);
      }

      case "openrouter": {
        // OpenRouter uses OpenAI-compatible API
        const openrouter = createOpenAI({
          apiKey: apiKey || "",
          baseURL: baseURL || "https://openrouter.ai/api/v1",
          compatibility: "compatible",
        });
        return openrouter(model);
      }

      case "ollama": {
        // Ollama uses OpenAI-compatible API
        const ollama = createOpenAI({
          apiKey: apiKey || "ollama", // Ollama doesn't require a real API key
          baseURL: baseURL || "http://localhost:11434/v1",
          compatibility: "compatible",
        });
        return ollama(model);
      }

      case "together": {
        // Together AI uses OpenAI-compatible API
        const together = createOpenAI({
          apiKey: apiKey || "",
          baseURL: baseURL || "https://api.together.xyz/v1",
          compatibility: "compatible",
        });
        return together(model);
      }

      case "groq": {
        // Groq uses OpenAI-compatible API
        const groq = createOpenAI({
          apiKey: apiKey || "",
          baseURL: baseURL || "https://api.groq.com/openai/v1",
          compatibility: "compatible",
        });
        return groq(model);
      }

      case "perplexity": {
        // Perplexity uses OpenAI-compatible API
        const perplexity = createOpenAI({
          apiKey: apiKey || "",
          baseURL: baseURL || "https://api.perplexity.ai",
          compatibility: "compatible",
        });
        return perplexity(model);
      }

      case "cohere": {
        // Cohere uses OpenAI-compatible API
        const cohere = createOpenAI({
          apiKey: apiKey || "",
          baseURL: baseURL || "https://api.cohere.ai/v1",
          compatibility: "compatible",
        });
        return cohere(model);
      }

      default: {
        // Default to OpenAI for unknown providers
        console.warn(`[createAIProvider] Unknown provider "${provider}", falling back to OpenAI`);
        const fallbackOpenai = createOpenAI({
          apiKey: apiKey || "",
          baseURL: baseURL || undefined,
          compatibility: "strict",
        });
        return fallbackOpenai(model || "gpt-4o");
      }
    }
  } catch (error) {
    console.error(`[createAIProvider] Failed to create provider ${provider}:`, error);
    throw error;
  }
}

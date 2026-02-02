import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMistral } from "@ai-sdk/mistral";
import { createOllama } from "ollama-ai-provider";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { LanguageModel } from "ai";
import { normalizeOpenAIModel, usesOpenAIResponsesAPI } from "../openai-models";
import { normalizeXAIModel, isXAIReasoningModel } from "../xai-models";
import { createOpenAIResponsesProvider, requiresResponsesAPI } from "../openai-responses-provider";

export interface AIProviderOptions {
  provider: string;
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  model: string;
  settings?: any;
  enableTools?: boolean;
}

export function filterModelSettings(
  provider: string,
  model: string,
  settings?: Record<string, any>
) {
  if (!settings) return settings;

  const filteredSettings = { ...settings };

  switch (provider) {
    case "openai": {
      const normalizedModel = normalizeOpenAIModel(model);
      if (
        usesOpenAIResponsesAPI(normalizedModel) &&
        "temperature" in filteredSettings
      ) {
        delete filteredSettings.temperature;
      }
      break;
    }
    case "anthropic": {
      if (
        typeof filteredSettings.temperature === "number" &&
        filteredSettings.temperature > 1
      ) {
        filteredSettings.temperature = 1;
      }
      break;
    }
    case "xai": {
      // Reasoning models may not support temperature
      if (
        isXAIReasoningModel(model) &&
        "temperature" in filteredSettings
      ) {
        delete filteredSettings.temperature;
      }
      break;
    }
    default:
      break;
  }

  return filteredSettings;
}

export async function createAIProvider({
  provider,
  baseURL,
  apiKey,
  headers,
  model,
  settings,
}: AIProviderOptions): Promise<LanguageModel> {
  if (!apiKey && provider !== "ollama") {
    throw new Error("API key is required.");
  }

  const commonOptions = {
    baseURL: baseURL || undefined,
    headers: headers || undefined,
    apiKey: apiKey || undefined,
  };

  switch (provider) {
    case "openai": {
      const normalizedModel = normalizeOpenAIModel(model);
      
      // Use Responses API for models that require it (GPT-5.2, o1, o3, etc.)
      if (requiresResponsesAPI(normalizedModel)) {
        const responsesProvider = createOpenAIResponsesProvider({
          ...commonOptions,
        });
        return responsesProvider(normalizedModel, settings) as unknown as LanguageModel;
      }
      
      // Use standard Chat Completions API for other models
      const openai = createOpenAI({
        ...commonOptions,
        compatibility: "compatible",
      });
      return openai(normalizedModel, settings) as unknown as LanguageModel;
    }

    case "anthropic": {
      const anthropic = createAnthropic(commonOptions);
      return anthropic(model, settings) as unknown as LanguageModel;
    }

    case "google": {
      const google = createGoogleGenerativeAI(commonOptions);
      return google(model, settings) as unknown as LanguageModel;
    }

    case "deepseek": {
      const deepseek = createDeepSeek(commonOptions);
      return deepseek(model, settings) as unknown as LanguageModel;
    }

    case "mistral": {
      const mistral = createMistral(commonOptions);
      return mistral(model, settings) as unknown as LanguageModel;
    }

    case "xai": {
      // xAI uses OpenAI-compatible API
      // Use compatibility mode to bypass model validation
      const normalizedXAIModel = normalizeXAIModel(model);
      const xai = createOpenAI({
        ...commonOptions,
        compatibility: "compatible",
      });
      return xai(normalizedXAIModel, settings) as unknown as LanguageModel;
    }

    case "ollama": {
      const ollama = createOllama({
        baseURL: baseURL || "http://localhost:11434/api",
        headers,
      });
      return ollama(model, settings) as unknown as LanguageModel;
    }

    case "openrouter": {
      const openrouter = createOpenRouter({
        ...commonOptions,
        extraBody: settings,
      });
      return openrouter(model, settings) as unknown as LanguageModel;
    }

    case "fireworks":
    case "moonshot":
    case "together":
    case "perplexity": {
      // These providers use OpenAI-compatible APIs
      const openaiCompatible = createOpenAI({
        ...commonOptions,
        compatibility: "compatible",
      });
      return openaiCompatible(model, settings) as unknown as LanguageModel;
    }

    case "groq": {
      const groq = createOpenAI({
        ...commonOptions,
        compatibility: "compatible",
      });
      return groq(model, settings) as unknown as LanguageModel;
    }

    case "cohere": {
      const cohere = createOpenAI({
        ...commonOptions,
        compatibility: "compatible",
      });
      return cohere(model, settings) as unknown as LanguageModel;
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

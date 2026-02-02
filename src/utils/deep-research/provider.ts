import { createOpenAI } from "@ai-sdk/openai";
import { createCustomOpenAIProvider } from "../openai-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMistral } from "@ai-sdk/mistral";
// Note: @ai-sdk/xai uses v1 spec which is incompatible with AI SDK 5
// Using createOpenAI instead since xAI has OpenAI-compatible API
import { createOllama } from "ollama-ai-provider";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createXAIProvider } from "../xai-provider";
import { LanguageModel } from "ai";
import { normalizeOpenAIModel, usesOpenAIResponsesAPI } from "../openai-models";
import { normalizeXAIModel, isXAIReasoningModel } from "../xai-models";

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
    case "openai":
      const normalizedModel = normalizeOpenAIModel(model);
      // Use custom provider to bypass AI SDK 5 model validation for new models like gpt-5.2
      const openaiProvider = createCustomOpenAIProvider({
        ...commonOptions,
      });
      return openaiProvider(normalizedModel, settings) as unknown as LanguageModel;

    case "anthropic":
      const anthropic = createAnthropic(commonOptions);
      return anthropic(model, settings) as unknown as LanguageModel;

    case "google":
      const google = createGoogleGenerativeAI(commonOptions);
      return google(model, settings) as unknown as LanguageModel;

    case "deepseek":
      const deepseek = createDeepSeek(commonOptions);
      return deepseek(model, settings) as unknown as LanguageModel;

    case "mistral":
      const mistral = createMistral(commonOptions);
      return mistral(model, settings) as unknown as LanguageModel;

    case "xai":
      // xAI uses OpenAI-compatible API, use custom provider to bypass AI SDK 5 validation
      const normalizedXAIModel = normalizeXAIModel(model);
      const xaiProvider = createXAIProvider({
        ...commonOptions,
      });
      return xaiProvider(normalizedXAIModel, settings) as unknown as LanguageModel;

    case "ollama":
      const ollama = createOllama({
        baseURL: baseURL || "http://localhost:11434/api",
        headers,
      });
      return ollama(model, settings) as unknown as LanguageModel;

    case "openrouter":
      const openrouter = createOpenRouter({
        ...commonOptions,
        extraBody: settings, // OpenRouter often takes extra parameters in body
      });
      return openrouter(model, settings) as unknown as LanguageModel;

    case "fireworks":
    case "moonshot":
    case "together":
    case "perplexity":
      // These providers use OpenAI-compatible APIs
      // Use "compatible" mode to skip strict model validation (non-OpenAI model names)
      const openaiCompatible = createOpenAI({
        ...commonOptions,
        compatibility: "compatible",
      });
      return openaiCompatible(model, settings) as unknown as LanguageModel;

    case "groq":
      // Groq uses OpenAI-compatible API
      // Use "compatible" mode to skip strict model validation (non-OpenAI model names)
      const groq = createOpenAI({
        ...commonOptions,
        compatibility: "compatible",
      });
      return groq(model, settings) as unknown as LanguageModel;

    case "cohere":
      // Cohere uses OpenAI-compatible API for chat completions
      // Use "compatible" mode to skip strict model validation (non-OpenAI model names)
      const cohere = createOpenAI({
        ...commonOptions,
        compatibility: "compatible",
      });
      return cohere(model, settings) as unknown as LanguageModel;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMistral } from "@ai-sdk/mistral";
import { createXai } from "@ai-sdk/xai";
import { createOllama } from "ollama-ai-provider";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { LanguageModel } from "ai";
import { normalizeOpenAIModel, usesOpenAIResponsesAPI } from "../openai-models";

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
      const openai = createOpenAI({
        ...commonOptions,
        compatibility: "strict",
      });
      return openai(normalizedModel, settings) as unknown as LanguageModel;

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
      const xai = createXai(commonOptions);
      return xai(model, settings) as unknown as LanguageModel;

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
      const fireworksCompatible = createOpenAI({
        ...commonOptions,
        compatibility: "strict",
      });
      return fireworksCompatible(model, settings) as unknown as LanguageModel;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

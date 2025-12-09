// src/utils/api/index.ts

import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./google";
import { DeepSeekProvider } from "./deepseek";
import { OllamaProvider } from "./ollama";
import { OpenRouterProvider } from "./openrouter";
import { MistralProvider } from "./mistral";
import { XaiProvider } from "./xai";

export interface Provider {
  generateReport(prompt: string, options: any): Promise<string>;
  streamReport(prompt: string, options: any): Promise<ReadableStream>;
  getModels(): Promise<string[]>;
}

export function createProvider(provider: string, apiKey: string): Provider {
  switch (provider) {
    case "openai":
      return new OpenAIProvider(apiKey);
    case "anthropic":
      return new AnthropicProvider(apiKey);
    case "google":
      return new GoogleProvider(apiKey);
    case "deepseek":
      return new DeepSeekProvider(apiKey);
    case "ollama":
      return new OllamaProvider(apiKey);
    case "openrouter":
      return new OpenRouterProvider(apiKey);
    case "mistral":
      return new MistralProvider(apiKey);
    case "xai":
      return new XaiProvider(apiKey);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

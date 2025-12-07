import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./google";
import { DeepSeekProvider } from "./deepseek";
import { OllamaProvider } from "./ollama";
import { OpenRouterProvider } from "./openrouter";
import { MistralProvider } from "./mistral";
import { XaiProvider } from "./xai";

/**
 * Interface for AI providers.
 */
export interface Provider {
  /**
   * Generates a report based on the prompt.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options (model, settings, etc.).
   * @returns The generated report text.
   */
  generateReport(prompt: string, options: any): Promise<string>;

  /**
   * Streams a report generation.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns A readable stream of the generated text.
   */
  streamReport(prompt: string, options: any): Promise<ReadableStream>;

  /**
   * Retrieves available models from the provider.
   *
   * @returns A list of model identifiers.
   */
  getModels(): Promise<string[]>;
}

/**
 * Creates a provider instance based on the provider name.
 *
 * @param provider - The provider name (e.g. 'openai', 'anthropic').
 * @param apiKey - The API key for the provider.
 * @returns An instance of the requested provider.
 * @throws Error if the provider is unsupported.
 */
export function createProvider(provider: string, apiKey: string): Provider {
  console.log(`[createProvider] Factory called for: ${provider}`);
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

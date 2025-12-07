import { createProvider } from "@/utils/api";
import { LanguageModel } from "ai";

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
 * Creates an AI provider instance compatible with the AI SDK.
 *
 * @param options - Configuration options for the provider.
 * @returns A LanguageModel instance.
 */
export async function createAIProvider({
  provider,
  apiKey,
  model,
  settings,
}: AIProviderOptions): Promise<LanguageModel> {
  try {
    if (!provider) throw new Error("Provider identifier is required");
    if (!model) throw new Error("Model identifier is required");

    if (!apiKey && provider !== "ollama" && provider !== "model") {
      if (provider !== "ollama") {
        throw new Error("API key is required.");
      }
    }

    console.log(`[createAIProvider] Creating provider: ${provider}, model: ${model}`);

    const apiProvider = createProvider(provider, apiKey || "");

    const validatePrompt = (prompt: unknown) => {
      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        throw new Error("Prompt must be a non-empty string.");
      }
      return prompt;
    };

    return {
      async doStream(options: any) {
        try {
          const stream = await apiProvider.streamReport(validatePrompt(options.prompt), {
            ...settings,
            model,
          });
          return { stream } as any;
        } catch (error) {
          console.error(`[AIProvider] Stream error (${provider}/${model}):`, error);
          throw error;
        }
      },
      async doGenerate(options: any) {
        try {
          const report = await apiProvider.generateReport(
            validatePrompt(options.prompt),
            { ...settings, model }
          );
          return { text: report } as any;
        } catch (error) {
          console.error(`[AIProvider] Generate error (${provider}/${model}):`, error);
          throw error;
        }
      },
    } as any;
  } catch (error) {
    console.error(`[createAIProvider] Failed to create provider ${provider}:`, error);
    throw error;
  }
}

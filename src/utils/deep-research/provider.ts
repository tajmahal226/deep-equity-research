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
  if (!apiKey && provider !== "ollama") {
    throw new Error("API key is required.");
  }

  const apiProvider = createProvider(provider, apiKey || "");

  const validatePrompt = (prompt: unknown) => {
    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      throw new Error("Prompt must be a non-empty string.");
    }

    return prompt;
  };

  return {
    async doStream(options: any) {
      const stream = await apiProvider.streamReport(validatePrompt(options.prompt), {
        ...settings,
        model,
      });

      return {
        stream,
      } as any;
    },
    async doGenerate(options: any) {
      const report = await apiProvider.generateReport(
        validatePrompt(options.prompt),
        {
          ...settings,
          model,
        }
      );

      return {
        text: report,
      } as any;
    },
  } as any;
}

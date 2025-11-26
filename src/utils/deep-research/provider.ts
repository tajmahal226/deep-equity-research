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

  return {
    async doStream(options) {
      const stream = await apiProvider.streamReport(options.prompt, {
        ...settings,
        model,
      });

      return {
        stream,
      } as any;
    },
    async doGenerate(options) {
      const report = await apiProvider.generateReport(options.prompt, {
        ...settings,
        model,
      });

      return {
        text: report,
      } as any;
    },
  } as any;
}

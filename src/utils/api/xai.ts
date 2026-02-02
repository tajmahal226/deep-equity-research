// src/utils/api/xai.ts

import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { createXAIProvider } from "../xai-provider";
import { streamText, generateText } from "ai";

export class XaiProvider implements Provider {
  private provider: ReturnType<typeof createXAIProvider>;
  private apiKey: string;
  private baseURL?: string;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.provider = createXAIProvider({
      apiKey,
      baseURL: baseURL || "https://api.x.ai/v1",
    });
  }

  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const model = this.provider(options.model || "grok-3") as any;
      const result = await retryWithBackoff(() =>
        withTimeout(
          generateText({
            model,
            prompt,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          }),
          options.timeout
        )
      );
      return result.text;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from XAI.");
    }
  }

  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const model = this.provider(options.model || "grok-3") as any;
      const result = await streamText({
        model,
        prompt,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      return result.textStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from XAI.");
    }
  }

  async getModels(): Promise<string[]> {
    try {
      // The xAI API doesn't have a models() endpoint.
      // Return a list of known models.
      return Promise.resolve([
        "grok-3",
        "grok-3-mini",
        "grok-3-fast",
        "grok-3-mini-fast",
        "grok-2",
        "grok-2-mini",
      ]);
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to get models from XAI.");
    }
  }
}

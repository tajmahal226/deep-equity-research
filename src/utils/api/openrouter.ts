// src/utils/api/openrouter.ts

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

export class OpenRouterProvider implements Provider {
  private openrouter: any;

  constructor(apiKey: string) {
    this.openrouter = createOpenRouter({ apiKey });
  }

  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response = await retryWithBackoff(() =>
        withTimeout(
          this.openrouter.completion(prompt, options),
          options.timeout
        )
      );
      return response.completion;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from OpenRouter.");
    }
  }

  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.openrouter(options.model),
        prompt,
      });

      return result.stream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from OpenRouter.");
    }
  }

  async getModels(): Promise<string[]> {
    try {
      // The OpenRouter SDK does not have a models() method.
      // We will return a hardcoded list of models for now.
      return Promise.resolve(["openrouter/google/gemini-pro-1.5", "openrouter/anthropic/claude-3-haiku"]);
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to get models from OpenRouter.");
    }
  }
}

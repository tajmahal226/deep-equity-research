// src/utils/api/openrouter.ts

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

/**
 * OpenRouter Provider implementation.
 */
export class OpenRouterProvider implements Provider {
  private openrouter: any;

  /**
   * Initializes the OpenRouter provider.
   *
   * @param apiKey - The OpenRouter API key.
   */
  constructor(apiKey: string) {
    this.openrouter = createOpenRouter({ apiKey });
  }

  /**
   * Generates a report using OpenRouter.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns The generated report.
   */
  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response: any = await retryWithBackoff(() =>
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

  /**
   * Streams a report generation using OpenRouter.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns A readable stream of the generated report.
   */
  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.openrouter(options.model),
        prompt,
      });

      return result.textStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from OpenRouter.");
    }
  }

  /**
   * Retrieves available models from OpenRouter.
   *
   * @returns List of model IDs.
   */
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

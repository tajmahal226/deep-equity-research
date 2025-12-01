// src/utils/api/deepseek.ts

import { createDeepSeek } from "@ai-sdk/deepseek";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

/**
 * DeepSeek Provider implementation.
 */
export class DeepSeekProvider implements Provider {
  private deepseek: any;

  /**
   * Initializes the DeepSeek provider.
   *
   * @param apiKey - The DeepSeek API key.
   */
  constructor(apiKey: string) {
    this.deepseek = createDeepSeek({ apiKey });
  }

  /**
   * Generates a report using DeepSeek.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns The generated report.
   */
  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response: any = await retryWithBackoff(() =>
        withTimeout(
          this.deepseek.completion(prompt, options),
          options.timeout
        )
      );
      return response.completion;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from DeepSeek.");
    }
  }

  /**
   * Streams a report generation using DeepSeek.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns A readable stream of the generated report.
   */
  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.deepseek(options.model),
        prompt,
      });

      return result.textStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from DeepSeek.");
    }
  }

  /**
   * Retrieves available models from DeepSeek.
   *
   * @returns List of model IDs.
   */
  async getModels(): Promise<string[]> {
    try {
      // The DeepSeek SDK does not have a models() method.
      // We will return a hardcoded list of models for now.
      return Promise.resolve(["deepseek-chat", "deepseek-coder"]);
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to get models from DeepSeek.");
    }
  }
}

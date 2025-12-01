// src/utils/api/anthropic.ts

import { createAnthropic } from "@ai-sdk/anthropic";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

/**
 * Anthropic Provider implementation.
 */
export class AnthropicProvider implements Provider {
  private anthropic: any;

  /**
   * Initializes the Anthropic provider.
   *
   * @param apiKey - The Anthropic API key.
   */
  constructor(apiKey: string) {
    this.anthropic = createAnthropic({ apiKey });
  }

  /**
   * Generates a report using Anthropic.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns The generated report.
   */
  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response: any = await retryWithBackoff(() =>
        withTimeout(
          this.anthropic.completion(prompt, options),
          options.timeout
        )
      );
      return response.completion;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from Anthropic.");
    }
  }

  /**
   * Streams a report generation using Anthropic.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns A readable stream of the generated report.
   */
  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.anthropic(options.model),
        prompt,
      });

      return result.textStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from Anthropic.");
    }
  }

  /**
   * Retrieves available models from Anthropic.
   *
   * @returns List of model IDs.
   */
  async getModels(): Promise<string[]> {
    try {
      // The Anthropic SDK does not have a models() method.
      // We will return a hardcoded list of models for now.
      return Promise.resolve(["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"]);
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to get models from Anthropic.");
    }
  }
}

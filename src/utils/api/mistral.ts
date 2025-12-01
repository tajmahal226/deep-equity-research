// src/utils/api/mistral.ts

import { createMistral } from "@ai-sdk/mistral";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

/**
 * Mistral Provider implementation.
 */
export class MistralProvider implements Provider {
  private mistral: any;

  /**
   * Initializes the Mistral provider.
   *
   * @param apiKey - The Mistral API key.
   */
  constructor(apiKey: string) {
    this.mistral = createMistral({ apiKey });
  }

  /**
   * Generates a report using Mistral.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns The generated report.
   */
  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response: any = await retryWithBackoff(() =>
        withTimeout(
          this.mistral.completion(prompt, options),
          options.timeout
        )
      );
      return response.completion;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from Mistral.");
    }
  }

  /**
   * Streams a report generation using Mistral.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns A readable stream of the generated report.
   */
  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.mistral(options.model),
        prompt,
      });

      return result.textStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from Mistral.");
    }
  }

  /**
   * Retrieves available models from Mistral.
   *
   * @returns List of model IDs.
   */
  async getModels(): Promise<string[]> {
    try {
      // The Mistral SDK does not have a models() method.
      // We will return a hardcoded list of models for now.
      return Promise.resolve(["mistral-large-latest", "mistral-small-latest"]);
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to get models from Mistral.");
    }
  }
}

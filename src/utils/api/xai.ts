// src/utils/api/xai.ts

import { createXai } from "@ai-sdk/xai";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

/**
 * xAI Provider implementation.
 */
export class XaiProvider implements Provider {
  private xai: any;

  /**
   * Initializes the xAI provider.
   *
   * @param apiKey - The xAI API key.
   */
  constructor(apiKey: string) {
    this.xai = createXai({ apiKey });
  }

  /**
   * Generates a report using xAI.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns The generated report.
   */
  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response: any = await retryWithBackoff(() =>
        withTimeout(
          this.xai.completion(prompt, options),
          options.timeout
        )
      );
      return response.completion;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from Xai.");
    }
  }

  /**
   * Streams a report generation using xAI.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns A readable stream of the generated report.
   */
  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.xai(options.model),
        prompt,
      });

      return result.textStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from Xai.");
    }
  }

  /**
   * Retrieves available models from xAI.
   *
   * @returns List of model IDs.
   */
  async getModels(): Promise<string[]> {
    try {
      // The Xai SDK does not have a models() method.
      // We will return a hardcoded list of models for now.
      return Promise.resolve(["grok-1.5-flash", "grok-1.5-haiku"]);
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to get models from Xai.");
    }
  }
}

// src/utils/api/openai.ts

import { createOpenAI } from "@ai-sdk/openai";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

/**
 * OpenAI Provider implementation.
 */
export class OpenAIProvider implements Provider {
  private openai: any;

  /**
   * Initializes the OpenAI provider.
   *
   * @param apiKey - The OpenAI API key.
   */
  constructor(apiKey: string) {
    this.openai = createOpenAI({ apiKey });
  }

  /**
   * Generates a report using OpenAI.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns The generated report.
   */
  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response: any = await retryWithBackoff(() =>
        withTimeout(
          this.openai.completion(prompt, options),
          options.timeout
        )
      );
      return response.choices[0].text;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from OpenAI.");
    }
  }

  /**
   * Streams a report generation using OpenAI.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns A readable stream of the generated report.
   */
  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.openai(options.model),
        prompt,
      });

      return result.textStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from OpenAI.");
    }
  }

  /**
   * Retrieves available models from OpenAI.
   *
   * @returns List of model IDs.
   */
  async getModels(): Promise<string[]> {
    try {
      const response: any = await retryWithBackoff(() =>
        withTimeout(
          this.openai.models(),
          10000 // 10 seconds timeout
        )
      );
      return response.data.map((model: any) => model.id);
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to get models from OpenAI.");
    }
  }
}

// src/utils/api/anthropic.ts

import { createAnthropic } from "@ai-sdk/anthropic";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

export class AnthropicProvider implements Provider {
  private anthropic: any;

  constructor(apiKey: string) {
    this.anthropic = createAnthropic({ apiKey });
  }

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

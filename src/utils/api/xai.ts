// src/utils/api/xai.ts

import { createXai } from "@ai-sdk/xai";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

export class XaiProvider implements Provider {
  private xai: any;

  constructor(apiKey: string) {
    this.xai = createXai({ apiKey });
  }

  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response = await retryWithBackoff(() =>
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

  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.xai(options.model),
        prompt,
      });

      return result.stream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from Xai.");
    }
  }

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

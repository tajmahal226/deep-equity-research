// src/utils/api/deepseek.ts

import { createDeepSeek } from "@ai-sdk/deepseek";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

export class DeepSeekProvider implements Provider {
  private deepseek: any;

  constructor(apiKey: string) {
    this.deepseek = createDeepSeek({ apiKey });
  }

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

// src/utils/api/google.ts

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

export class GoogleProvider implements Provider {
  private google: any;

  constructor(apiKey: string) {
    this.google = createGoogleGenerativeAI({ apiKey });
  }

  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response: any = await retryWithBackoff(() =>
        withTimeout(
          this.google.completion(prompt, options),
          options.timeout
        )
      );
      return response.completion;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from Google.");
    }
  }

  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.google(options.model),
        prompt,
      });

      return result.textStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from Google.");
    }
  }

  async getModels(): Promise<string[]> {
    try {
      // The Google SDK does not have a models() method.
      // We will return a hardcoded list of models for now.
      return Promise.resolve(["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"]);
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to get models from Google.");
    }
  }
}

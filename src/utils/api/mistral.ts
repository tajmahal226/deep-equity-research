// src/utils/api/mistral.ts

import { createMistral } from "@ai-sdk/mistral";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

export class MistralProvider implements Provider {
  private mistral: any;

  constructor(apiKey: string) {
    this.mistral = createMistral({ apiKey });
  }

  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response = await retryWithBackoff(() =>
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

  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.mistral(options.model),
        prompt,
      });

      return result.stream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from Mistral.");
    }
  }

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

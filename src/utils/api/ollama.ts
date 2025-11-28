// src/utils/api/ollama.ts

import { createOllama } from "ollama-ai-provider";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

export class OllamaProvider implements Provider {
  private ollama: any;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_apiKey: string) {
    // Ollama doesn't require an API key, but we accept it for consistency
    this.ollama = createOllama();
  }

  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response: any = await retryWithBackoff(() =>
        withTimeout(
          this.ollama.completion(prompt, options),
          options.timeout
        )
      );
      return response.completion;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from Ollama.");
    }
  }

  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.ollama(options.model),
        prompt,
      });

      return result.textStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from Ollama.");
    }
  }

  async getModels(): Promise<string[]> {
    try {
      // The Ollama SDK does not have a models() method.
      // We will return a hardcoded list of models for now.
      return Promise.resolve(["llama2", "mistral"]);
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to get models from Ollama.");
    }
  }
}

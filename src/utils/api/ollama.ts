// src/utils/api/ollama.ts

import { createOllama } from "ollama-ai-provider";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText } from "ai";

/**
 * Ollama Provider implementation.
 */
export class OllamaProvider implements Provider {
  private ollama: any;

  /**
   * Initializes the Ollama provider.
   *
   * @param _apiKey - Unused, as Ollama is local.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_apiKey: string) {
    // Ollama doesn't require an API key, but we accept it for consistency
    this.ollama = createOllama();
  }

  /**
   * Generates a report using Ollama.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns The generated report.
   */
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

  /**
   * Streams a report generation using Ollama.
   *
   * @param prompt - The input prompt.
   * @param options - Generation options.
   * @returns A readable stream of the generated report.
   */
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

  /**
   * Retrieves available models from Ollama.
   *
   * @returns List of model IDs.
   */
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

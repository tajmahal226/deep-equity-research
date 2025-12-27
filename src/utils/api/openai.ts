// src/utils/api/openai.ts

import { createOpenAI } from "@ai-sdk/openai";
import { Provider } from ".";
import { withTimeout, retryWithBackoff } from "../timeout-config";
import { AppError, handleError } from "../error";
import { streamText, generateText } from "ai";

export class OpenAIProvider implements Provider {
  private openai: any;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.openai = createOpenAI({
      apiKey,
      compatibility: "strict",
    });
  }

  async generateReport(prompt: string, options: any): Promise<string> {
    try {
      const response = await retryWithBackoff(() =>
        withTimeout(
          generateText({
            model: this.openai(options.model || "gpt-4o"),
            prompt,
            temperature: options.temperature,
            // @ts-expect-error maxTokens is valid in AI SDK but types might be outdated or strict
            maxTokens: options.maxTokens,
            abortSignal: options.signal,
          }),
          options.timeout || 60000
        )
      );
      return response.text;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to generate report from OpenAI.");
    }
  }

  async streamReport(prompt: string, options: any): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: this.openai(options.model || "gpt-4o"),
        prompt,
        temperature: options.temperature,
        // @ts-expect-error maxTokens is valid in AI SDK but types might be outdated or strict
        maxTokens: options.maxTokens,
        abortSignal: options.signal,
      });

      return result.textStream as unknown as ReadableStream;
    } catch (error) {
      handleError(error);
      throw new AppError("Failed to stream report from OpenAI.");
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response: any = await retryWithBackoff(() =>
        withTimeout(
          fetch("https://api.openai.com/v1/models", {
            headers: {
              "Authorization": `Bearer ${this.apiKey}`,
            },
          }).then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`OpenAI API Error: ${res.statusText} - ${text}`);
            }
            return res.json();
          }),
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

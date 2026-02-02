interface XAIProviderOptions {
  baseURL?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

interface XAIConfig {
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

// xAI provider that implements LanguageModelV1 interface directly
// This bypasses AI SDK 5 validation issues with the official @ai-sdk/xai package
class XAILanguageModel {
  readonly specificationVersion = "v2" as const;
  readonly modelId: string;
  readonly provider = "xai";
  readonly defaultObjectGenerationMode = "json";
  readonly supportsImageUrls = false;
  readonly supportsStructuredOutputs = true;

  private config: XAIConfig;

  constructor(modelId: string, config: XAIConfig) {
    this.modelId = modelId;
    this.config = config;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
    };
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }
    return headers;
  }

  async doGenerate(options: {
    inputFormat?: "prompt" | "messages";
    mode?:
      | { type: "regular"; tools?: any[]; toolChoice?: any }
      | { type: "object-json"; schema: any; name?: string; description?: string }
      | { type: "object-tool"; tool: any };
    prompt: any[];
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    responseFormat?: { type: "json" | "text" };
    seed?: number;
    abortSignal?: AbortSignal;
    providerMetadata?: Record<string, Record<string, any>>;
  }): Promise<{
    text?: string;
    toolCalls?: any[];
    finishReason: "stop" | "length" | "other" | "error" | "unknown";
    usage: { promptTokens: number; completionTokens: number };
    rawCall: { rawPrompt: any; rawSettings: Record<string, unknown> };
    rawResponse?: { headers?: Record<string, string> };
    response?: { id?: string; timestamp?: Date; modelId?: string };
    warnings?: any[];
    request?: { body?: string };
  }> {
    const messages = this.convertPromptToMessages(options.prompt);
    const body: any = {
      model: this.modelId,
      messages,
    };
    
    if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
    if (options.temperature !== undefined) body.temperature = options.temperature;
    if (options.topP !== undefined) body.top_p = options.topP;
    if (options.stopSequences !== undefined) body.stop = options.stopSequences;
    if (options.responseFormat?.type === "json") body.response_format = { type: "json_object" };

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`xAI API error (${response.status}): ${text}`);
    }

    const data = await response.json() as any;
    const choice = data.choices?.[0];

    return {
      text: choice?.message?.content || "",
      finishReason: this.mapFinishReason(choice?.finish_reason),
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
      },
      rawCall: {
        rawPrompt: messages,
        rawSettings: body,
      },
      response: {
        id: data.id,
        timestamp: new Date(),
        modelId: data.model,
      },
      warnings: [],
    };
  }

  async doStream(options: {
    inputFormat?: "prompt" | "messages";
    mode?:
      | { type: "regular"; tools?: any[]; toolChoice?: any }
      | { type: "object-json"; schema: any; name?: string; description?: string }
      | { type: "object-tool"; tool: any };
    prompt: any[];
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    responseFormat?: { type: "json" | "text" };
    seed?: number;
    abortSignal?: AbortSignal;
    providerMetadata?: Record<string, Record<string, any>>;
  }): Promise<{
    stream: ReadableStream<any>;
    rawCall: { rawPrompt: any; rawSettings: Record<string, unknown> };
    rawResponse?: { headers?: Record<string, string> };
    warnings?: any[];
    request?: { body?: string };
  }> {
    const messages = this.convertPromptToMessages(options.prompt);
    const body: any = {
      model: this.modelId,
      messages,
      stream: true,
    };
    
    if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
    if (options.temperature !== undefined) body.temperature = options.temperature;
    if (options.topP !== undefined) body.top_p = options.topP;
    if (options.stopSequences !== undefined) body.stop = options.stopSequences;

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`xAI API error (${response.status}): ${text}`);
    }

    const stream = this.createStream(response);

    return {
      stream,
      rawCall: {
        rawPrompt: messages,
        rawSettings: body,
      },
      warnings: [],
    };
  }

  private createStream(response: Response): ReadableStream<any> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream({
      start: async (controller) => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;

              try {
                const chunk = JSON.parse(data);
                const delta = chunk.choices?.[0]?.delta;

                if (delta?.content) {
                  controller.enqueue({
                    type: "text-delta",
                    textDelta: delta.content,
                  });
                }

                if (chunk.usage) {
                  controller.enqueue({
                    type: "finish",
                    finishReason: "stop",
                    usage: {
                      promptTokens: chunk.usage.prompt_tokens || 0,
                      completionTokens: chunk.usage.completion_tokens || 0,
                    },
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }

          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: { promptTokens: 0, completionTokens: 0 },
          });
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  private convertPromptToMessages(prompt: any[]): any[] {
    // Convert AI SDK prompt format to xAI/OpenAI format
    return prompt.map((p) => {
      if (p.role === "user") {
        return {
          role: "user",
          content: typeof p.content === "string" ? p.content : JSON.stringify(p.content),
        };
      }
      if (p.role === "assistant") {
        return {
          role: "assistant",
          content: typeof p.content === "string" ? p.content : JSON.stringify(p.content),
        };
      }
      if (p.role === "system") {
        return {
          role: "system",
          content: typeof p.content === "string" ? p.content : JSON.stringify(p.content),
        };
      }
      return p;
    });
  }

  private mapFinishReason(reason?: string): "stop" | "length" | "other" | "error" | "unknown" {
    switch (reason) {
      case "stop":
        return "stop";
      case "length":
        return "length";
      case "content_filter":
        return "other";
      default:
        return "unknown";
    }
  }
}

export function createXAIProvider(options: XAIProviderOptions) {
  const config: XAIConfig = {
    baseURL: options.baseURL || "https://api.x.ai/v1",
    apiKey: options.apiKey,
    headers: options.headers,
  };

  return function xai(modelId: string, _settings?: any) {
    return new XAILanguageModel(modelId, config);
  };
}

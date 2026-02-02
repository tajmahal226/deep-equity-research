interface OpenAIProviderOptions {
  baseURL?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  compatibility?: "strict" | "compatible";
}

interface OpenAIConfig {
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  compatibility: "strict" | "compatible";
}

// Custom OpenAI provider that bypasses AI SDK model validation
// This allows using new models like gpt-5.2-pro that aren't in the SDK's known model list
class OpenAILanguageModel {
  readonly specificationVersion = "v1" as const;
  readonly modelId: string;
  readonly provider = "openai";
  readonly defaultObjectGenerationMode = "json";

  private config: OpenAIConfig;

  constructor(modelId: string, config: OpenAIConfig) {
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

  private getEndpoint(): string {
    // Use responses API for reasoning models, chat completions for others
    const isResponsesModel = this.modelId.startsWith("o1") || 
                             this.modelId.startsWith("o3") ||
                             this.modelId.startsWith("gpt-5") ||
                             this.modelId.startsWith("gpt-4.1");
    
    if (isResponsesModel) {
      return `${this.config.baseURL}/responses`;
    }
    return `${this.config.baseURL}/chat/completions`;
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
    const isResponsesEndpoint = this.getEndpoint().includes("/responses");
    
    let body: any;
    if (isResponsesEndpoint) {
      body = {
        model: this.modelId,
        input: messages,
        ...(options.maxTokens !== undefined && { max_output_tokens: options.maxTokens }),
        ...(options.temperature !== undefined && { temperature: options.temperature }),
        ...(options.topP !== undefined && { top_p: options.topP }),
        ...(options.stopSequences !== undefined && { stop: options.stopSequences }),
      };
    } else {
      body = {
        model: this.modelId,
        messages,
        ...(options.maxTokens !== undefined && { max_tokens: options.maxTokens }),
        ...(options.temperature !== undefined && { temperature: options.temperature }),
        ...(options.topP !== undefined && { top_p: options.topP }),
        ...(options.stopSequences !== undefined && { stop: options.stopSequences }),
        ...(options.responseFormat?.type === "json" && { response_format: { type: "json_object" } }),
        stream: false,
      };
    }

    const response = await fetch(this.getEndpoint(), {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${text}`);
    }

    const data = await response.json() as any;
    
    // Handle responses API format
    if (isResponsesEndpoint) {
      const outputText = data.output?.[0]?.content?.[0]?.text || 
                        data.output_text || 
                        "";
      
      return {
        text: outputText,
        finishReason: this.mapFinishReason(data.incomplete?.reason || "stop"),
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
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
    
    // Handle chat completions format
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
    const isResponsesEndpoint = this.getEndpoint().includes("/responses");
    
    let body: any;
    if (isResponsesEndpoint) {
      body = {
        model: this.modelId,
        input: messages,
        stream: true,
        ...(options.maxTokens !== undefined && { max_output_tokens: options.maxTokens }),
        ...(options.temperature !== undefined && { temperature: options.temperature }),
      };
    } else {
      body = {
        model: this.modelId,
        messages,
        stream: true,
        ...(options.maxTokens !== undefined && { max_tokens: options.maxTokens }),
        ...(options.temperature !== undefined && { temperature: options.temperature }),
        ...(options.topP !== undefined && { top_p: options.topP }),
        ...(options.stopSequences !== undefined && { stop: options.stopSequences }),
      };
    }

    const response = await fetch(this.getEndpoint(), {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${text}`);
    }

    const stream = this.createStream(response, isResponsesEndpoint);

    return {
      stream,
      rawCall: {
        rawPrompt: messages,
        rawSettings: body,
      },
      warnings: [],
    };
  }

  private createStream(response: Response, isResponsesEndpoint: boolean): ReadableStream<any> {
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
                
                if (isResponsesEndpoint) {
                  // Handle responses API streaming format
                  const delta = chunk.output?.[0]?.content?.[0]?.text || 
                               chunk.delta?.text || 
                               chunk.output_text_delta ||
                               "";
                  if (delta) {
                    controller.enqueue({
                      type: "text-delta",
                      textDelta: delta,
                    });
                  }
                } else {
                  // Handle chat completions streaming format
                  const delta = chunk.choices?.[0]?.delta?.content;
                  if (delta) {
                    controller.enqueue({
                      type: "text-delta",
                      textDelta: delta,
                    });
                  }
                }

                if (chunk.usage) {
                  controller.enqueue({
                    type: "finish",
                    finishReason: "stop",
                    usage: {
                      promptTokens: chunk.usage.prompt_tokens || chunk.usage.input_tokens || 0,
                      completionTokens: chunk.usage.completion_tokens || chunk.usage.output_tokens || 0,
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
    // Convert AI SDK prompt format to OpenAI format
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
      case "end_turn":
        return "stop";
      case "length":
      case "max_tokens":
        return "length";
      case "content_filter":
        return "other";
      default:
        return "unknown";
    }
  }
}

export function createCustomOpenAIProvider(options: OpenAIProviderOptions) {
  const config: OpenAIConfig = {
    baseURL: options.baseURL || "https://api.openai.com/v1",
    apiKey: options.apiKey,
    headers: options.headers,
    compatibility: options.compatibility || "compatible",
  };

  return function openai(modelId: string, _settings?: any) {
    return new OpenAILanguageModel(modelId, config);
  };
}

/**
 * OpenAI Responses API Provider
 * 
 * This provider uses the OpenAI Responses API (v1/responses) instead of Chat Completions.
 * Required for models like GPT-5.2-pro, o1, o3, and other reasoning models.
 */

interface ResponsesProviderOptions {
  baseURL?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

interface ResponsesConfig {
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

// Responses API request/response types
interface ResponsesRequest {
  model: string;
  input: any[];
  instructions?: string;
  max_output_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
  response_format?: { type: "json" | "text" };
}

interface ResponsesResponse {
  id: string;
  object: "response";
  created_at: number;
  status: "completed" | "in_progress" | "failed" | "incomplete";
  error: any;
  incomplete_details?: any;
  instructions?: string;
  max_output_tokens?: number;
  model: string;
  output: any[];
  output_text?: string;
  parallel_tool_calls?: boolean;
  reasoning?: { effort?: "low" | "medium" | "high"; generate_summary?: boolean };
  temperature?: number;
  tool_choice?: any;
  tools?: any[];
  top_p?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_tokens_details?: any;
    output_tokens_details?: any;
  };
  user?: string;
  metadata?: Record<string, string>;
}

class OpenAIResponsesLanguageModel {
  readonly specificationVersion = "v1" as const;
  readonly modelId: string;
  readonly provider = "openai.responses";
  readonly defaultObjectGenerationMode = "json";

  private config: ResponsesConfig;

  constructor(modelId: string, config: ResponsesConfig) {
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

  private convertPromptToInput(prompt: any[]): any[] {
    // Convert AI SDK prompt format to Responses API input format
    return prompt.map((p) => {
      if (p.role === "user") {
        return {
          role: "user",
          content: typeof p.content === "string" 
            ? [{ type: "input_text", text: p.content }]
            : p.content,
        };
      }
      if (p.role === "assistant") {
        return {
          role: "assistant",
          content: typeof p.content === "string"
            ? [{ type: "output_text", text: p.content }]
            : p.content,
        };
      }
      if (p.role === "system") {
        // System messages become "instructions" in Responses API
        return {
          role: "system",
          content: typeof p.content === "string" ? p.content : JSON.stringify(p.content),
        };
      }
      return p;
    });
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
    // Extract system message as instructions
    const systemMessage = options.prompt.find((p: any) => p.role === "system");
    const nonSystemPrompt = options.prompt.filter((p: any) => p.role !== "system");
    
    const input = this.convertPromptToInput(nonSystemPrompt);
    
    const body: ResponsesRequest = {
      model: this.modelId,
      input,
      ...(systemMessage && { instructions: systemMessage.content }),
      ...(options.maxTokens !== undefined && { max_output_tokens: options.maxTokens }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.topP !== undefined && { top_p: options.topP }),
      ...(options.responseFormat?.type === "json" && { 
        text: { format: { type: "json_object" } } 
      }),
      stream: false,
    };

    const response = await fetch(`${this.config.baseURL}/responses`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI Responses API error (${response.status}): ${text}`);
    }

    const data: ResponsesResponse = await response.json();
    
    // Extract text from output
    let outputText = "";
    if (data.output_text) {
      outputText = data.output_text;
    } else if (data.output) {
      for (const item of data.output) {
        if (item.type === "message" && item.content) {
          for (const content of item.content) {
            if (content.type === "output_text" && content.text) {
              outputText += content.text;
            }
          }
        }
      }
    }

    return {
      text: outputText,
      finishReason: this.mapFinishReason(data.status, data.incomplete_details),
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
      },
      rawCall: {
        rawPrompt: input,
        rawSettings: body as unknown as Record<string, unknown>,
      },
      response: {
        id: data.id,
        timestamp: new Date(data.created_at * 1000),
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
    // Extract system message as instructions
    const systemMessage = options.prompt.find((p: any) => p.role === "system");
    const nonSystemPrompt = options.prompt.filter((p: any) => p.role !== "system");
    
    const input = this.convertPromptToInput(nonSystemPrompt);
    
    const body: ResponsesRequest = {
      model: this.modelId,
      input,
      ...(systemMessage && { instructions: systemMessage.content }),
      ...(options.maxTokens !== undefined && { max_output_tokens: options.maxTokens }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.topP !== undefined && { top_p: options.topP }),
      stream: true,
    };

    const response = await fetch(`${this.config.baseURL}/responses`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI Responses API error (${response.status}): ${text}`);
    }

    const stream = this.createStream(response);

    return {
      stream,
      rawCall: {
        rawPrompt: input,
        rawSettings: body as unknown as Record<string, unknown>,
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
                const event = JSON.parse(data);
                
                // Handle different event types
                if (event.type === "response.output_text.delta") {
                  if (event.delta) {
                    controller.enqueue({
                      type: "text-delta",
                      textDelta: event.delta,
                    });
                  }
                } else if (event.type === "response.completed") {
                  const usage = event.response?.usage;
                  controller.enqueue({
                    type: "finish",
                    finishReason: "stop",
                    usage: {
                      promptTokens: usage?.input_tokens || 0,
                      completionTokens: usage?.output_tokens || 0,
                    },
                  });
                } else if (event.output_text) {
                  // Fallback for different response format
                  controller.enqueue({
                    type: "text-delta",
                    textDelta: event.output_text,
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

  private mapFinishReason(
    status: string,
    incompleteDetails?: any
  ): "stop" | "length" | "other" | "error" | "unknown" {
    switch (status) {
      case "completed":
        return "stop";
      case "incomplete":
        if (incompleteDetails?.reason === "max_output_tokens") {
          return "length";
        }
        return "other";
      case "failed":
        return "error";
      default:
        return "unknown";
    }
  }
}

export function createOpenAIResponsesProvider(options: ResponsesProviderOptions) {
  const config: ResponsesConfig = {
    baseURL: options.baseURL || "https://api.openai.com/v1",
    apiKey: options.apiKey,
    headers: options.headers,
  };

  return function openaiResponses(modelId: string, _settings?: any) {
    return new OpenAIResponsesLanguageModel(modelId, config);
  };
}

// Check if a model requires the Responses API
export function requiresResponsesAPI(model: string): boolean {
  const normalized = model.toLowerCase();
  return (
    normalized.startsWith("o1") ||
    normalized.startsWith("o3") ||
    normalized.startsWith("gpt-5.2") ||
    normalized === "gpt-5"
  );
}

interface ModelDefaults {
  thinkingModel: string;
  networkingModel: string;
}

function getDefaultModelConfig(providerId?: string): ModelDefaults {
  switch (providerId) {
    case "anthropic":
      return { thinkingModel: "claude-opus-4-1-20250805", networkingModel: "claude-sonnet-4-0-20250805" };
    case "deepseek":
      return { thinkingModel: "deepseek-reasoner", networkingModel: "deepseek-chat" };
    case "mistral":
      return { thinkingModel: "mistral-large-2411", networkingModel: "mistral-large-latest" };
    case "xai":
      return { thinkingModel: "grok-3", networkingModel: "grok-3" };
    case "google":
      return { thinkingModel: "gemini-2.5-flash-thinking", networkingModel: "gemini-2.5-pro" };
    case "openrouter":
      return { thinkingModel: "anthropic/claude-3.5-sonnet", networkingModel: "anthropic/claude-3.5-sonnet" };
    case "ollama":
      return { thinkingModel: "llama3.1:8b", networkingModel: "llama3.1:8b" };
    case "openai":
    default:
      return { thinkingModel: "gpt-5", networkingModel: "gpt-5-turbo" };
  }
}

export interface ModelConfig {
  modelId: string;
  providerId: string;
  apiKey?: string;
}

export interface BulkCompanyRequest {
  companies: string[];
  commonIndustry?: string;
  language?: string;
  thinkingModelId?: string;
  taskModelId?: string;
  thinkingProviderId?: string;
  taskProviderId?: string;
  thinkingApiKey?: string;
  taskApiKey?: string;
  searchProviderId?: string;
  searchApiKey?: string;
}

export function resolveModelConfigs(body: BulkCompanyRequest): {
  thinkingModelConfig: ModelConfig;
  taskModelConfig: ModelConfig;
} {
  const resolvedThinkingProvider = body.thinkingProviderId || body.taskProviderId || "openai";
  const resolvedTaskProvider = body.taskProviderId || body.thinkingProviderId || "openai";

  const thinkingDefaults = getDefaultModelConfig(resolvedThinkingProvider);
  const taskDefaults = getDefaultModelConfig(resolvedTaskProvider);

  const thinkingModelConfig: ModelConfig = {
    modelId: body.thinkingModelId || thinkingDefaults.thinkingModel,
    providerId: resolvedThinkingProvider,
  };

  if (body.thinkingApiKey !== undefined) {
    thinkingModelConfig.apiKey = body.thinkingApiKey;
  }

  const taskModelConfig: ModelConfig = {
    modelId: body.taskModelId || taskDefaults.networkingModel,
    providerId: resolvedTaskProvider,
  };

  if (body.taskApiKey !== undefined) {
    taskModelConfig.apiKey = body.taskApiKey;
  }

  return { thinkingModelConfig, taskModelConfig };
}

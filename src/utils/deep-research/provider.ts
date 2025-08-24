export interface AIProviderOptions {
  provider: string;
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  model: string;
  settings?: any;
}

// Helper function to filter unsupported parameters for each provider
export function filterModelSettings(provider: string, model: string, settings: any) {
  if (!settings) return settings;
  
  const filteredSettings = { ...settings };
  
  switch (provider) {
    case "google":
      // Google models may not support all OpenAI parameters
      // Remove unsupported parameters if needed
      break;
    case "anthropic":
      // Anthropic supports most standard parameters
      break;
    case "deepseek":
      // Some DeepSeek models may have parameter restrictions
      if (model.includes("reasoner")) {
        // Reasoning models might have different parameter support
      }
      break;
    case "xai":
      // xAI Grok models parameter support
      break;
    case "azure":
      // Azure OpenAI uses same parameters as OpenAI
      break;
    case "mistral":
      // Mistral parameter support
      break;
    case "openrouter":
      // OpenRouter proxies to various models, parameters depend on underlying model
      break;
    case "ollama":
      // Local Ollama models may have different parameter support
      break;
    default:
      break;
  }
  
  return filteredSettings;
}

export async function createAIProvider({
  provider,
  apiKey,
  baseURL,
  headers,
  model,
  settings,
}: AIProviderOptions) {
  if (provider === "google") {
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    const google = createGoogleGenerativeAI({
      baseURL,
      apiKey,
    });
    // Google's newer models may support thinking/reasoning modes
    return google(model, filterModelSettings(provider, model, settings));
  } else if (provider === "openai") {
    const { createOpenAI } = await import("@ai-sdk/openai");
    const openai = createOpenAI({
      baseURL,
      apiKey,
    });
    // Use .responses() method for newer OpenAI models that support reasoning/responses
    return (model.startsWith("gpt-4o") || 
            model.startsWith("gpt-5") || 
            model.includes("o3-pro") || 
            model.includes("o3-mini") ||
            model.startsWith("o3"))
      ? openai.responses(model)
      : openai(model, filterModelSettings(provider, model, settings));
  } else if (provider === "anthropic") {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    const anthropic = createAnthropic({
      baseURL,
      apiKey,
      headers,
    });
    // Anthropic Claude models support reasoning but typically don't need .responses()
    return anthropic(model, filterModelSettings(provider, model, settings));
  } else if (provider === "deepseek") {
    const { createDeepSeek } = await import("@ai-sdk/deepseek");
    const deepseek = createDeepSeek({
      baseURL,
      apiKey,
    });
    // DeepSeek reasoning models use standard interface
    return deepseek(model, filterModelSettings(provider, model, settings));
  } else if (provider === "xai") {
    const { createXai } = await import("@ai-sdk/xai");
    const xai = createXai({
      baseURL,
      apiKey,
    });
    return xai(model, filterModelSettings(provider, model, settings));
  } else if (provider === "mistral") {
    const { createMistral } = await import("@ai-sdk/mistral");
    const mistral = createMistral({
      baseURL,
      apiKey,
    });
    return mistral(model, filterModelSettings(provider, model, settings));
  } else if (provider === "azure") {
    const { createAzure } = await import("@ai-sdk/azure");
    const azure = createAzure({
      baseURL,
      apiKey,
    });
    return azure(model, filterModelSettings(provider, model, settings));
  } else if (provider === "openrouter") {
    const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
    const openrouter = createOpenRouter({
      baseURL,
      apiKey,
    });
    return openrouter(model, filterModelSettings(provider, model, settings));
  } else if (provider === "openaicompatible") {
    const { createOpenAICompatible } = await import(
      "@ai-sdk/openai-compatible"
    );
    const openaicompatible = createOpenAICompatible({
      name: "openaicompatible",
      baseURL,
      apiKey,
    });
    return openaicompatible(model, filterModelSettings(provider, model, settings));
  } else if (provider === "pollinations") {
    const { createOpenAICompatible } = await import(
      "@ai-sdk/openai-compatible"
    );
    const pollinations = createOpenAICompatible({
      name: "pollinations",
      baseURL,
      apiKey,
    });
    return pollinations(model, filterModelSettings(provider, model, settings));
  } else if (provider === "ollama") {
    const { createOllama } = await import("ollama-ai-provider");
    const local = global.location || {};
    const ollama = createOllama({
      baseURL,
      headers,
      fetch: async (input, init) => {
        const headers = (init?.headers || {}) as Record<string, string>;
        if (!baseURL?.startsWith(local.origin)) delete headers["Authorization"];
        return await fetch(input, {
          ...init,
          headers,
          credentials: "omit",
        });
      },
    });
    return ollama(model, filterModelSettings(provider, model, settings));
  } else {
    throw new Error("Unsupported Provider: " + provider);
  }
}

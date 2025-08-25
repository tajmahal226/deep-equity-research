import { logOpenAIRequest, logOpenAIError, validateOpenAIParameters } from '@/utils/openai-debug';

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
    case "openai":
      // OpenAI API parameters based on official documentation
      // Only specific reasoning models don't support temperature parameter
      if (model.startsWith("o1") || 
          model.startsWith("o3") || 
          model.includes("o3-") ||
          (model.startsWith("gpt-5") && !model.includes("chat"))) {
        // Reasoning models (o1, o3, certain gpt-5) only support default temperature=1
        // Any explicit temperature parameter will cause "Unsupported parameter" error
        delete filteredSettings.temperature;
      }
      // Regular OpenAI models (GPT-4, GPT-4-turbo, gpt-5-chat-latest) support temperature 0-2
      break;
      
    case "google":
      // Google Gemini models support temperature but different parameter name
      // AI SDK should handle this, but some models may not support it
      break;
      
    case "anthropic":
      // Anthropic Claude supports temperature 0-1
      if (filteredSettings.temperature !== undefined && filteredSettings.temperature > 1) {
        filteredSettings.temperature = 1;
      }
      break;
      
    case "deepseek":
      // DeepSeek models support temperature
      // Reasoning models may have specific requirements
      break;
      
    case "xai":
      // xAI Grok models support temperature
      break;
      
    case "azure":
      // Azure OpenAI uses same parameters as OpenAI
      if (model.startsWith("o1") || 
          model.startsWith("o3") || 
          model.includes("o3-") ||
          (model.startsWith("gpt-5") && !model.includes("chat"))) {
        // Azure reasoning models only support default temperature=1 - remove parameter entirely
        delete filteredSettings.temperature;
      }
      break;
      
    case "mistral":
      // Mistral models support temperature 0-1
      if (filteredSettings.temperature !== undefined && filteredSettings.temperature > 1) {
        filteredSettings.temperature = 1;
      }
      break;
      
    case "openrouter":
      // OpenRouter proxies to various models - use conservative settings
      break;
      
    case "ollama":
      // Local Ollama models generally support temperature
      break;
      
    default:
      // For unknown providers, be conservative with parameters
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
  // Add debugging information for API requests
  const debugInfo = {
    provider,
    model,
    baseURL,
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString(),
  };
  
  console.log('[AI Provider Debug]', debugInfo);
  try {
    if (provider === "google") {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const google = createGoogleGenerativeAI({
        baseURL,
        apiKey,
      });
      const filteredSettings = filterModelSettings(provider, model, settings);
      console.log('[Google Provider]', { model, filteredSettings });
      return google(model, filteredSettings);
    } else if (provider === "openai") {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const openai = createOpenAI({
        baseURL,
        apiKey,
      });
      
      const isResponsesModel = model.startsWith("o1") ||
                               model.startsWith("o3") ||
                               model.includes("o3-") ||
                               (model.startsWith("gpt-5") && !model.includes("chat"));
      
      const filteredSettings = filterModelSettings(provider, model, settings);
      
      // Validate parameters before making the request
      const validation = validateOpenAIParameters(model, filteredSettings);
      if (!validation.valid) {
        console.warn('[OpenAI Parameter Warning]', validation.errors);
      }
      
      logOpenAIRequest({
        model,
        provider,
        parameters: filteredSettings,
        timestamp: new Date().toISOString(),
      });
      
      return isResponsesModel
        ? openai.responses(model)
        : openai(model, filteredSettings);
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
      console.error('[AI Provider Error]', { provider, model, error: 'Unsupported provider' });
      throw new Error(`Unsupported Provider: ${provider}. Supported providers: openai, anthropic, google, deepseek, xai, mistral, azure, openrouter, openaicompatible, pollinations, ollama`);
    }
  } catch (error) {
    // Use OpenAI-specific error logging for OpenAI providers
    if (provider === 'openai' || provider === 'azure') {
      logOpenAIError(error, { provider, model, parameters: settings });
    } else {
      console.error('[AI Provider Creation Failed]', {
        provider,
        model,
        baseURL,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
}

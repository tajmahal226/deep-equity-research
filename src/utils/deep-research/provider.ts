import { logOpenAIRequest, logOpenAIError, validateOpenAIParameters } from '@/utils/openai-debug';
import { hasTemperatureRestrictions } from '@/utils/model';
import { getMaxTokens } from '@/constants/token-limits';
import { logger } from '@/utils/logger';

export interface AIProviderOptions {
  provider: string;
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  model: string;
  settings?: any;
  enableTools?: boolean;
}

// Helper function to check if a model requires tools
export function modelRequiresTools(provider: string, model: string): boolean {
  if (provider === "openai") {
    // Deep research models that require tools according to OpenAI API
    // This includes any model that OpenAI classifies as a "deep research" model
    return model.includes("deep-research") || 
           model.includes("research") ||
           model.startsWith("gpt-4o-research") ||
           model.includes("gpt-5-research") ||
           // Some models may be automatically detected by OpenAI as requiring tools
           // Add common patterns that might trigger this requirement
           model.includes("o1") || // o1 models might require tools
           model.includes("o3"); // o3 models might require tools
  }
  return false;
}

// Helper function to get required tools for a model
export function getRequiredTools(provider: string, model: string) {
  if (provider === "openai" && modelRequiresTools(provider, model)) {
    return {
      web_search_preview: {
        searchContextSize: "medium"
      }
    };
  }
  return undefined;
}

// Helper function to filter unsupported parameters for each provider
export function filterModelSettings(provider: string, model: string, settings: any) {
  if (!settings) return settings;
  
  const filteredSettings = { ...settings };
  const maxTokens = getMaxTokens(provider, model);
  if (maxTokens !== undefined) {
    if (filteredSettings.maxTokens === undefined || filteredSettings.maxTokens > maxTokens) {
      filteredSettings.maxTokens = maxTokens;
    }
  }
  
  switch (provider) {
    case "openai":
      // OpenAI API parameters based on official documentation
      // Use centralized logic to detect temperature restrictions
      logger.log(`[DEBUG] filterModelSettings: model="${model}", hasRestrictions=${hasTemperatureRestrictions(model)}, originalTemp=${settings.temperature}`);
      
      if (model.startsWith("o1") || hasTemperatureRestrictions(model)) {
        // Reasoning models (o1, o3, gpt-5) only support default temperature=1
        // Any explicit temperature parameter will cause "Unsupported parameter" error
        if (filteredSettings.temperature !== undefined) {
          logger.log(`[DEBUG] filterModelSettings: REMOVING temperature for model "${model}"`);
          delete filteredSettings.temperature;
        }
        
        // These models support reasoning_effort parameter
        if (filteredSettings.reasoning_effort) {
          // Keep reasoning_effort for supported models
        }
      } else {
        // Regular OpenAI models don't support reasoning_effort
        delete filteredSettings.reasoning_effort;
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
  
  logger.log('[AI Provider Debug]', debugInfo);
  try {
    if (provider === "google") {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const google = createGoogleGenerativeAI({
        baseURL,
        apiKey,
      });
      const filteredSettings = filterModelSettings(provider, model, settings);
      logger.log('[Google Provider]', { model, filteredSettings });
      return google(model, filteredSettings);
    } else if (provider === "openai") {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const openai = createOpenAI({
        baseURL,
        apiKey,
      });
      
      const isResponsesModel = model.startsWith("o1") || hasTemperatureRestrictions(model);
      
      let filteredSettings = filterModelSettings(provider, model, settings);
      logger.log(`[DEBUG] createAIProvider OpenAI: model="${model}", filteredSettings=`, filteredSettings);
      
      // Add required tools for deep research models
      if (modelRequiresTools(provider, model)) {
        logger.log(`[OpenAI Provider] Model ${model} requires tools - adding web_search_preview`);
        filteredSettings = {
          ...filteredSettings,
          tools: {
            web_search_preview: openai.tools.webSearchPreview({
              searchContextSize: "medium"
            })
          }
        };
      }
      
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
      
      if (isResponsesModel) {
        logger.log(`[DEBUG] createAIProvider: Using openai.responses(${model})`, filteredSettings);
        // OpenAI responses models currently do not accept configuration
        // parameters at creation time. We still need to ensure deep research
        // models receive the required tools. Additionally, these models do not
        // support temperature parameters, so we must remove them before each
        // call.

        const responsesModel = openai.responses(model);

        const baseGenerate = responsesModel.doGenerate.bind(responsesModel);
        const baseStream = responsesModel.doStream.bind(responsesModel);

        const requiredTool = modelRequiresTools(provider, model)
          ? (openai.tools.webSearchPreview({ searchContextSize: "medium" }) as any)
          : undefined;

        function sanitizeOptions(options: any) {
          const cleanOptions = { ...options };
          if ("temperature" in cleanOptions) {
            logger.log(`[DEBUG] createAIProvider: REMOVING temperature for responses model "${model}"`);
            delete cleanOptions.temperature;
          }
          if (requiredTool) {
            const mode = cleanOptions.mode;
            if (mode?.type === "regular") {
              const tools = [...(mode.tools || []), requiredTool] as any;
              cleanOptions.mode = { ...mode, tools };
            }
          }
          return cleanOptions;
        }

        return {
          ...responsesModel,
          async doGenerate(options) {
            const clean = sanitizeOptions(options);
            try {
              return await baseGenerate(clean);
            } catch (error) {
              logOpenAIError(error, { provider, model, parameters: clean });
              throw error;
            }
          },
          async doStream(options) {
            const clean = sanitizeOptions(options);
            try {
              return await baseStream(clean);
            } catch (error) {
              logOpenAIError(error, { provider, model, parameters: clean });
              throw error;
            }
          },
        } as typeof responsesModel;
      } else {
        logger.log(`[DEBUG] createAIProvider: Using openai(${model}, filteredSettings)`);
        const modelInstance = openai(model, filteredSettings);

        const baseGenerate = (modelInstance as any).doGenerate?.bind(modelInstance);
        const baseStream = (modelInstance as any).doStream?.bind(modelInstance);

        if (!baseGenerate && !baseStream) {
          return modelInstance;
        }

        return {
          ...modelInstance,
          ...(baseGenerate && {
            async doGenerate(options: any) {
              try {
                return await baseGenerate(options);
              } catch (error) {
                logOpenAIError(error, { provider, model, parameters: options });
                throw error;
              }
            },
          }),
          ...(baseStream && {
            async doStream(options: any) {
              try {
                return await baseStream(options);
              } catch (error) {
                logOpenAIError(error, { provider, model, parameters: options });
                throw error;
              }
            },
          }),
        } as typeof modelInstance;
      }
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
  } else if (provider === "openrouter") {
    const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
    const openrouter = createOpenRouter({
      baseURL,
      apiKey,
    });
    return openrouter(model, filterModelSettings(provider, model, settings));
  } else if (provider === "ollama") {
    const { createOllama } = await import("ollama-ai-provider");
    const origin =
      typeof location !== "undefined"
        ? location.origin
        : typeof globalThis.location !== "undefined"
          ? globalThis.location.origin
          : undefined;
    const ollama = createOllama({
      baseURL,
      headers,
      fetch: async (input, init) => {
        const headers = (init?.headers || {}) as Record<string, string>;
        if (!origin || !baseURL?.startsWith(origin)) delete headers["Authorization"];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60_000);
        try {
          return await fetch(input, {
            ...init,
            headers,
            credentials: "omit",
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      },
    });
    return ollama(model, filterModelSettings(provider, model, settings));
    } else {
      console.error('[AI Provider Error]', { provider, model, error: 'Unsupported provider' });
      throw new Error(`Unsupported Provider: ${provider}. Supported providers: openai, anthropic, google, deepseek, xai, mistral, openrouter, ollama`);
    }
  } catch (error) {
    // Use OpenAI-specific error logging for OpenAI provider
    if (provider === 'openai') {
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

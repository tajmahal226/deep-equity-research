import { useSettingStore } from "@/store/setting";
import {
  createAIProvider,
  type AIProviderOptions,
} from "@/utils/deep-research/provider";
import {
  GEMINI_BASE_URL,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  DEEPSEEK_BASE_URL,
  XAI_BASE_URL,
  MISTRAL_BASE_URL,
  COHERE_BASE_URL,
  TOGETHER_BASE_URL,
  GROQ_BASE_URL,
  PERPLEXITY_BASE_URL,
  OPENROUTER_BASE_URL,
  OLLAMA_BASE_URL,
} from "@/constants/urls";
import { multiApiKeyPolling } from "@/utils/model";
import { generateSignature } from "@/utils/signature";
import { completePath } from "@/utils/url";

/**
 * Hook to manage AI provider settings and instances.
 *
 * @returns Object containing methods to create providers and access settings.
 */
function useModelProvider() {
  /**
   * Creates an AI provider instance based on current settings.
   *
   * @param model - The model identifier to use.
   * @param settings - Optional additional settings.
   * @returns A configured AI provider instance.
   */
  async function createModelProvider(model: string, settings?: any) {
    const { mode, provider, accessPassword } = useSettingStore.getState();
    const options: AIProviderOptions = {
      baseURL: "",
      provider,
      model,
      settings,
    };

    const settingState = useSettingStore.getState();

    switch (provider) {
      case "google": {
        const { apiKey = "", apiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(apiProxy || GEMINI_BASE_URL, "/v1beta");
          options.apiKey = multiApiKeyPolling(apiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/google/v1beta";
        }
        break;
      }
      case "openai": {
        const { openAIApiKey = "", openAIApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(openAIApiProxy || OPENAI_BASE_URL, "/v1");
          options.apiKey = multiApiKeyPolling(openAIApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/openai/v1";
        }
        break;
      }
      case "anthropic": {
        const { anthropicApiKey = "", anthropicApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(anthropicApiProxy || ANTHROPIC_BASE_URL, "/v1");
          options.headers = {
            "anthropic-dangerous-direct-browser-access": "true",
          };
          options.apiKey = multiApiKeyPolling(anthropicApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/anthropic/v1";
        }
        break;
      }
      case "deepseek": {
        const { deepseekApiKey = "", deepseekApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(deepseekApiProxy || DEEPSEEK_BASE_URL, "/v1");
          options.apiKey = multiApiKeyPolling(deepseekApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/deepseek/v1";
        }
        break;
      }
      case "xai": {
        const { xAIApiKey = "", xAIApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(xAIApiProxy || XAI_BASE_URL, "/v1");
          options.apiKey = multiApiKeyPolling(xAIApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/xai/v1";
        }
        break;
      }
      case "mistral": {
        const { mistralApiKey = "", mistralApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(mistralApiProxy || MISTRAL_BASE_URL, "/v1");
          options.apiKey = multiApiKeyPolling(mistralApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/mistral/v1";
        }
        break;
      }
      case "cohere": {
        const { cohereApiKey = "", cohereApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(cohereApiProxy || COHERE_BASE_URL, "/v1");
          options.apiKey = multiApiKeyPolling(cohereApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/cohere/v1";
        }
        break;
      }
      case "together": {
        const { togetherApiKey = "", togetherApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(togetherApiProxy || TOGETHER_BASE_URL, "/v1");
          options.apiKey = multiApiKeyPolling(togetherApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/together/v1";
        }
        break;
      }
      case "groq": {
        const { groqApiKey = "", groqApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(groqApiProxy || GROQ_BASE_URL, "/openai/v1");
          options.apiKey = multiApiKeyPolling(groqApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/groq/v1";
        }
        break;
      }
      case "perplexity": {
        const { perplexityApiKey = "", perplexityApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(perplexityApiProxy || PERPLEXITY_BASE_URL, "/");
          options.apiKey = multiApiKeyPolling(perplexityApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/perplexity/v1";
        }
        break;
      }
      case "openrouter": {
        const { openRouterApiKey = "", openRouterApiProxy } = settingState;
        if (mode === "local") {
          const base = (openRouterApiProxy || OPENROUTER_BASE_URL).replace(/\/+$/, "");
          const normalizedBase = base.endsWith("/api") ? base : `${base}/api`;
          options.baseURL = completePath(normalizedBase, "/v1");
          options.apiKey = multiApiKeyPolling(openRouterApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/openrouter/v1";
        }
        break;
      }
      case "ollama": {
        const { ollamaApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(ollamaApiProxy || OLLAMA_BASE_URL, "/api");
        } else {
          options.baseURL = location.origin + "/api/ai/ollama/api";
        }
        break;
      }
      default: {
        // Fall back to OpenAI when provider is empty or unknown
        console.warn(`Unknown or empty provider "${provider}", falling back to OpenAI`);
        options.provider = "openai";
        const { openAIApiKey = "", openAIApiProxy } = settingState;
        if (mode === "local") {
          options.baseURL = completePath(openAIApiProxy || OPENAI_BASE_URL, "/v1");
          options.apiKey = multiApiKeyPolling(openAIApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/openai/v1";
        }
        break;
      }
    }

    if (mode === "proxy") {
      options.apiKey = generateSignature(accessPassword, Date.now());
    }
    return await createAIProvider(options);
  }

  /**
   * Default models for each provider, used as fallbacks when user hasn't configured models.
   */
  const DEFAULT_MODELS: Record<string, { thinking: string; networking: string }> = {
    google: { thinking: "gemini-2.0-flash-thinking-exp", networking: "gemini-2.0-flash" },
    openai: { thinking: "gpt-4o", networking: "gpt-4o-mini" },
    anthropic: { thinking: "claude-3-5-sonnet-20241022", networking: "claude-3-5-haiku-20241022" },
    deepseek: { thinking: "deepseek-reasoner", networking: "deepseek-chat" },
    xai: { thinking: "grok-2-1212", networking: "grok-2-1212" },
    mistral: { thinking: "mistral-large-latest", networking: "mistral-medium-latest" },
    cohere: { thinking: "command-r-plus", networking: "command-r" },
    together: { thinking: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", networking: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" },
    groq: { thinking: "llama-3.1-70b-versatile", networking: "llama-3.1-8b-instant" },
    perplexity: { thinking: "llama-3.1-sonar-large-128k-online", networking: "llama-3.1-sonar-small-128k-online" },
    openrouter: { thinking: "anthropic/claude-3.5-sonnet", networking: "anthropic/claude-3.5-sonnet" },
    ollama: { thinking: "llama3.1:8b", networking: "llama3.1:8b" },
  };

  /**
   * Retrieves the current thinking and networking models based on the active provider.
   *
   * @returns An object with thinkingModel and networkingModel.
   */
  function getModel() {
    const state = useSettingStore.getState();
    const { provider } = state;

    // Helper to get model with fallback
    const getWithFallback = (model: string, fallback: string) => model || fallback;
    const defaults = DEFAULT_MODELS[provider] || DEFAULT_MODELS.openai;

    switch (provider) {
      case "google":
        return {
          thinkingModel: getWithFallback(state.thinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.networkingModel, defaults.networking),
        };
      case "openai":
        return {
          thinkingModel: getWithFallback(state.openAIThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.openAINetworkingModel, defaults.networking),
        };
      case "anthropic":
        return {
          thinkingModel: getWithFallback(state.anthropicThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.anthropicNetworkingModel, defaults.networking),
        };
      case "deepseek":
        return {
          thinkingModel: getWithFallback(state.deepseekThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.deepseekNetworkingModel, defaults.networking),
        };
      case "xai":
        return {
          thinkingModel: getWithFallback(state.xAIThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.xAINetworkingModel, defaults.networking),
        };
      case "mistral":
        return {
          thinkingModel: getWithFallback(state.mistralThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.mistralNetworkingModel, defaults.networking),
        };
      case "cohere":
        return {
          thinkingModel: getWithFallback(state.cohereThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.cohereNetworkingModel, defaults.networking),
        };
      case "together":
        return {
          thinkingModel: getWithFallback(state.togetherThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.togetherNetworkingModel, defaults.networking),
        };
      case "groq":
        return {
          thinkingModel: getWithFallback(state.groqThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.groqNetworkingModel, defaults.networking),
        };
      case "perplexity":
        return {
          thinkingModel: getWithFallback(state.perplexityThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.perplexityNetworkingModel, defaults.networking),
        };
      case "openrouter":
        return {
          thinkingModel: getWithFallback(state.openRouterThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.openRouterNetworkingModel, defaults.networking),
        };
      case "ollama":
        return {
          thinkingModel: getWithFallback(state.ollamaThinkingModel, defaults.thinking),
          networkingModel: getWithFallback(state.ollamaNetworkingModel, defaults.networking),
        };
      default:
        // Fallback to OpenAI models if provider is unknown
        console.warn(`Unknown provider "${provider}", falling back to OpenAI models`);
        return {
          thinkingModel: getWithFallback(state.openAIThinkingModel, DEFAULT_MODELS.openai.thinking),
          networkingModel: getWithFallback(state.openAINetworkingModel, DEFAULT_MODELS.openai.networking),
        };
    }
  }

  /**
   * Checks if the API key for the current provider is set.
   *
   * @returns True if the API key is present, false otherwise.
   */
  function hasApiKey(): boolean {
    const settingStore = useSettingStore.getState();
    const { provider } = settingStore;

    switch (provider) {
      case "google":
        return settingStore.apiKey.length > 0;
      case "openai":
        return settingStore.openAIApiKey.length > 0;
      case "anthropic":
        return settingStore.anthropicApiKey.length > 0;
      case "deepseek":
        return settingStore.deepseekApiKey.length > 0;
      case "mistral":
        return settingStore.mistralApiKey.length > 0;
      case "xai":
        return settingStore.xAIApiKey.length > 0;
      case "cohere":
        return settingStore.cohereApiKey.length > 0;
      case "openrouter":
        return settingStore.openRouterApiKey.length > 0;
      case "ollama":
        return true; // Ollama does not require API key
      default:
        // Return false for unknown providers instead of throwing
        console.warn(`Unknown provider: ${provider}`);
        return false;
    }
  }

  return {
    createModelProvider,
    getModel,
    hasApiKey,
  };
}

export default useModelProvider;

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
  OPENROUTER_BASE_URL,
  XAI_BASE_URL,
  MISTRAL_BASE_URL,
  FIREWORKS_BASE_URL,
  MOONSHOT_BASE_URL,
  OLLAMA_BASE_URL,
} from "@/constants/urls";
import { multiApiKeyPolling } from "@/utils/model";
import { generateSignature } from "@/utils/signature";
import { completePath } from "@/utils/url";
import { resolveProviderModels } from "@/utils/provider";
import type { SettingStore } from "@/store/setting";

type ProviderConfig = {
  apiKeyField?: keyof SettingStore;
  apiProxyField?: keyof SettingStore;
  thinkingModelField: keyof SettingStore;
  networkingModelField: keyof SettingStore;
  baseURL: string;
  versionPath: string;
  proxyPath: string;
  requiresApiKey?: boolean;
  localHeaders?: Record<string, string>;
};

const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  google: {
    apiKeyField: "apiKey",
    apiProxyField: "apiProxy",
    thinkingModelField: "thinkingModel",
    networkingModelField: "networkingModel",
    baseURL: GEMINI_BASE_URL,
    versionPath: "/v1beta",
    proxyPath: "/api/ai/google",
  },
  openai: {
    apiKeyField: "openAIApiKey",
    apiProxyField: "openAIApiProxy",
    thinkingModelField: "openAIThinkingModel",
    networkingModelField: "openAINetworkingModel",
    baseURL: OPENAI_BASE_URL,
    versionPath: "/v1",
    proxyPath: "/api/ai/openai",
  },
  anthropic: {
    apiKeyField: "anthropicApiKey",
    apiProxyField: "anthropicApiProxy",
    thinkingModelField: "anthropicThinkingModel",
    networkingModelField: "anthropicNetworkingModel",
    baseURL: ANTHROPIC_BASE_URL,
    versionPath: "/v1",
    proxyPath: "/api/ai/anthropic",
    localHeaders: {
      "anthropic-dangerous-direct-browser-access": "true",
    },
  },
  deepseek: {
    apiKeyField: "deepseekApiKey",
    apiProxyField: "deepseekApiProxy",
    thinkingModelField: "deepseekThinkingModel",
    networkingModelField: "deepseekNetworkingModel",
    baseURL: DEEPSEEK_BASE_URL,
    versionPath: "/v1",
    proxyPath: "/api/ai/deepseek",
  },
  xai: {
    apiKeyField: "xAIApiKey",
    apiProxyField: "xAIApiProxy",
    thinkingModelField: "xAIThinkingModel",
    networkingModelField: "xAINetworkingModel",
    baseURL: XAI_BASE_URL,
    versionPath: "/v1",
    proxyPath: "/api/ai/xai",
  },
  mistral: {
    apiKeyField: "mistralApiKey",
    apiProxyField: "mistralApiProxy",
    thinkingModelField: "mistralThinkingModel",
    networkingModelField: "mistralNetworkingModel",
    baseURL: MISTRAL_BASE_URL,
    versionPath: "/v1",
    proxyPath: "/api/ai/mistral",
  },
  openrouter: {
    apiKeyField: "openRouterApiKey",
    apiProxyField: "openRouterApiProxy",
    thinkingModelField: "openRouterThinkingModel",
    networkingModelField: "openRouterNetworkingModel",
    baseURL: completePath(OPENROUTER_BASE_URL, "/api"),
    versionPath: "/v1",
    proxyPath: "/api/ai/openrouter",
  },
  fireworks: {
    apiKeyField: "fireworksApiKey",
    apiProxyField: "fireworksApiProxy",
    thinkingModelField: "fireworksThinkingModel",
    networkingModelField: "fireworksNetworkingModel",
    baseURL: FIREWORKS_BASE_URL,
    versionPath: "/inference/v1",
    proxyPath: "/api/ai/fireworks",
  },
  moonshot: {
    apiKeyField: "moonshotApiKey",
    apiProxyField: "moonshotApiProxy",
    thinkingModelField: "moonshotThinkingModel",
    networkingModelField: "moonshotNetworkingModel",
    baseURL: MOONSHOT_BASE_URL,
    versionPath: "/v1",
    proxyPath: "/api/ai/moonshot",
  },
  ollama: {
    apiProxyField: "ollamaApiProxy",
    thinkingModelField: "ollamaThinkingModel",
    networkingModelField: "ollamaNetworkingModel",
    baseURL: OLLAMA_BASE_URL,
    versionPath: "/api",
    proxyPath: "/api/ai/ollama",
    requiresApiKey: false,
  },
};

function getProviderConfig(provider: string): ProviderConfig {
  const config = PROVIDER_CONFIG[provider];
  if (!config) {
    throw new Error("Unsupported Provider: " + provider);
  }
  return config;
}

function useModelProvider() {
  async function createModelProvider(model: string, settings?: any) {
    const { mode, provider, accessPassword } = useSettingStore.getState();
    const options: AIProviderOptions = {
      baseURL: "",
      provider,
      model,
      settings,
    };

    const config = getProviderConfig(provider);
    const state = useSettingStore.getState() as Record<string, any>;

    if (mode === "local") {
      const apiProxy = config.apiProxyField ? state[config.apiProxyField] : "";
      const apiKey = config.apiKeyField ? state[config.apiKeyField] : "";
      if (provider === "openrouter") {
        const base = (apiProxy || config.baseURL).replace(/\/+$/, "");
        const normalizedBase = base.endsWith("/api") ? base : `${base}/api`;
        options.baseURL = completePath(normalizedBase, config.versionPath);
      } else {
        options.baseURL = completePath(
          apiProxy || config.baseURL,
          config.versionPath
        );
      }

      if (config.requiresApiKey !== false) {
        options.apiKey = multiApiKeyPolling(apiKey);
      }

      if (config.localHeaders) {
        options.headers = { ...config.localHeaders };
      }
    } else {
      options.baseURL = location.origin + completePath(config.proxyPath, config.versionPath);
    }

    if (mode === "proxy") {
      options.apiKey = generateSignature(accessPassword, Date.now());
    }
    return await createAIProvider(options);
  }

  function getModel() {
    const { provider } = useSettingStore.getState();
    const config = getProviderConfig(provider);
    const state = useSettingStore.getState() as Record<string, any>;
    const models = resolveProviderModels(state, provider);

    return {
      thinkingModel:
        (state[config.thinkingModelField] as string) || models.thinkingModel,
      networkingModel:
        (state[config.networkingModelField] as string) || models.taskModel,
    };
  }

  function hasApiKey(): boolean {
    const { provider } = useSettingStore.getState();
    const config = getProviderConfig(provider);
    if (config.requiresApiKey === false) return true;
    const state = useSettingStore.getState() as Record<string, any>;
    const apiKey = config.apiKeyField ? (state[config.apiKeyField] as string) : "";
    return (apiKey || "").length > 0;
  }

  return {
    createModelProvider,
    getModel,
    hasApiKey,
  };
}

export default useModelProvider;

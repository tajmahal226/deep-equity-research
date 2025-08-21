import { useSettingStore } from "@/store/setting";
import {
  createAIProvider,
  type AIProviderOptions,
} from "@/utils/deep-research/provider";
import {
  GEMINI_BASE_URL,
  OPENROUTER_BASE_URL,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
} from "@/constants/urls";
import { multiApiKeyPolling } from "@/utils/model";
import { generateSignature } from "@/utils/signature";
import { completePath } from "@/utils/url";

function useModelProvider() {
  async function createModelProvider(model: string, settings?: any) {
    const { mode, provider, accessPassword } = useSettingStore.getState();
    const options: AIProviderOptions = {
      baseURL: "",
      provider,
      model,
      settings,
    };

    switch (provider) {
      case "google":
        const { apiKey = "", apiProxy } = useSettingStore.getState();
        if (mode === "local") {
          options.baseURL = completePath(
            apiProxy || GEMINI_BASE_URL,
            "/v1beta"
          );
          options.apiKey = multiApiKeyPolling(apiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/google/v1beta";
        }
        break;
      case "openai":
        const { openAIApiKey = "", openAIApiProxy } =
          useSettingStore.getState();
        if (mode === "local") {
          options.baseURL = completePath(
            openAIApiProxy || OPENAI_BASE_URL,
            "/v1"
          );
          options.apiKey = multiApiKeyPolling(openAIApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/openai/v1";
        }
        break;
      case "anthropic":
        const { anthropicApiKey = "", anthropicApiProxy } =
          useSettingStore.getState();
        if (mode === "local") {
          options.baseURL = completePath(
            anthropicApiProxy || ANTHROPIC_BASE_URL,
            "/v1"
          );
          options.headers = {
            // Avoid cors error
            "anthropic-dangerous-direct-browser-access": "true",
          };
          options.apiKey = multiApiKeyPolling(anthropicApiKey);
        } else {
          options.baseURL = location.origin + "/api/ai/anthropic/v1";
        }
        break;
      default:
        break;
    }

    if (mode === "proxy") {
      options.apiKey = generateSignature(accessPassword, Date.now());
    }
    return await createAIProvider(options);
  }

  function getModel() {
    const { provider } = useSettingStore.getState();

    switch (provider) {
      case "google":
        const { thinkingModel, networkingModel } = useSettingStore.getState();
        return { thinkingModel, networkingModel };
      case "openai":
        const { openAIThinkingModel, openAINetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: openAIThinkingModel,
          networkingModel: openAINetworkingModel,
        };
      case "anthropic":
        const { anthropicThinkingModel, anthropicNetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: anthropicThinkingModel,
          networkingModel: anthropicNetworkingModel,
        };
      case "azure":
        const { azureThinkingModel, azureNetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: azureThinkingModel,
          networkingModel: azureNetworkingModel,
        };
      default:
        throw new Error("Unsupported Provider: " + provider);
    }
  }

  function hasApiKey(): boolean {
    const { provider } = useSettingStore.getState();

    switch (provider) {
      case "google":
        const { apiKey } = useSettingStore.getState();
        return apiKey.length > 0;
      case "openai":
        const { openAIApiKey } = useSettingStore.getState();
        return openAIApiKey.length > 0;
      case "anthropic":
        const { anthropicApiKey } = useSettingStore.getState();
        return anthropicApiKey.length > 0;
        return true;
      default:
        throw new Error("Unsupported Provider: " + provider);
    }
  }

  return {
    createModelProvider,
    getModel,
    hasApiKey,
  };
}

export default useModelProvider;

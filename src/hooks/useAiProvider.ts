import { useSettingStore } from "@/store/setting";
import {
  createAIProvider,
  type AIProviderOptions,
} from "@/utils/deep-research/provider";
import {
  GEMINI_BASE_URL,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
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

  /**
   * Retrieves the current thinking and networking models based on the active provider.
   *
   * @returns An object with thinkingModel and networkingModel.
   */
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
      default:
        throw new Error("Unsupported Provider: " + provider);
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

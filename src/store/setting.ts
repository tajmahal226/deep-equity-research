import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettingStore {
  provider: string;
  mode: string;
  apiKey: string;
  apiProxy: string;
  openRouterApiKey: string;
  openRouterApiProxy: string;
  openRouterThinkingModel: string;
  openRouterNetworkingModel: string;
  openAIApiKey: string;
  openAIApiProxy: string;
  openAIThinkingModel: string;
  openAINetworkingModel: string;
  anthropicApiKey: string;
  anthropicApiProxy: string;
  anthropicThinkingModel: string;
  anthropicNetworkingModel: string;
  deepseekApiKey: string;
  deepseekApiProxy: string;
  deepseekThinkingModel: string;
  deepseekNetworkingModel: string;
  xAIApiKey: string;
  xAIApiProxy: string;
  xAIThinkingModel: string;
  xAINetworkingModel: string;
  mistralApiKey: string;
  mistralApiProxy: string;
  mistralThinkingModel: string;
  mistralNetworkingModel: string;
  cohereApiKey: string;
  cohereApiProxy: string;
  cohereThinkingModel: string;
  cohereNetworkingModel: string;
  togetherApiKey: string;
  togetherApiProxy: string;
  togetherThinkingModel: string;
  togetherNetworkingModel: string;
  groqApiKey: string;
  groqApiProxy: string;
  groqThinkingModel: string;
  groqNetworkingModel: string;
  perplexityApiKey: string;
  perplexityApiProxy: string;
  perplexityThinkingModel: string;
  perplexityNetworkingModel: string;
  azureApiKey: string;
  azureResourceName: string;
  azureApiVersion: string;
  azureThinkingModel: string;
  azureNetworkingModel: string;
  openAICompatibleApiKey: string;
  openAICompatibleApiProxy: string;
  openAICompatibleThinkingModel: string;
  openAICompatibleNetworkingModel: string;
  pollinationsApiProxy: string;
  pollinationsThinkingModel: string;
  pollinationsNetworkingModel: string;
  ollamaApiProxy: string;
  ollamaThinkingModel: string;
  ollamaNetworkingModel: string;
  accessPassword: string;
  thinkingModel: string;
  networkingModel: string;
  enableSearch: string;
  searchProvider: string;
  tavilyApiKey: string;
  tavilyApiProxy: string;
  tavilyScope: string;
  firecrawlApiKey: string;
  firecrawlApiProxy: string;
  exaApiKey: string;
  exaApiProxy: string;
  exaScope: string;
  bochaApiKey: string;
  bochaApiProxy: string;
  searxngApiProxy: string;
  searxngScope: string;
  parallelSearch: number;
  searchMaxResult: number;
  crawler: string;
  financialProvider: string;
  alphaVantageApiKey: string;
  alphaVantageApiProxy: string;
  yahooFinanceApiKey: string;
  yahooFinanceApiProxy: string;
  language: string;
  theme: string;
  debug: "enable" | "disable";
  references: "enable" | "disable";
  citationImage: "enable" | "disable";
  smoothTextStreamType: "character" | "word" | "line";
  onlyUseLocalResource: "enable" | "disable";
}

interface SettingFunction {
  update: (values: Partial<SettingStore>) => void;
  reset: () => void;
}

export const defaultValues: SettingStore = {
  provider: "",
  mode: "",
  apiKey: "",
  apiProxy: "",
  thinkingModel: "",
  networkingModel: "",
  openRouterApiKey: "",
  openRouterApiProxy: "",
  openRouterThinkingModel: "",
  openRouterNetworkingModel: "",
  openAIApiKey: "",
  openAIApiProxy: "",
  openAIThinkingModel: "gpt-4o",
  openAINetworkingModel: "gpt-4o-mini",
  anthropicApiKey: "",
  anthropicApiProxy: "",
  anthropicThinkingModel: "",
  anthropicNetworkingModel: "",
  deepseekApiKey: "",
  deepseekApiProxy: "",
  deepseekThinkingModel: "deepseek-reasoner",
  deepseekNetworkingModel: "deepseek-chat",
  xAIApiKey: "",
  xAIApiProxy: "",
  xAIThinkingModel: "",
  xAINetworkingModel: "",
  mistralApiKey: "",
  mistralApiProxy: "",
  mistralThinkingModel: "mistral-large-latest",
  mistralNetworkingModel: "mistral-medium-latest",
  cohereApiKey: "",
  cohereApiProxy: "",
  cohereThinkingModel: "command-r-plus",
  cohereNetworkingModel: "command-r",
  togetherApiKey: "",
  togetherApiProxy: "",
  togetherThinkingModel: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
  togetherNetworkingModel: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  groqApiKey: "",
  groqApiProxy: "",
  groqThinkingModel: "llama-3.1-70b-versatile",
  groqNetworkingModel: "llama-3.1-8b-instant",
  perplexityApiKey: "",
  perplexityApiProxy: "",
  perplexityThinkingModel: "llama-3.1-sonar-large-128k-online",
  perplexityNetworkingModel: "llama-3.1-sonar-small-128k-online",
  azureApiKey: "",
  azureResourceName: "",
  azureApiVersion: "",
  azureThinkingModel: "",
  azureNetworkingModel: "",
  openAICompatibleApiKey: "",
  openAICompatibleApiProxy: "",
  openAICompatibleThinkingModel: "",
  openAICompatibleNetworkingModel: "",
  pollinationsApiProxy: "",
  pollinationsThinkingModel: "",
  pollinationsNetworkingModel: "",
  ollamaApiProxy: "",
  ollamaThinkingModel: "",
  ollamaNetworkingModel: "",
  accessPassword: "",
  enableSearch: "1",
  searchProvider: "model",
  tavilyApiKey: "",
  tavilyApiProxy: "",
  tavilyScope: "general",
  firecrawlApiKey: "",
  firecrawlApiProxy: "",
  exaApiKey: "",
  exaApiProxy: "",
  exaScope: "research paper",
  bochaApiKey: "",
  bochaApiProxy: "",
  searxngApiProxy: "",
  searxngScope: "all",
  parallelSearch: 1,
  searchMaxResult: 5,
  crawler: "jina",
  financialProvider: "mock",
  alphaVantageApiKey: "",
  alphaVantageApiProxy: "",
  yahooFinanceApiKey: "",
  yahooFinanceApiProxy: "",
  language: "",
  theme: "system",
  debug: "disable",
  references: "enable",
  citationImage: "enable",
  smoothTextStreamType: "word",
  onlyUseLocalResource: "disable",
};

export const useSettingStore = create(
  persist<SettingStore & SettingFunction>(
    (set) => ({
      ...defaultValues,
      update: (values) => set(values),
      reset: () => set(defaultValues),
    }),
    { name: "setting" }
  )
);

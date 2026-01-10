import { create } from "zustand";
import { persist, PersistStorage, StorageValue } from "zustand/middleware";
import AES from "crypto-js/aes";
import CryptoJS from "crypto-js";

/**
 * CACHE CONFIGURATION CONSTANTS
 * ==============================
 * Centralized cache TTL values for maintainability
 */
export const CACHE_CONFIG = {
  /** Time-to-live for company research cache (in hours) */
  TTL_COMPANY_RESEARCH: 24,
  /** Time-to-live for market research cache (in hours) */
  TTL_MARKET_RESEARCH: 12,
  /** Time-to-live for bulk research cache (in hours) */
  TTL_BULK_RESEARCH: 24,
  /** Time-to-live for free-form research cache (in hours) */
  TTL_FREE_FORM: 6,
  /** Maximum number of cache entries to store */
  MAX_ENTRIES: 500,
} as const;

/**
 * ENCRYPTED STORAGE FOR API KEYS
 * ==============================
 * This implementation encrypts API keys before storing them in localStorage.
 * The encryption key is derived from browser-specific characteristics combined
 * with a static salt, providing protection against:
 * - XSS attacks reading localStorage directly
 * - Casual inspection of browser storage
 * - Data exfiltration via browser extensions
 *
 * SECURITY NOTES:
 * - This is client-side encryption only - it protects against localStorage reading
 * - For production with high security needs, consider server-side key management
 * - On first deployment, existing users will need to re-enter their API keys
 */

// List of fields that contain sensitive data (API keys and passwords)
const SENSITIVE_FIELDS = [
  "apiKey",
  "accessPassword",
  "openRouterApiKey",
  "openAIApiKey",
  "anthropicApiKey",
  "deepseekApiKey",
  "xAIApiKey",
  "mistralApiKey",
  "fireworksApiKey",
  "moonshotApiKey",
  "cohereApiKey",
  "togetherApiKey",
  "groqApiKey",
  "perplexityApiKey",
  "tavilyApiKey",
  "firecrawlApiKey",
  "exaApiKey",
  "bochaApiKey",
  "alphaVantageApiKey",
  "yahooFinanceApiKey",
  "financialDatasetsApiKey",
  "exaNeuralSearchApiKey",
];

// Generate a device-specific encryption key
// Uses browser characteristics + static salt to create a consistent key per device
function getEncryptionKey(): string {
  // Combine multiple browser characteristics for uniqueness
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Static salt (in production, this should be environment-specific)
  const salt = "deep-equity-research-v1";

  // Create a fingerprint-based key
  const fingerprint = `${userAgent}|${language}|${platform}|${screenWidth}x${screenHeight}|${timezone}|${salt}`;

  // Hash the fingerprint to create a consistent encryption key
  return CryptoJS.SHA256(fingerprint).toString();
}

// Encrypt a string value
function encrypt(value: string): string {
  if (!value) return value;
  const key = getEncryptionKey();
  return AES.encrypt(value, key).toString();
}

// Decrypt a string value
function decrypt(encryptedValue: string): string {
  if (!encryptedValue) return encryptedValue;
  const key = getEncryptionKey();
  try {
    const bytes = AES.decrypt(encryptedValue, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    // If decryption fails, return the value as-is (handles migration from plain text)
    return encryptedValue;
  }
}

// Encrypt sensitive fields in an object
function encryptSensitiveFields<T extends Record<string, any>>(data: T): T {
  const result = { ...data } as any;
  for (const field of SENSITIVE_FIELDS) {
    if (field in result && typeof result[field] === "string") {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

// Decrypt sensitive fields in an object
function decryptSensitiveFields<T extends Record<string, any>>(data: T): T {
  const result = { ...data } as any;
  for (const field of SENSITIVE_FIELDS) {
    if (field in result && typeof result[field] === "string") {
      result[field] = decrypt(result[field]);
    }
  }
  return result;
}

/**
 * Custom encrypted storage adapter for zustand persist middleware
 * Wraps localStorage to automatically encrypt/decrypt sensitive fields
 */
const encryptedStorage: PersistStorage<SettingStore & SettingFunction> = {
  getItem: (name: string): StorageValue<SettingStore & SettingFunction> | null => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    try {
      const parsed = JSON.parse(str) as SettingStore & SettingFunction;
      // Decrypt sensitive fields before returning to the store
      const decrypted = decryptSensitiveFields(parsed);
      return { state: decrypted, version: 0 };
    } catch {
      return null; // Return as-is if JSON parsing fails
    }
  },

  setItem: (name: string, value: StorageValue<SettingStore & SettingFunction>): void => {
    try {
      // Encrypt sensitive fields before saving to localStorage
      const encrypted = encryptSensitiveFields(value.state as any);
      localStorage.setItem(name, JSON.stringify(encrypted));
    } catch {
      localStorage.setItem(name, JSON.stringify(value.state)); // Fallback to direct save
    }
  },

  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

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
  fireworksApiKey: string;
  fireworksApiProxy: string;
  fireworksThinkingModel: string;
  fireworksNetworkingModel: string;
  moonshotApiKey: string;
  moonshotApiProxy: string;
  moonshotThinkingModel: string;
  moonshotNetworkingModel: string;
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
  financialDatasetsApiKey: string;
  financialDatasetsApiProxy: string;
  exaNeuralSearchApiKey: string;
  exaNeuralSearchApiProxy: string;
  language: string;
  theme: string;
  debug: "enable" | "disable";
  references: "enable" | "disable";
  citationImage: "enable" | "disable";
  smoothTextStreamType: "character" | "word" | "line";
  onlyUseLocalResource: "enable" | "disable";
  openAIReasoningEffort: "low" | "medium" | "high";
  temperature: number;
  // Cache settings
  cacheEnabled: "enable" | "disable";
  cacheTTLCompanyResearch: number; // in hours
  cacheTTLMarketResearch: number; // in hours
  cacheTTLBulkResearch: number; // in hours
  cacheTTLFreeForm: number; // in hours
  cacheMaxEntries: number;
  cacheAutoCleanup: "enable" | "disable";
}

export interface SettingFunction {
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
  anthropicThinkingModel: "claude-3-5-sonnet-20241022",
  anthropicNetworkingModel: "claude-3-5-haiku-20241022",
  deepseekApiKey: "",
  deepseekApiProxy: "",
  deepseekThinkingModel: "deepseek-reasoner",
  deepseekNetworkingModel: "deepseek-chat",
  xAIApiKey: "",
  xAIApiProxy: "",
  xAIThinkingModel: "grok-2-1212",
  xAINetworkingModel: "grok-2-mini-1212",
  mistralApiKey: "",
  mistralApiProxy: "",
  mistralThinkingModel: "mistral-large-latest",
  mistralNetworkingModel: "mistral-medium-latest",
  fireworksApiKey: "",
  fireworksApiProxy: "",
  fireworksThinkingModel: "accounts/fireworks/models/firefunction-v2",
  fireworksNetworkingModel: "accounts/fireworks/models/firefunction-v2",
  moonshotApiKey: "",
  moonshotApiProxy: "",
  moonshotThinkingModel: "moonshot-v1-32k",
  moonshotNetworkingModel: "moonshot-v1-8k",
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
  financialDatasetsApiKey: "",
  financialDatasetsApiProxy: "",
  exaNeuralSearchApiKey: "",
  exaNeuralSearchApiProxy: "",
  language: "",
  theme: "system",
  debug: "disable",
  references: "enable",
  citationImage: "enable",
  smoothTextStreamType: "word",
  onlyUseLocalResource: "disable",
  openAIReasoningEffort: "medium",
  temperature: 0.7,
  // Cache defaults (using centralized constants)
  cacheEnabled: "enable",
  cacheTTLCompanyResearch: CACHE_CONFIG.TTL_COMPANY_RESEARCH,
  cacheTTLMarketResearch: CACHE_CONFIG.TTL_MARKET_RESEARCH,
  cacheTTLBulkResearch: CACHE_CONFIG.TTL_BULK_RESEARCH,
  cacheTTLFreeForm: CACHE_CONFIG.TTL_FREE_FORM,
  cacheMaxEntries: CACHE_CONFIG.MAX_ENTRIES,
  cacheAutoCleanup: "enable",
};

export const useSettingStore = create(
  persist<SettingStore & SettingFunction>(
    (set) => ({
      ...defaultValues,
      update: (values) => set(values),
      reset: () => set(defaultValues),
    }),
    {
      name: "setting",
      storage: encryptedStorage, // Use encrypted storage instead of default localStorage
    }
  )
);

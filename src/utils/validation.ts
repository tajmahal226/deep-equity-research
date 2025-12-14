/**
 * Validation utilities for API keys, model names, and other critical inputs
 */

import { 
  MODEL_RELEASE_DATES, 
  getActiveModels,
  isModelStale 
} from './model-metadata';

// Base model catalog (includes all models, even legacy ones)
const ALL_MODELS: Record<string, Set<string>> = {
  openai: new Set(Object.keys(MODEL_RELEASE_DATES.openai)),
  anthropic: new Set(Object.keys(MODEL_RELEASE_DATES.anthropic)),
  google: new Set(Object.keys(MODEL_RELEASE_DATES.google)),
  xai: new Set(Object.keys(MODEL_RELEASE_DATES.xai)),
  deepseek: new Set(Object.keys(MODEL_RELEASE_DATES.deepseek)),
  mistral: new Set(Object.keys(MODEL_RELEASE_DATES.mistral)),
  groq: new Set(Object.keys(MODEL_RELEASE_DATES.groq)),
  together: new Set(Object.keys(MODEL_RELEASE_DATES.together)),
  cohere: new Set(Object.keys(MODEL_RELEASE_DATES.cohere)),
  perplexity: new Set(Object.keys(MODEL_RELEASE_DATES.perplexity)),
};

// Get stale model exclusion setting from environment
const EXCLUDE_STALE_MODELS = process.env.NEXT_PUBLIC_EXCLUDE_STALE_MODELS !== 'false';
const MAX_MODEL_AGE_MONTHS = parseInt(process.env.NEXT_PUBLIC_MAX_MODEL_AGE_MONTHS || '12', 10);

/**
 * Get valid models for a provider, optionally filtering stale models
 * @param provider - Provider name
 * @param excludeStale - Whether to exclude stale models (defaults to env setting)
 * @returns Set of valid model names
 */
export function getValidModels(
  provider: string, 
  excludeStale: boolean = EXCLUDE_STALE_MODELS
): Set<string> {
  const allModels = ALL_MODELS[provider];
  if (!allModels) {
    return new Set();
  }
  
  if (!excludeStale) {
    return new Set(allModels);
  }
  
  return getActiveModels(provider, MAX_MODEL_AGE_MONTHS);
}

/**
 * Public export for UI components
 * By default, this returns filtered models (excluding stale ones)
 */
export const VALID_MODELS: Record<string, Set<string>> = {
  openai: getValidModels('openai'),
  anthropic: getValidModels('anthropic'),
  google: getValidModels('google'),
  xai: getValidModels('xai'),
  deepseek: getValidModels('deepseek'),
  mistral: getValidModels('mistral'),
  groq: getValidModels('groq'),
  together: getValidModels('together'),
  cohere: getValidModels('cohere'),
  perplexity: getValidModels('perplexity'),
};

// API key format patterns
const API_KEY_PATTERNS: Record<string, RegExp> = {
  openai: /^sk-[A-Za-z0-9\-_]{20,}$/,
  anthropic: /^sk-ant-[A-Za-z0-9\-_]{20,}$/,
  google: /^AIza[A-Za-z0-9\-_]{35}$/,
  deepseek: /^sk-[A-Za-z0-9]{32,}$/,
  xai: /^xai-[A-Za-z0-9]{40,}$/,
  mistral: /^[A-Za-z0-9]{20,}$/,
  groq: /^gsk_[A-Za-z0-9]{40,}$/,
  cohere: /^[A-Za-z0-9]{30,}$/,
  together: /^[A-Za-z0-9\-]{40,}$/,
  perplexity: /^pplx-[A-Za-z0-9]{40,}$/,
  openrouter: /^sk-or-[A-Za-z0-9\-]{40,}$/,
  tavily: /^tvly-[A-Za-z0-9]{20,}$/,
  firecrawl: /^fc-[A-Za-z0-9]{20,}$/,
  exa: /^[A-Za-z0-9\-]{36}$/,
};

/**
 * Validate if a model name is valid for a given provider
 * 
 * This function accepts both active and legacy models for API compatibility,
 * but may log warnings for stale models.
 * 
 * @param provider - Provider name
 * @param model - Model name to validate
 * @param strict - If true, reject stale models entirely
 */
export function isValidModel(
  provider: string, 
  model: string,
  strict: boolean = false
): boolean {
  // Check against all models (including legacy)
  const allModels = ALL_MODELS[provider];
  if (!allModels) {
    // Unknown provider, allow any model
    console.warn(`Unknown provider: ${provider}, allowing model: ${model}`);
    return true;
  }
  
  // Check if model exists at all
  const modelExists = allModels.has(model);
  
  if (!modelExists) {
    console.warn(`Invalid model "${model}" for provider "${provider}"`);
    
    // Suggest similar models from active set
    const validModels = getValidModels(provider);
    const suggestions = findSimilarModels(model, validModels);
    if (suggestions.length > 0) {
      console.info(`Did you mean: ${suggestions.join(', ')}?`);
    }
    
    return false;
  }
  
  // Check if model is stale
  const stale = isModelStale(provider, model, MAX_MODEL_AGE_MONTHS);
  
  if (stale) {
    if (strict) {
      console.warn(
        `Stale model "${model}" rejected (>${MAX_MODEL_AGE_MONTHS} months old). ` +
        `Use NEXT_PUBLIC_EXCLUDE_STALE_MODELS=false to allow.`
      );
      return false;
    } else {
      console.info(
        `Warning: Model "${model}" is stale (>${MAX_MODEL_AGE_MONTHS} months old). ` +
        `Consider using a newer model.`
      );
    }
  }
  
  return true;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) {
    return bn;
  }
  if (bn === 0) {
    return an;
  }
  const matrix = new Array<number[]>(bn + 1);
  for (let i = 0; i <= bn; ++i) {
    const row = (matrix[i] = new Array<number>(an + 1));
    row[0] = i;
  }
  const firstRow = matrix[0];
  for (let j = 1; j <= an; ++j) {
    firstRow[j] = j;
  }
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          Math.min(
            matrix[i - 1][j - 1], // substitution
            matrix[i][j - 1], // insertion
            matrix[i - 1][j] // deletion
          ) + 1;
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Find similar model names (for suggestions) using Levenshtein distance
 */
function findSimilarModels(model: string, validModels: Set<string>): string[] {
  const modelsArray = Array.from(validModels);
  
  const distances = modelsArray.map(validModel => ({
    model: validModel,
    distance: levenshtein(model.toLowerCase(), validModel.toLowerCase()),
  }));

  distances.sort((a, b) => a.distance - b.distance);
  
  return distances.slice(0, 3).map(d => d.model);
}

/**
 * Validate API key format
 */
export function isValidApiKey(provider: string, apiKey: string): {
  valid: boolean;
  error?: string;
} {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: "API key is required" };
  }
  
  const pattern = API_KEY_PATTERNS[provider];
  if (!pattern) {
    // Unknown provider, do basic length check
    if (apiKey.length < 20) {
      return { valid: false, error: "API key seems too short" };
    }
    return { valid: true };
  }
  
  if (!pattern.test(apiKey)) {
    return {
      valid: false,
      error: `Invalid ${provider} API key format. Expected format: ${getKeyFormat(provider)}`,
    };
  }
  
  return { valid: true };
}

/**
 * Get expected API key format for a provider
 */
function getKeyFormat(provider: string): string {
  const formats: Record<string, string> = {
    openai: "sk-... (48+ characters)",
    anthropic: "sk-ant-... (40+ characters)",
    google: "AIza... (39 characters)",
    deepseek: "sk-... (32+ characters)",
    xai: "xai-... (44+ characters)",
    mistral: "20+ alphanumeric characters",
    groq: "gsk_... (44+ characters)",
    cohere: "30+ alphanumeric characters",
    together: "40+ characters with dashes",
    perplexity: "pplx-... (44+ characters)",
    openrouter: "sk-or-... (45+ characters)",
    tavily: "tvly-... (24+ characters)",
    firecrawl: "fc-... (22+ characters)",
    exa: "UUID format (36 characters)",
  };
  
  return formats[provider] || "20+ characters";
}

/**
 * Sanitize API key for logging (show only first/last few characters)
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return "***";
  }
  
  const prefix = apiKey.slice(0, 6);
  const suffix = apiKey.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Validate company name
 */
export function isValidCompanyName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Company name is required" };
  }
  
  if (name.length < 2) {
    return { valid: false, error: "Company name is too short" };
  }
  
  if (name.length > 200) {
    return { valid: false, error: "Company name is too long" };
  }
  
  // Check for suspicious patterns
  if (/[<>{}]/.test(name)) {
    return { valid: false, error: "Company name contains invalid characters" };
  }
  
  return { valid: true };
}

/**
 * Validate search query
 */
export function isValidSearchQuery(query: string): {
  valid: boolean;
  error?: string;
} {
  if (!query || query.trim().length === 0) {
    return { valid: false, error: "Search query is required" };
  }
  
  if (query.length < 3) {
    return { valid: false, error: "Search query is too short (min 3 characters)" };
  }
  
  if (query.length > 1000) {
    return { valid: false, error: "Search query is too long (max 1000 characters)" };
  }
  
  return { valid: true };
}

/**
 * Rate limit checker
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }
  
  reset(key: string) {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Check if we're rate limited for a specific operation
 */
export function checkRateLimit(
  operation: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  return rateLimiter.isAllowed(operation, maxRequests, windowMs);
}

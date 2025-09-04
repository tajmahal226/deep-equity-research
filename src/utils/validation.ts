/**
 * Validation utilities for API keys, model names, and other critical inputs
 */

// Known valid models for each provider
export const VALID_MODELS: Record<string, Set<string>> = {
  openai: new Set([
    // GPT-5 Series (Bleeding Edge)
    'gpt-5', 'gpt-5-turbo', 'gpt-5-32k',
    // O3 Series (Advanced Reasoning)
    'o3', 'o3-mini',
    // O1 Series
    'o1', 'o1-preview', 'o1-mini',
    // GPT-4 Series
    'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-4-32k',
    'gpt-4-turbo-2024-04-09', 'gpt-4-0125-preview', 'gpt-4-1106-preview',
    // GPT-3.5 Series
    'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-1106',
  ]),
  
  anthropic: new Set([
    // Claude 4.x Series (Bleeding Edge)
    'claude-opus-4-1-20250805', 'claude-sonnet-4-0-20250805',
    // Claude 3.5 Series
    'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307',
    // Legacy
    'claude-instant-1.2', 'claude-2.1', 'claude-2.0',
  ]),
  
  google: new Set([
    // Gemini 2.5 Series (Bleeding Edge)
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-thinking',
    // Gemini 2.0 Series
    'gemini-2.0-flash-exp', 'gemini-2.0-flash-thinking-exp', 
    'gemini-2.0-flash-thinking-exp-1219',
    // Gemini 1.5 Series
    'gemini-1.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-pro-002',
    'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-8b',
    // Legacy
    'gemini-pro', 'gemini-pro-vision',
  ]),
  
  xai: new Set([
    // Grok-3 Series (Bleeding Edge)
    'grok-3', 'grok-3-mini',
    // Grok-2 Series
    'grok-2-1212', 'grok-2-mini-1212',
    // Grok Beta
    'grok-beta', 'grok-2-beta',
  ]),
  
  deepseek: new Set([
    'deepseek-reasoner', 'deepseek-chat', 'deepseek-coder',
    'deepseek-v2', 'deepseek-v2.5',
  ]),
  
  mistral: new Set([
    'mistral-large-2411', 'mistral-large-latest', 'mistral-large',
    'mistral-medium-latest', 'mistral-medium',
    'mistral-small-latest', 'mistral-small',
    'codestral-latest', 'codestral-2405',
    'mistral-7b', 'mixtral-8x7b', 'mixtral-8x22b',
  ]),
  
  groq: new Set([
    'llama-3.3-70b-versatile', 'llama-3.2-90b-text-preview',
    'llama-3.1-70b-versatile', 'llama-3.1-8b-instant',
    'mixtral-8x7b-32768', 'gemma2-9b-it', 'gemma-7b-it',
  ]),
  
  together: new Set([
    'Qwen/QwQ-32B-Preview',
    'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
    'meta-llama/Llama-3.2-3B-Instruct-Turbo',
    'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'Qwen/Qwen2.5-72B-Instruct-Turbo',
  ]),
  
  cohere: new Set([
    'command-r-plus-08-2024', 'command-r-plus',
    'command-r-08-2024', 'command-r',
    'command', 'command-light',
  ]),
  
  perplexity: new Set([
    'llama-3.1-sonar-huge-128k-online',
    'llama-3.1-sonar-large-128k-online',
    'llama-3.1-sonar-small-128k-online',
    'llama-3.1-sonar-large-128k-chat',
    'llama-3.1-sonar-small-128k-chat',
  ]),
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
 */
export function isValidModel(provider: string, model: string): boolean {
  const validModels = VALID_MODELS[provider];
  if (!validModels) {
    // Unknown provider, allow any model
    console.warn(`Unknown provider: ${provider}, allowing model: ${model}`);
    return true;
  }
  
  // Check if model is in the valid set
  const isValid = validModels.has(model);
  
  if (!isValid) {
    console.warn(`Invalid model "${model}" for provider "${provider}"`);
    
    // Suggest similar models
    const suggestions = findSimilarModels(model, validModels);
    if (suggestions.length > 0) {
      console.info(`Did you mean: ${suggestions.join(', ')}?`);
    }
  }
  
  return isValid;
}

/**
 * Find similar model names (for suggestions)
 */
function findSimilarModels(model: string, validModels: Set<string>): string[] {
  const modelLower = model.toLowerCase();
  const suggestions: string[] = [];
  
  for (const validModel of validModels) {
    const validLower = validModel.toLowerCase();
    
    // Check if the valid model contains the input or vice versa
    if (validLower.includes(modelLower) || modelLower.includes(validLower)) {
      suggestions.push(validModel);
    }
    
    // Check for similar prefixes
    else if (validLower.startsWith(modelLower.slice(0, 3))) {
      suggestions.push(validModel);
    }
  }
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
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
/**
 * Model metadata including release dates for filtering stale models
 * 
 * This allows excluding models older than a specified age from UI dropdowns
 * while still accepting them for API compatibility.
 */

/**
 * Model release dates by provider
 * Format: YYYY-MM (year-month)
 */
export const MODEL_RELEASE_DATES: Record<string, Record<string, string>> = {
  openai: {
    // GPT-5 Series (2025)
    'gpt-5': '2025-01',
    'gpt-5-turbo': '2025-01',
    'gpt-5-32k': '2025-01',
    // O3 Series (2025)
    'o3': '2025-01',
    'o3-mini': '2025-01',
    // O1 Series (2024)
    'o1': '2024-12',
    'o1-preview': '2024-09',
    'o1-mini': '2024-09',
    // GPT-4 Series (2024)
    'gpt-4o': '2024-05',
    'gpt-4o-mini': '2024-07',
    'gpt-4-turbo': '2024-04',
    'gpt-4-turbo-2024-04-09': '2024-04',
    'gpt-4-0125-preview': '2024-01',
    'gpt-4-1106-preview': '2023-11',
    'gpt-4': '2023-03',
    'gpt-4-32k': '2023-03',
    // GPT-3.5 Series (2022-2023) - STALE
    'gpt-3.5-turbo': '2022-11',
    'gpt-3.5-turbo-16k': '2023-06',
    'gpt-3.5-turbo-1106': '2023-11',
  },
  
  anthropic: {
    // Claude 4.x Series (2025)
    'claude-opus-4-1-20250805': '2025-08',
    'claude-sonnet-4-0-20250805': '2025-08',
    // Claude 3.5 Series (2024)
    'claude-3-5-sonnet-20241022': '2024-10',
    'claude-3-5-haiku-20241022': '2024-10',
    // Claude 3 Series (2024)
    'claude-3-opus-20240229': '2024-02',
    'claude-3-sonnet-20240229': '2024-02',
    'claude-3-haiku-20240307': '2024-03',
    // Legacy (2023) - STALE
    'claude-instant-1.2': '2023-03',
    'claude-2.1': '2023-11',
    'claude-2.0': '2023-07',
  },
  
  google: {
    // Gemini 2.5 Series (2025)
    'gemini-2.5-pro': '2025-02',
    'gemini-2.5-flash': '2025-02',
    'gemini-2.5-flash-thinking': '2025-02',
    // Gemini 2.0 Series (2024)
    'gemini-2.0-flash-exp': '2024-12',
    'gemini-2.0-flash-thinking-exp': '2024-12',
    'gemini-2.0-flash-thinking-exp-1219': '2024-12',
    // Gemini 1.5 Series (2024)
    'gemini-1.5-pro': '2024-02',
    'gemini-1.5-pro-latest': '2024-02',
    'gemini-1.5-pro-002': '2024-09',
    'gemini-1.5-flash': '2024-05',
    'gemini-1.5-flash-latest': '2024-05',
    'gemini-1.5-flash-8b': '2024-10',
    // Legacy (2023) - STALE
    'gemini-pro': '2023-12',
    'gemini-pro-vision': '2023-12',
  },
  
  xai: {
    // Grok-3 Series (2025)
    'grok-3': '2025-01',
    'grok-3-mini': '2025-01',
    // Grok-2 Series (2024)
    'grok-2-1212': '2024-12',
    'grok-2-mini-1212': '2024-12',
    'grok-beta': '2024-08',
    'grok-2-beta': '2024-08',
  },
  
  deepseek: {
    'deepseek-reasoner': '2025-01',
    'deepseek-chat': '2024-05',
    'deepseek-coder': '2024-03',
    'deepseek-v2': '2024-05',
    'deepseek-v2.5': '2024-09',
  },
  
  mistral: {
    'mistral-large-2411': '2024-11',
    'mistral-large-latest': '2024-11',
    'mistral-large': '2024-02',
    'mistral-medium-latest': '2024-12',
    'mistral-medium': '2023-12',
    'mistral-small-latest': '2024-09',
    'mistral-small': '2024-02',
    'codestral-latest': '2024-05',
    'codestral-2405': '2024-05',
    'mistral-7b': '2023-09',
    'mixtral-8x7b': '2023-12',
    'mixtral-8x22b': '2024-04',
  },
  
  groq: {
    'llama-3.3-70b-versatile': '2024-12',
    'llama-3.2-90b-text-preview': '2024-09',
    'llama-3.1-70b-versatile': '2024-07',
    'llama-3.1-8b-instant': '2024-07',
    'mixtral-8x7b-32768': '2023-12',
    'gemma2-9b-it': '2024-06',
    'gemma-7b-it': '2024-02',
  },
  
  together: {
    'Qwen/QwQ-32B-Preview': '2024-11',
    'meta-llama/Llama-3.3-70B-Instruct-Turbo': '2024-12',
    'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo': '2024-09',
    'meta-llama/Llama-3.2-3B-Instruct-Turbo': '2024-09',
    'meta-llama/Llama-3.1-70B-Instruct-Turbo': '2024-07',
    'mistralai/Mixtral-8x7B-Instruct-v0.1': '2023-12',
    'Qwen/Qwen2.5-72B-Instruct-Turbo': '2024-09',
  },
  
  cohere: {
    'command-r-plus-08-2024': '2024-08',
    'command-r-plus': '2024-03',
    'command-r-08-2024': '2024-08',
    'command-r': '2024-03',
    'command': '2023-08',
    'command-light': '2023-08',
  },
  
  perplexity: {
    'llama-3.1-sonar-huge-128k-online': '2024-07',
    'llama-3.1-sonar-large-128k-online': '2024-07',
    'llama-3.1-sonar-small-128k-online': '2024-07',
    'llama-3.1-sonar-large-128k-chat': '2024-07',
    'llama-3.1-sonar-small-128k-chat': '2024-07',
  },
};

/**
 * Filter models by age
 * 
 * @param provider - Provider name (openai, anthropic, etc.)
 * @param maxAgeMonths - Maximum age in months (default: 12)
 * @returns Set of model names that are not stale
 */
export function getActiveModels(
  provider: string,
  maxAgeMonths: number = 12
): Set<string> {
  const dates = MODEL_RELEASE_DATES[provider];
  if (!dates) {
    // Unknown provider, return empty set
    return new Set();
  }
  
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths);
  
  const activeModels = new Set<string>();
  
  for (const [model, releaseDate] of Object.entries(dates)) {
    // Parse release date (YYYY-MM format, add -01 for day)
    const release = new Date(releaseDate + '-01');
    
    if (release >= cutoffDate) {
      activeModels.add(model);
    }
  }
  
  return activeModels;
}

/**
 * Get stale models (models older than maxAgeMonths)
 *
 * @param provider - Provider name.
 * @param maxAgeMonths - Age threshold in months.
 * @returns Set of stale model names.
 */
export function getStaleModels(
  provider: string,
  maxAgeMonths: number = 12
): Set<string> {
  const dates = MODEL_RELEASE_DATES[provider];
  if (!dates) {
    return new Set();
  }
  
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths);
  
  const staleModels = new Set<string>();
  
  for (const [model, releaseDate] of Object.entries(dates)) {
    const release = new Date(releaseDate + '-01');
    
    if (release < cutoffDate) {
      staleModels.add(model);
    }
  }
  
  return staleModels;
}

/**
 * Check if a model is stale
 *
 * @param provider - Provider name.
 * @param model - Model name.
 * @param maxAgeMonths - Age threshold in months.
 * @returns True if stale, false otherwise.
 */
export function isModelStale(
  provider: string,
  model: string,
  maxAgeMonths: number = 12
): boolean {
  const dates = MODEL_RELEASE_DATES[provider];
  if (!dates || !dates[model]) {
    // Unknown model, assume not stale
    return false;
  }
  
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths);
  
  const release = new Date(dates[model] + '-01');
  return release < cutoffDate;
}

/**
 * Get model age in months
 *
 * @param provider - Provider name.
 * @param model - Model name.
 * @returns Age in months or null if unknown.
 */
export function getModelAgeMonths(provider: string, model: string): number | null {
  const dates = MODEL_RELEASE_DATES[provider];
  if (!dates || !dates[model]) {
    return null;
  }
  
  const release = new Date(dates[model] + '-01');
  const now = new Date();
  
  const months = (now.getFullYear() - release.getFullYear()) * 12 + 
                 (now.getMonth() - release.getMonth());
  
  return months;
}

/**
 * Get model release date
 *
 * @param provider - Provider name.
 * @param model - Model name.
 * @returns Release date string (YYYY-MM) or null.
 */
export function getModelReleaseDate(provider: string, model: string): string | null {
  const dates = MODEL_RELEASE_DATES[provider];
  return dates?.[model] || null;
}

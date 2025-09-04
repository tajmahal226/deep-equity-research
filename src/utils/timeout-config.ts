/**
 * Timeout Configuration for AI Models
 * 
 * Bleeding-edge models like GPT-5, Claude 4.x, and Gemini 2.5 require longer timeouts
 * These models are more powerful but also slower than production models
 */

export interface TimeoutConfig {
  thinking: number;  // Timeout for thinking/reasoning models
  task: number;      // Timeout for task execution models
  search: number;    // Timeout for web searches
  total: number;     // Total timeout for entire operation
}

// Model-specific timeout configurations (in milliseconds)
export const MODEL_TIMEOUTS: Record<string, TimeoutConfig> = {
  // OpenAI GPT-5 series - These are very powerful but slower
  'gpt-5': {
    thinking: 120000,  // 2 minutes
    task: 90000,       // 1.5 minutes  
    search: 30000,     // 30 seconds
    total: 300000      // 5 minutes total
  },
  'gpt-5-turbo': {
    thinking: 90000,   // 1.5 minutes
    task: 60000,       // 1 minute
    search: 30000,     // 30 seconds
    total: 240000      // 4 minutes total
  },
  'o3': {
    thinking: 180000,  // 3 minutes (O3 is very thorough)
    task: 120000,      // 2 minutes
    search: 30000,     // 30 seconds
    total: 360000      // 6 minutes total
  },
  'o3-mini': {
    thinking: 120000,  // 2 minutes
    task: 90000,       // 1.5 minutes
    search: 30000,     // 30 seconds
    total: 300000      // 5 minutes total
  },
  'o1': {
    thinking: 150000,  // 2.5 minutes
    task: 90000,       // 1.5 minutes
    search: 30000,     // 30 seconds
    total: 300000      // 5 minutes total
  },
  'o1-preview': {
    thinking: 120000,  // 2 minutes
    task: 90000,       // 1.5 minutes
    search: 30000,     // 30 seconds
    total: 300000      // 5 minutes total
  },
  
  // Anthropic Claude 4.x series
  'claude-opus-4-1-20250805': {
    thinking: 120000,  // 2 minutes
    task: 90000,       // 1.5 minutes
    search: 30000,     // 30 seconds
    total: 300000      // 5 minutes total
  },
  'claude-sonnet-4-0-20250805': {
    thinking: 90000,   // 1.5 minutes
    task: 60000,       // 1 minute
    search: 30000,     // 30 seconds
    total: 240000      // 4 minutes total
  },
  
  // Google Gemini 2.5 series
  'gemini-2.5-flash-thinking': {
    thinking: 90000,   // 1.5 minutes
    task: 60000,       // 1 minute
    search: 30000,     // 30 seconds
    total: 240000      // 4 minutes total
  },
  'gemini-2.5-pro': {
    thinking: 120000,  // 2 minutes
    task: 90000,       // 1.5 minutes
    search: 30000,     // 30 seconds
    total: 300000      // 5 minutes total
  },
  
  // xAI Grok-3 series
  'grok-3': {
    thinking: 90000,   // 1.5 minutes
    task: 60000,       // 1 minute
    search: 30000,     // 30 seconds
    total: 240000      // 4 minutes total
  },
  
  // DeepSeek models
  'deepseek-reasoner': {
    thinking: 150000,  // 2.5 minutes (reasoner is thorough)
    task: 90000,       // 1.5 minutes
    search: 30000,     // 30 seconds
    total: 300000      // 5 minutes total
  },
  'deepseek-chat': {
    thinking: 60000,   // 1 minute
    task: 45000,       // 45 seconds
    search: 30000,     // 30 seconds
    total: 180000      // 3 minutes total
  },
  
  // Default configuration for unknown models
  'default': {
    thinking: 90000,   // 1.5 minutes
    task: 60000,       // 1 minute
    search: 30000,     // 30 seconds
    total: 240000      // 4 minutes total
  }
};

// Provider-level timeout multipliers (some providers are slower)
export const PROVIDER_MULTIPLIERS: Record<string, number> = {
  'openai': 1.0,      // Normal speed
  'anthropic': 1.2,   // 20% slower (more thorough)
  'google': 1.1,      // 10% slower
  'xai': 1.0,         // Normal speed
  'deepseek': 1.3,    // 30% slower (reasoner is very thorough)
  'mistral': 1.0,     // Normal speed
  'groq': 0.5,        // 50% faster (optimized inference)
  'cohere': 1.0,      // Normal speed
  'together': 1.1,    // 10% slower
  'perplexity': 1.2,  // 20% slower (includes web search)
  'default': 1.0
};

// Get timeout configuration for a specific model and provider
export function getTimeoutConfig(modelId: string, providerId: string = 'default'): TimeoutConfig {
  // Get base timeout for model
  const baseConfig = MODEL_TIMEOUTS[modelId] || MODEL_TIMEOUTS['default'];
  
  // Apply provider multiplier
  const multiplier = PROVIDER_MULTIPLIERS[providerId] || PROVIDER_MULTIPLIERS['default'];
  
  return {
    thinking: Math.round(baseConfig.thinking * multiplier),
    task: Math.round(baseConfig.task * multiplier),
    search: Math.round(baseConfig.search * multiplier),
    total: Math.round(baseConfig.total * multiplier)
  };
}

// Timeout settings for different operation types
export const OPERATION_TIMEOUTS = {
  // SSE/Streaming operations
  SSE_KEEPALIVE: 30000,        // 30 seconds between keepalive pings
  SSE_TOTAL: 600000,           // 10 minutes total for SSE connections
  
  // Bulk operations
  BULK_COMPANY_PER_ITEM: 180000,  // 3 minutes per company
  BULK_COMPANY_TOTAL: 1800000,    // 30 minutes total for bulk
  
  // Company Deep Dive by depth
  COMPANY_FAST: 180000,        // 3 minutes for fast mode
  COMPANY_MEDIUM: 300000,      // 5 minutes for medium mode
  COMPANY_DEEP: 600000,        // 10 minutes for deep mode
  
  // General operations
  WEB_SEARCH: 30000,           // 30 seconds for web searches
  AI_GENERATION: 120000,       // 2 minutes for AI generation
  FILE_PROCESSING: 60000,      // 1 minute for file processing
  
  // Client-side fetch timeouts
  CLIENT_FETCH: 300000,        // 5 minutes for client requests
  CLIENT_FETCH_BULK: 600000,   // 10 minutes for bulk requests
};

// Helper to create AbortSignal with timeout
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

// Helper to wrap a promise with timeout
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffMultiplier: 2,    // Exponential backoff
  
  // Retry on these error types
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ESOCKETTIMEDOUT',
    'timeout',
    'AbortError'
  ],
  
  // Don't retry on these status codes
  nonRetryableStatuses: [
    400, // Bad Request
    401, // Unauthorized
    403, // Forbidden
    404, // Not Found
    405, // Method Not Allowed
  ]
};

// Helper to retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<typeof RETRY_CONFIG> = {}
): Promise<T> {
  const config = { ...RETRY_CONFIG, ...options };
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      const isRetryable = config.retryableErrors.some(
        retryableError => lastError?.message?.includes(retryableError)
      );
      
      if (!isRetryable || attempt === config.maxRetries - 1) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
      
      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
/**
 * OpenAI API Debugging Utilities
 * Based on: https://platform.openai.com/docs/api-reference/debugging-requests
 */

export interface OpenAIDebugInfo {
  model: string;
  provider: string;
  requestId?: string;
  timestamp: string;
  parameters?: Record<string, any>;
  error?: any;
}

/**
 * Log OpenAI API request details for debugging
 */
export function logOpenAIRequest(info: OpenAIDebugInfo) {
  const debugData = {
    ...info,
    timestamp: new Date().toISOString(),
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[OpenAI Debug]', debugData);
  }
  
  // In production, you might want to send this to your logging service
  if (process.env.NODE_ENV === 'production' && info.error) {
    console.error('[OpenAI Error]', {
      model: info.model,
      error: info.error,
      requestId: info.requestId,
      timestamp: info.timestamp,
    });
  }
}

/**
 * Enhanced error logging for OpenAI API issues
 */
export function logOpenAIError(error: any, context: Partial<OpenAIDebugInfo>) {
  const errorInfo: OpenAIDebugInfo = {
    model: context.model || 'unknown',
    provider: context.provider || 'openai',
    error: {
      message: error?.message || 'Unknown error',
      type: error?.type || 'unknown',
      code: error?.code || 'unknown',
      status: error?.status || error?.statusCode,
      // Extract OpenAI request ID if available
      requestId: error?.headers?.['openai-request-id'] || 
                 error?.response?.headers?.['openai-request-id'] ||
                 context.requestId,
    },
    timestamp: new Date().toISOString(),
    parameters: context.parameters,
  };
  
  console.error('[OpenAI API Error]', errorInfo);
  
  // Provide helpful debugging tips based on error type
  if (error?.message?.includes('temperature')) {
    console.error('[Debug Tip]', 'Temperature parameter issue detected. Check model compatibility and parameter ranges.');
  }
  
  if (error?.message?.includes('Unsupported parameter')) {
    console.error('[Debug Tip]', 'Parameter compatibility issue. Some models may not support all parameters.');
  }
  
  if (error?.status === 429) {
    console.error('[Debug Tip]', 'Rate limit exceeded. Consider implementing exponential backoff.');
  }
  
  if (error?.status === 401) {
    console.error('[Debug Tip]', 'Authentication failed. Check API key validity and permissions.');
  }
  
  return errorInfo;
}

/**
 * Validate OpenAI model parameters based on API documentation
 */
export function validateOpenAIParameters(model: string, parameters: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Handle case where parameters might be undefined
  if (!parameters) {
    return { valid: true, errors: [] };
  }
  
  // Check temperature parameter for different model types
  if (parameters.temperature !== undefined) {
    // Only specific reasoning models don't support temperature parameter
    if (model.startsWith('o1') || 
        model.startsWith('o3') || 
        model.includes('o3-') ||
        (model.startsWith('gpt-5') && !model.includes('chat'))) {
      errors.push(`Model ${model} only supports default temperature=1 (do not set temperature parameter)`);
    } else {
      // Regular models support temperature 0-2
      if (parameters.temperature < 0 || parameters.temperature > 2) {
        errors.push(`Temperature must be between 0 and 2, got ${parameters.temperature}`);
      }
    }
  }
  
  // Check max_tokens parameter
  if (parameters.maxTokens !== undefined || parameters.max_tokens !== undefined) {
    const maxTokens = parameters.maxTokens || parameters.max_tokens;
    if (maxTokens < 1) {
      errors.push(`max_tokens must be positive, got ${maxTokens}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
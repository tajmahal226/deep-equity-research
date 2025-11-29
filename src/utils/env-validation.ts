/**
 * Environment variable validation and configuration utilities
 */

interface EnvironmentConfig {
  required: string[];
  optional: string[];
  publicRequired: string[];
  publicOptional: string[];
}

const ENV_CONFIG: EnvironmentConfig = {
  // Server-side required environment variables
  required: [],
  
  // Server-side optional environment variables with validation
  optional: [
    // API Keys
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'DEEPSEEK_API_KEY',
    'XAI_API_KEY',
    'MISTRAL_API_KEY',
    'COHERE_API_KEY',
    'TOGETHER_API_KEY',
    'GROQ_API_KEY',
    'PERPLEXITY_API_KEY',
    'AZURE_API_KEY',
    'OPENROUTER_API_KEY',
    'OPENAI_COMPATIBLE_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    
    // Search Provider Keys
    'TAVILY_API_KEY',
    'FIRECRAWL_API_KEY',
    'EXA_API_KEY',
    'BOCHA_API_KEY',
    
    // Financial Data Keys
    'ALPHA_VANTAGE_API_KEY',
    'YAHOO_FINANCE_API_KEY',
    'FINANCIAL_DATASETS_API_KEY',
    
    // API Base URLs
    'OPENAI_API_BASE_URL',
    'ANTHROPIC_API_BASE_URL',
    'AZURE_RESOURCE_NAME',
    'AZURE_API_VERSION',
    
    // MCP Configuration
    'MCP_AI_PROVIDER',
    'MCP_SEARCH_PROVIDER',
    'MCP_TASK_MODEL',
    'MCP_THINKING_MODEL',
    
    // Access Control
    'ACCESS_PASSWORD',
  ],
  
  // Client-side required environment variables
  publicRequired: [],
  
  // Client-side optional environment variables
  publicOptional: [
    'NEXT_PUBLIC_BUILD_MODE',
    'NEXT_PUBLIC_VERSION',
    'NEXT_PUBLIC_DISABLED_AI_PROVIDER',
    'NEXT_PUBLIC_DISABLED_SEARCH_PROVIDER',
    'NEXT_PUBLIC_MODEL_LIST',
  ],
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Record<string, string | undefined>;
}

/**
 * Validate environment configuration
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Record<string, string | undefined> = {};

  // Check required server-side variables
  ENV_CONFIG.required.forEach(key => {
    const value = process.env[key];
    config[key] = value;
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // Check required public variables
  ENV_CONFIG.publicRequired.forEach(key => {
    const value = process.env[key];
    config[key] = value;
    if (!value) {
      errors.push(`Missing required public environment variable: ${key}`);
    }
  });

  // Check optional variables and provide warnings for common misconfigurations
  ENV_CONFIG.optional.forEach(key => {
    const value = process.env[key];
    config[key] = value;
  });

  ENV_CONFIG.publicOptional.forEach(key => {
    const value = process.env[key];
    config[key] = value;
  });

  // Specific validations
  validateSpecificConfig(config, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

/**
 * Validate specific configuration patterns
 */
function validateSpecificConfig(
  config: Record<string, string | undefined>,
  warnings: string[]
): void {
  // MCP configuration validation
  const mcpProvider = config.MCP_AI_PROVIDER;
  const mcpTaskModel = config.MCP_TASK_MODEL;
  
  if (mcpProvider && !mcpTaskModel) {
    warnings.push('MCP_AI_PROVIDER is set but MCP_TASK_MODEL is missing');
  }
  
  // Access password validation
  const accessPassword = config.ACCESS_PASSWORD;
  const publicAccessPassword = config.NEXT_PUBLIC_ACCESS_PASSWORD;

  if (publicAccessPassword) {
    warnings.push(
      'NEXT_PUBLIC_ACCESS_PASSWORD is set; remove this client-exposed secret and keep ACCESS_PASSWORD server-side only. Users should enter the password in the app settings when required.',
    );
  }
  if (accessPassword && accessPassword.length < 8) {
    warnings.push('ACCESS_PASSWORD should be at least 8 characters to protect private routes.');
  }
  
  // AI Provider validation - warn if no AI providers are configured
  const aiProviderKeys = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'DEEPSEEK_API_KEY',
    'XAI_API_KEY',
    'MISTRAL_API_KEY',
    'COHERE_API_KEY',
    'TOGETHER_API_KEY',
    'GROQ_API_KEY',
    'PERPLEXITY_API_KEY',
    'AZURE_API_KEY',
    'OPENROUTER_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
  ];
  
  const hasAnyAiProvider = aiProviderKeys.some(key => config[key]);
  if (!hasAnyAiProvider) {
    warnings.push('No AI provider API keys configured. The application may not function properly.');
  }
  
  // Search provider validation
  const searchProviderKeys = [
    'TAVILY_API_KEY',
    'FIRECRAWL_API_KEY',
    'EXA_API_KEY',
    'BOCHA_API_KEY',
  ];
  
  const hasAnySearchProvider = searchProviderKeys.some(key => config[key]);
  if (!hasAnySearchProvider) {
    warnings.push('No search provider API keys configured. Search functionality may be limited.');
  }
}

/**
 * Get environment variable with validation
 */
export function getEnvVar(
  key: string,
  defaultValue?: string,
  required = false
): string {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || defaultValue || '';
}

/**
 * Get all provider configurations
 */
export function getProviderConfigs() {
  return {
    ai: {
      openai: {
        apiKey: getEnvVar('OPENAI_API_KEY'),
        baseUrl: getEnvVar('OPENAI_API_BASE_URL', 'https://api.openai.com'),
      },
      anthropic: {
        apiKey: getEnvVar('ANTHROPIC_API_KEY'),
        baseUrl: getEnvVar('ANTHROPIC_API_BASE_URL', 'https://api.anthropic.com'),
      },
      // Add other providers as needed
    },
    search: {
      tavily: {
        apiKey: getEnvVar('TAVILY_API_KEY'),
        baseUrl: getEnvVar('TAVILY_API_BASE_URL', 'https://api.tavily.com'),
      },
      exa: {
        apiKey: getEnvVar('EXA_API_KEY'),
        baseUrl: getEnvVar('EXA_API_BASE_URL', 'https://api.exa.ai'),
      },
      // Add other search providers as needed
    },
  };
}

/**
 * Validate environment in development mode
 */
export function validateDevelopmentEnvironment(): void {
  if (process.env.NODE_ENV === 'development') {
    const result = validateEnvironment();
    
    if (result.warnings.length > 0) {
      console.warn('🟡 Environment Configuration Warnings:');
      result.warnings.forEach(warning => {
        console.warn(`  - ${warning}`);
      });
      console.warn('');
    }
    
    if (result.errors.length > 0) {
      console.error('🔴 Environment Configuration Errors:');
      result.errors.forEach(error => {
        console.error(`  - ${error}`);
      });
      console.error('');
    }
    
    if (result.isValid && result.warnings.length === 0) {
      console.log('✅ Environment configuration is valid');
    }
  }
}
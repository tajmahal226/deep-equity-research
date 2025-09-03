#!/usr/bin/env node

/**
 * API Key Coverage Test
 * Checks AI model providers, search providers (including Exa),
 * and financial data providers for configured API keys.
 */

console.log('🧪 Running API key coverage test...\n');

// AI model providers and their environment variable names
const aiProviders = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  xai: 'XAI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  cohere: 'COHERE_API_KEY',
  together: 'TOGETHER_API_KEY',
  groq: 'GROQ_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
  ollama: null // No key required
};

console.log('1️⃣ AI model provider keys:');
for (const [provider, envVar] of Object.entries(aiProviders)) {
  if (!envVar) {
    console.log(`   ${provider.padEnd(15)}: ⚙️  No key required`);
    continue;
  }
  const value = process.env[envVar];
  const status = value ? '✅' : '❌';
  const preview = value ? `${value.substring(0, 8)}...` : 'none';
  console.log(`   ${provider.padEnd(15)}: ${status} ${preview}`);
}

// Search providers (includes Exa)
const searchProviders = {
  tavily: 'TAVILY_API_KEY',
  firecrawl: 'FIRECRAWL_API_KEY',
  exa: 'EXA_API_KEY',
  bocha: 'BOCHA_API_KEY',
  searxng: null,
  model: null
};

console.log('\n2️⃣ Search provider keys:');
for (const [provider, envVar] of Object.entries(searchProviders)) {
  if (!envVar) {
    console.log(`   ${provider.padEnd(15)}: ⚙️  No key required`);
    continue;
  }
  const value = process.env[envVar];
  const status = value ? '✅' : '❌';
  const preview = value ? `${value.substring(0, 8)}...` : 'none';
  console.log(`   ${provider.padEnd(15)}: ${status} ${preview}`);
}

// Financial data providers
const financialProviders = {
  alpha_vantage: 'ALPHA_VANTAGE_API_KEY',
  yahoo_finance: 'YAHOO_FINANCE_API_KEY',
  financial_datasets: 'FINANCIAL_DATASETS_API_KEY'
};

console.log('\n3️⃣ Financial data keys:');
for (const [provider, envVar] of Object.entries(financialProviders)) {
  const value = process.env[envVar];
  const status = value ? '✅' : '❌';
  const preview = value ? `${value.substring(0, 8)}...` : 'none';
  console.log(`   ${provider.padEnd(15)}: ${status} ${preview}`);
}

// Gather missing keys across all providers
const missingEnvVars = [
  ...Object.values(aiProviders),
  ...Object.values(searchProviders),
  ...Object.values(financialProviders)
].filter(Boolean).filter(envVar => !process.env[envVar]);

if (missingEnvVars.length) {
  console.log('\n💡 To add missing API keys, update your .env.local with:');
  missingEnvVars.forEach(envVar => {
    console.log(`   ${envVar}=your-key-here`);
  });
} else {
  console.log('\n🎉 All API keys are set!');
}

console.log('\n✅ API key coverage test complete!');

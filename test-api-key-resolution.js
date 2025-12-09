#!/usr/bin/env node

/**
 * Comprehensive API Key Resolution Test
 * Tests all scenarios to ensure the system works correctly
 */

const { getAIProviderApiKey, getAIProviderApiKeyWithFallback } = require('./src/app/api/utils.ts');

console.log('🧪 Testing API Key Resolution System...\n');

// Test 1: Test all providers
const providers = [
  'openai', 'anthropic', 'google', 'deepseek', 'xai', 'mistral',
  'openrouter', 'cohere', 'together', 'groq', 'perplexity', 'ollama'
];

console.log('1️⃣ Testing all AI providers:');
providers.forEach(provider => {
  try {
    const apiKey = getAIProviderApiKey(provider);
    const hasKey = !!apiKey;
    const keyPreview = apiKey ? `${apiKey.substring(0, 8)}...` : 'none';
    console.log(`   ${provider.padEnd(15)}: ${hasKey ? '✅' : '❌'} ${keyPreview}`);
  } catch (error) {
    console.log(`   ${provider.padEnd(15)}: ❌ Error: ${error.message}`);
  }
});

console.log('\n2️⃣ Testing fallback resolution:');
providers.forEach(provider => {
  try {
    const apiKey = getAIProviderApiKeyWithFallback(provider);
    const hasKey = !!apiKey;
    console.log(`   ${provider.padEnd(15)}: ${hasKey ? '✅ Key available' : '⚠️  No key (graceful)'}`);
  } catch (error) {
    console.log(`   ${provider.padEnd(15)}: ❌ Error: ${error.message}`);
  }
});

// Test 2: Environment variable detection
console.log('\n3️⃣ Environment variables check:');
const envVars = [
  'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY',
  'DEEPSEEK_API_KEY', 'XAI_API_KEY', 'MISTRAL_API_KEY',
  'OPENROUTER_API_KEY', 'COHERE_API_KEY', 'TOGETHER_API_KEY', 'GROQ_API_KEY',
  'PERPLEXITY_API_KEY'
];

envVars.forEach(envVar => {
  const value = process.env[envVar];
  const status = value ? '✅ Set' : '❌ Missing';
  const preview = value ? `${value.substring(0, 8)}...` : 'undefined';
  console.log(`   ${envVar.padEnd(25)}: ${status} ${preview}`);
});

console.log('\n✅ API Key Resolution Test Complete!');
console.log('\n💡 To add missing API keys, create/update .env.local with:');
envVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.log(`   ${envVar}=your-key-here`);
  }
});
import { describe, it, expect } from 'vitest';
import { createAIProvider } from '../../src/utils/deep-research/provider';

// Map of providers with sample basic and thinking models
const providerModels: Record<string, { basic: string; thinking: string }> = {
  openai: { basic: 'gpt-4o-mini', thinking: 'o1-mini' },
  google: { basic: 'gemini-1.5-flash', thinking: 'gemini-1.5-pro' },
  anthropic: { basic: 'claude-3-haiku-20240307', thinking: 'claude-3-5-sonnet-20241022' },
  deepseek: { basic: 'deepseek-chat', thinking: 'deepseek-reasoner' },
  xai: { basic: 'grok-2-mini', thinking: 'grok-2' },
  mistral: { basic: 'mistral-small', thinking: 'mistral-large-latest' },
  azure: { basic: 'gpt-4o-mini', thinking: 'o1-mini' },
  openrouter: { basic: 'openrouter/anthropic/claude-3-haiku', thinking: 'openrouter/openai/gpt-4o' },
  openaicompatible: { basic: 'gpt-3.5-turbo', thinking: 'gpt-4' },
  pollinations: { basic: 'gpt-3.5-turbo', thinking: 'gpt-4o' },
  ollama: { basic: 'llama3.2', thinking: 'qwen2.5:7b' },
};

describe('AI provider initialization', () => {
  for (const [provider, models] of Object.entries(providerModels)) {
    it(`initializes ${provider} basic model`, async () => {
      const model = await createAIProvider({
        provider,
        apiKey: 'test-key',
        baseURL: 'https://example.com',
        model: models.basic,
        settings: { temperature: 0.7 },
      });
      expect(model).toBeTruthy();
    });

    it(`initializes ${provider} thinking model`, async () => {
      const model = await createAIProvider({
        provider,
        apiKey: 'test-key',
        baseURL: 'https://example.com',
        model: models.thinking,
        settings: { temperature: 0.7, reasoning_effort: 'medium' },
      });
      expect(model).toBeTruthy();
    });
  }
});

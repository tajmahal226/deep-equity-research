import { describe, expect, it } from 'vitest';
import { getMaxTokens, DEFAULT_MODEL_TOKEN_LIMIT } from '@/constants/token-limits';

describe('getMaxTokens', () => {
  it('returns model specific limit when known', () => {
    expect(getMaxTokens('openai', 'gpt-4o')).toBe(128000);
  });

  it('returns large context for Gemini models', () => {
    expect(getMaxTokens('google', 'gemini-1.5-pro-latest')).toBe(2000000);
    expect(getMaxTokens('Gemini', 'Gemini-1.5-Flash-001')).toBe(1000000);
  });

  it('supports Mistral and Cohere limits', () => {
    expect(getMaxTokens('mistral', 'mistral-large-latest')).toBe(32000);
    expect(getMaxTokens('cohere', 'command-r-plus')).toBe(128000);
    expect(getMaxTokens('cohere', 'command-light-nightly')).toBe(16000);
  });

  it('returns GPT-5.2 limits instead of falling back', () => {
    expect(getMaxTokens('openai', 'gpt-5.2-pro')).toBe(512000);
    expect(getMaxTokens('openai', 'gpt-5.2-pro-reasoning')).toBe(512000);
    expect(getMaxTokens('openai', 'gpt-5.2-turbo')).toBe(256000);
  });

  it('covers Groq, Perplexity, and OpenRouter prefixes', () => {
    expect(getMaxTokens('groq', 'mixtral-8x22b-32768')).toBe(65536);
    expect(getMaxTokens('perplexity', 'llama-3.1-sonar-large-128k-online')).toBe(128000);
    expect(getMaxTokens('openrouter', 'openrouter/perplexity/llama-3.1-sonar-small-128k-chat')).toBe(128000);
    expect(getMaxTokens('openrouter', 'openrouter/google/gemini-1.5-flash-002')).toBe(1000000);
  });

  it('falls back to default limit for unknown model', () => {
    expect(getMaxTokens('openai', 'unknown-model')).toBe(DEFAULT_MODEL_TOKEN_LIMIT);
  });

  it('falls back to default limit for unknown provider', () => {
    expect(getMaxTokens('unknown', 'gpt-4o')).toBe(DEFAULT_MODEL_TOKEN_LIMIT);
  });

  it('recognizes xAI Grok models', () => {
    expect(getMaxTokens('xai', 'grok-2-1212')).toBe(128000);
    expect(getMaxTokens('xai', 'grok-2-mini-1212')).toBe(128000);
  });
});

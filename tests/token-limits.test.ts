import { describe, expect, it } from 'vitest';
import { getMaxTokens, DEFAULT_MODEL_TOKEN_LIMIT } from '@/constants/token-limits';

describe('getMaxTokens', () => {
  it('returns model specific limit when known', () => {
    expect(getMaxTokens('openai', 'gpt-4o')).toBe(128000);
  });

  it('falls back to provider default for unknown model', () => {
    expect(getMaxTokens('openai', 'unknown-model')).toBe(128000);
  });

  it('falls back to global default limit for unknown provider', () => {
    expect(getMaxTokens('unknown', 'gpt-4o')).toBe(DEFAULT_MODEL_TOKEN_LIMIT);
  });

  it('uses provider default when model is unknown but provider is known', () => {
    expect(getMaxTokens('google', 'unknown-model')).toBe(1_000_000);
  });

  it('returns model specific limit for other providers', () => {
    expect(getMaxTokens('groq', 'llama3-8b-8192')).toBe(8192);
  });
});

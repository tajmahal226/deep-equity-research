import { describe, expect, it } from 'vitest';
import { getMaxTokens, DEFAULT_MODEL_TOKEN_LIMIT } from '@/constants/token-limits';

describe('getMaxTokens', () => {
  it('returns model specific limit when known', () => {
    expect(getMaxTokens('openai', 'gpt-4o')).toBe(128000);
  });

  it('falls back to default limit for unknown model', () => {
    expect(getMaxTokens('openai', 'unknown-model')).toBe(DEFAULT_MODEL_TOKEN_LIMIT);
  });

  it('falls back to default limit for unknown provider', () => {
    expect(getMaxTokens('unknown', 'gpt-4o')).toBe(DEFAULT_MODEL_TOKEN_LIMIT);
  });
});

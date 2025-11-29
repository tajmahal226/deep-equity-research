import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateEnvironment } from '../../src/utils/env-validation';

describe('validateEnvironment', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('emits a warning when NEXT_PUBLIC_ACCESS_PASSWORD is set', () => {
    process.env.NEXT_PUBLIC_ACCESS_PASSWORD = 'public-secret';
    process.env.OPENAI_API_KEY = 'test-openai';
    process.env.TAVILY_API_KEY = 'test-tavily';

    const result = validateEnvironment();

    expect(result.config.NEXT_PUBLIC_ACCESS_PASSWORD).toBe('public-secret');
    expect(result.warnings).toContain(
      'NEXT_PUBLIC_ACCESS_PASSWORD is set; remove this client-exposed secret and keep ACCESS_PASSWORD server-side only. Users should enter the password in the app settings when required.'
    );
  });
});

import { describe, it, expect, vi } from 'vitest';

// Mock debugging utilities
vi.mock('@/utils/openai-debug', () => ({
  logOpenAIRequest: vi.fn(),
  logOpenAIError: vi.fn(),
  validateOpenAIParameters: vi.fn(() => ({ valid: true, errors: [] })),
}));

// Mock OpenAI SDK to throw errors on generate and stream
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: () => () => ({
    doGenerate: vi.fn().mockRejectedValue(new Error('generate-fail')),
    doStream: vi.fn().mockRejectedValue(new Error('stream-fail')),
  }),
}));

import { createAIProvider } from '@/utils/deep-research/provider';
import { logOpenAIError } from '@/utils/openai-debug';

describe('OpenAI error logging', () => {
  it('logs errors for doGenerate and doStream', async () => {
    const provider = await createAIProvider({
      provider: 'openai',
      baseURL: 'https://api.openai.com',
      apiKey: 'test-key',
      model: 'gpt-4o',
    });

    await expect(provider.doGenerate({ prompt: 'hi' })).rejects.toThrow('generate-fail');
    await expect(provider.doStream({ prompt: 'hi' })).rejects.toThrow('stream-fail');

    expect(logOpenAIError).toHaveBeenCalledTimes(2);
  });
});

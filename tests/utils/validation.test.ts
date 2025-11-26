// tests/utils/validation.test.ts
import { describe, it, expect, vi } from 'vitest';
import { isValidModel } from '../../src/utils/validation';

// Mock getValidModels to control the set of models for testing
vi.mock('../../src/utils/model-metadata', () => ({
  getActiveModels: (provider: string) => {
    if (provider === 'openai') {
      return new Set([
        'gpt-4-turbo',
        'gpt-4-vision-preview',
        'gpt-3.5-turbo',
        'gpt-4',
      ]);
    }
    return new Set();
  },
  isModelStale: () => false,
  MODEL_RELEASE_DATES: {
    openai: {
      'gpt-4-turbo': '2023-11-06',
      'gpt-4-vision-preview': '2023-11-06',
      'gpt-3.5-turbo': '2022-11-30',
      'gpt-4': '2021-06-01',
    },
    anthropic: {},
    google: {},
    xai: {},
    deepseek: {},
    mistral: {},
    groq: {},
    together: {},
    cohere: {},
    perplexity: {},
  },
}));

describe('isValidModel with similar model suggestions', () => {
  it('should suggest similar models for a typo', () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const result = isValidModel('openai', 'gpt-4-tubo'); // Typo in "turbo"

    expect(result).toBe(false); // The model is invalid

    // Check that the suggestions are present, regardless of order
    const call = consoleInfoSpy.mock.calls[0][0];
    expect(call).toContain('Did you mean:');

    // Split the suggestions string into an array
    const suggestions = call.replace('?', '').split(': ')[1].split(', ');

    expect(suggestions).toEqual(
      expect.arrayContaining(['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'])
    );

    consoleInfoSpy.mockRestore();
  });
});

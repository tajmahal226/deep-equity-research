import { describe, it, expect } from 'vitest';
import DeepResearch from '@/utils/deep-research';
import { ANTHROPIC_BASE_URL } from '@/constants/urls';

// This test ensures the Anthropic Claude provider can be
// initialized for market research workflows which use the
// generic DeepResearch engine under the hood.
describe('Market Research Module - Anthropic Provider', () => {
  it('initializes thinking and task models', async () => {
    const dr = new DeepResearch({
      AIProvider: {
        provider: 'anthropic',
        baseURL: ANTHROPIC_BASE_URL,
        apiKey: 'test-key',
        thinkingModel: 'claude-3-opus',
        taskModel: 'claude-3-sonnet',
        temperature: 0.7,
      },
      searchProvider: {
        provider: 'model',
        baseURL: '',
      },
    });

    const thinking = await dr.getThinkingModel();
    expect(thinking).toBeDefined();
    const task = await dr.getTaskModel();
    expect(task).toBeDefined();
  });
});

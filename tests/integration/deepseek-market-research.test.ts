import { describe, it, expect } from 'vitest';
import DeepResearch from '@/utils/deep-research';
import { DEEPSEEK_BASE_URL } from '@/constants/urls';

// This test ensures the DeepSeek provider can be initialized
// for market research workflows using the generic DeepResearch engine.

describe('Market Research Module - DeepSeek Provider', () => {
  it('initializes thinking and task models', async () => {
    const dr = new DeepResearch({
      AIProvider: {
        provider: 'deepseek',
        baseURL: DEEPSEEK_BASE_URL,
        apiKey: 'test-key',
        thinkingModel: 'deepseek-reasoner',
        taskModel: 'deepseek-chat',
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


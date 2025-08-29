import { describe, it, expect } from 'vitest';
import DeepResearch from '@/utils/deep-research';
import { OPENAI_BASE_URL } from '@/constants/urls';

describe('OpenAI model choices', () => {
  const models = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-5',
    'gpt-5-chat-latest',
    'o3-mini',
    'o3-pro',
  ];

  models.forEach((model) => {
    it(`initializes ${model} as thinking model`, async () => {
      const dr = new DeepResearch({
        AIProvider: {
          provider: 'openai',
          baseURL: OPENAI_BASE_URL,
          apiKey: 'test-key',
          thinkingModel: model,
          taskModel: 'gpt-4o',
          temperature: 0.7,
        },
        searchProvider: {
          provider: 'tavily',
          baseURL: 'https://api.tavily.com',
        },
      });

      const thinking = await dr.getThinkingModel();
      expect(thinking).toBeDefined();
    });

    it(`initializes ${model} as task model`, async () => {
      const dr = new DeepResearch({
        AIProvider: {
          provider: 'openai',
          baseURL: OPENAI_BASE_URL,
          apiKey: 'test-key',
          thinkingModel: 'gpt-4o',
          taskModel: model,
          temperature: 0.7,
        },
        searchProvider: {
          provider: 'tavily',
          baseURL: 'https://api.tavily.com',
        },
      });

      const task = await dr.getTaskModel();
      expect(task).toBeDefined();
    });
  });
});


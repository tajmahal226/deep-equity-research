import { describe, it, expect, vi } from 'vitest';
import DeepResearch from '@/utils/deep-research';
import { createSearchProvider } from '@/utils/deep-research/search';
import { POST as financialDataPost } from '@/app/api/financial-data/route';
import {
  OPENAI_BASE_URL,
  GEMINI_BASE_URL,
  ANTHROPIC_BASE_URL,
  DEEPSEEK_BASE_URL,
  XAI_BASE_URL,
  MISTRAL_BASE_URL,
  OPENROUTER_BASE_URL,
  OLLAMA_BASE_URL,
} from '@/constants/urls';

describe('Free-Form Deep Research Module', () => {
  const providers = [
    { provider: 'openai', baseURL: OPENAI_BASE_URL, thinkingModel: 'gpt-5', taskModel: 'gpt-4o-mini' },
    { provider: 'google', baseURL: GEMINI_BASE_URL, thinkingModel: 'gemini-2.0-flash-thinking-exp', taskModel: 'gemini-2.0-flash' },
    { provider: 'anthropic', baseURL: ANTHROPIC_BASE_URL, thinkingModel: 'claude-3-opus', taskModel: 'claude-3-sonnet' },
    { provider: 'deepseek', baseURL: DEEPSEEK_BASE_URL, thinkingModel: 'deepseek-reasoner', taskModel: 'deepseek-chat' },
    { provider: 'xai', baseURL: XAI_BASE_URL, thinkingModel: 'grok-beta', taskModel: 'grok-1' },
    { provider: 'mistral', baseURL: MISTRAL_BASE_URL, thinkingModel: 'mistral-large', taskModel: 'mistral-small' },
    { provider: 'openrouter', baseURL: OPENROUTER_BASE_URL, thinkingModel: 'openrouter/reasoning-model', taskModel: 'openrouter/basic-model' },
    { provider: 'ollama', baseURL: OLLAMA_BASE_URL, thinkingModel: 'llama3.1:70b', taskModel: 'llama3.1:8b' },
  ];

  providers.forEach(({ provider, baseURL, thinkingModel, taskModel: taskModelName }) => {
    it(`initializes thinking and task models for ${provider}`, async () => {
      const dr = new DeepResearch({
        AIProvider: {
          provider,
          baseURL,
          apiKey: 'test-key',
          thinkingModel,
          taskModel: taskModelName,
          temperature: 0.7,
        },
        searchProvider: {
          provider: 'tavily',
          baseURL: 'https://api.tavily.com',
        },
      });

      const thinking = await dr.getThinkingModel();
      expect(thinking).toBeDefined();
      const task = await dr.getTaskModel();
      expect(task).toBeDefined();
    });
  });

  it('parses results from search provider', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        results: [
          {
            title: 'Example Result',
            url: 'https://example.com',
            content: 'Example content',
            score: 1,
            publishedDate: '2024-01-01',
          },
        ],
        images: [
          {
            url: 'https://example.com/image.png',
            description: 'Example image',
          },
        ],
      }),
    }) as any;

    const res = await createSearchProvider({
      provider: 'tavily',
      baseURL: 'https://api.tavily.com',
      query: 'test',
      maxResult: 1,
    });

    expect(res.sources).toHaveLength(1);
    expect(res.images).toHaveLength(1);

    global.fetch = originalFetch;
  });

  it('returns mock financial data', async () => {
    const req = new Request('http://localhost/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({ action: 'stock-price', ticker: 'AAPL', financialProvider: 'mock' }),
    });

    const response = await financialDataPost(req as any);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.ticker).toBe('AAPL');
  });
});


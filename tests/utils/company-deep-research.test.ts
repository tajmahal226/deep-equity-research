import { describe, expect, it } from 'vitest';
import { CompanyDeepResearch } from '@/utils/company-deep-research';

const baseConfig = {
  companyName: 'Test Company',
  searchDepth: 'fast',
  language: 'en-US',
  subIndustries: [],
  competitors: [],
  researchSources: [],
  thinkingModelConfig: {
    modelId: 'gpt-4o',
    providerId: 'openai',
    apiKey: 'sk-test-key-123',
  },
  taskModelConfig: {
    modelId: 'gpt-4o',
    providerId: 'openai',
    apiKey: 'sk-test-key-123',
  },
  onProgress: () => {},
  onMessage: () => {},
  onError: () => {},
};

describe('CompanyDeepResearch maxTokens handling', () => {
  it('caps maxTokens to the caller-provided value when below the model limit', () => {
    const researcher = new CompanyDeepResearch(baseConfig as any);

    const thinkingSettings = (researcher as any).getThinkingModelSettings({
      temperature: 0.5,
      maxTokens: 4000,
    });
    const taskSettings = (researcher as any).getTaskModelSettings({
      temperature: 0.7,
      maxTokens: 4000,
    });

    expect(thinkingSettings.maxTokens).toBe(4000);
    expect(taskSettings.maxTokens).toBe(4000);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompanyDeepResearch } from '@/utils/company-deep-research';

// The bulk research workflow uses CompanyDeepResearch for each company.
// This test ensures DeepSeek provider yields helpful errors when API key missing.

describe('Bulk Company Research Module - DeepSeek Provider', () => {
  const companies = ['Alpha Corp', 'Beta Inc'];

  beforeEach(() => {
    vi.stubEnv('DEEPSEEK_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  companies.forEach((company) => {
    it(`fails with helpful error for missing API key (${company})`, async () => {
      const researcher = new CompanyDeepResearch({
        companyName: company,
        subIndustries: [],
        competitors: [],
        researchSources: [],
        searchDepth: 'fast',
        language: 'en-US',
        thinkingModelConfig: {
          modelId: 'deepseek-reasoner',
          providerId: 'deepseek',
        },
        taskModelConfig: {
          modelId: 'deepseek-chat',
          providerId: 'deepseek',
        },
      });

      await expect(researcher.runFastResearch()).rejects.toThrow(/No DeepSeek API key/i);
    });
  });
});


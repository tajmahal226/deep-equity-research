import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompanyDeepResearch } from '@/utils/company-deep-research';

// The bulk company research workflow reuses CompanyDeepResearch for
// each company. This test ensures the Anthropic provider path is exercised
// and surfaces a clear error when the API key is missing.
describe('Bulk Company Research Module - Anthropic Provider', () => {
  const companies = ['Alpha Corp', 'Beta Inc'];

  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
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
          modelId: 'claude-3-5-sonnet-20241022',
          providerId: 'anthropic',
        },
        taskModelConfig: {
          modelId: 'claude-3-5-haiku-20241022',
          providerId: 'anthropic',
        },
      });

      await expect(researcher.runFastResearch()).rejects.toThrow(/No Anthropic API key/i);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { filterCompanies } from '../../src/utils/company-filters';
import type { CompanyResult } from '../../src/store/companyDiscovery';

const sampleCompanies: CompanyResult[] = [
  {
    id: '1',
    name: 'TechCorp',
    description: 'AI cloud solutions',
    industry: 'Software & Technology',
    location: 'San Francisco, CA',
    fundingStage: 'Series A',
    tags: ['AI', 'Cloud'],
    sources: [],
    discoveredAt: new Date(),
  },
  {
    id: '2',
    name: 'HealthCorp',
    description: 'Healthcare services',
    industry: 'Healthcare & Biotech',
    location: 'New York, NY',
    fundingStage: 'Seed',
    tags: ['Health'],
    sources: [],
    discoveredAt: new Date(),
  },
  {
    id: '3',
    name: 'FinTechCo',
    description: 'Fintech platform',
    industry: 'Fintech',
    location: 'London, UK',
    fundingStage: 'Series B',
    tags: ['Finance'],
    sources: [],
    discoveredAt: new Date(),
  },
];

describe('company filter utility', () => {
  it('filters by industry', () => {
    const result = filterCompanies(sampleCompanies, { industries: ['Fintech'] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('FinTechCo');
  });

  it('filters by location', () => {
    const result = filterCompanies(sampleCompanies, { locations: ['San Francisco, CA'] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('TechCorp');
  });

  it('filters by funding stage', () => {
    const result = filterCompanies(sampleCompanies, { fundingStages: ['Seed'] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('HealthCorp');
  });

  it('filters by keywords', () => {
    const result = filterCompanies(sampleCompanies, { keywords: ['cloud'] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('TechCorp');
  });

  it('filters by exclude keywords', () => {
    const result = filterCompanies(sampleCompanies, { excludeKeywords: ['health'] });
    expect(result).toHaveLength(2);
    expect(result.find(c => c.name === 'HealthCorp')).toBeUndefined();
  });
});

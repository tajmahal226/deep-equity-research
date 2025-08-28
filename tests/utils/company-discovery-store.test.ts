import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stub localStorage before importing the store
beforeEach(() => {
  vi.resetModules();
  const storage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => (key in storage ? storage[key] : null),
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    key: (index: number) => Object.keys(storage)[index] || null,
    length: 0,
  } as any;
});

describe('Company discovery store search', () => {
  it('adds and searches companies', async () => {
    const { useCompanyDiscoveryStore } = await import('../../src/store/companyDiscovery');
    const store = useCompanyDiscoveryStore.getState();
    store.addCompany({
      name: 'Tech Corp',
      description: 'A technology company',
      industry: 'Technology',
      location: 'SF',
      fundingStage: 'Seed',
      tags: ['Tech'],
      sources: [],
    });
    store.addCompany({
      name: 'Health Inc',
      description: 'Healthcare startup',
      industry: 'Healthcare',
      location: 'NY',
      fundingStage: 'Series A',
      tags: ['Health'],
      sources: [],
    });

    const results = store.searchCompanies('tech');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Tech Corp');
  });
});

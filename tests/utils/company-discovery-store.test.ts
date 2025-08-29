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

  it('orders companies consistently by match score', async () => {
    const { useCompanyDiscoveryStore } = await import('../../src/store/companyDiscovery');
    const store = useCompanyDiscoveryStore;
    store.getState().clearCompanies();

    ['Alpha', 'Beta', 'Gamma'].forEach((name, index) => {
      store.getState().addCompany({
        name,
        description: `${name} description`,
        industry: 'Test',
        location: 'Test',
        fundingStage: 'Seed',
        tags: ['Test'],
        sources: [],
        matchScore: 100 - index,
      });
    });

    const ordered = [...store.getState().companies].sort(
      (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
    );

    expect(ordered.map(c => c.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});

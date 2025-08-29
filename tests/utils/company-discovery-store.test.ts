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
  const setupStore = async () => {
    const { useCompanyDiscoveryStore } = await import('../../src/store/companyDiscovery');
    const store = useCompanyDiscoveryStore.getState();
    store.addCompany({
      name: 'Tech Corp',
      description: 'A technology company',
      industry: 'Technology',
      location: 'SF',
      fundingStage: 'Seed',
      ticker: 'TCKR',
      tags: ['Tech'],
      sources: [],
    });
    store.addCompany({
      name: 'Health Inc',
      description: 'Healthcare startup',
      industry: 'Healthcare',
      location: 'New York',
      fundingStage: 'Series A',
      ticker: 'HLTH',
      tags: ['Health'],
      sources: [],
    });
    return store;
  };

  it('searches by name', async () => {
    const store = await setupStore();
    const results = store.searchCompanies('tech');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Tech Corp');
  });

  it('searches by location', async () => {
    const store = await setupStore();
    const results = store.searchCompanies('new york');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Health Inc');
  });

  it('searches by funding stage', async () => {
    const store = await setupStore();
    const results = store.searchCompanies('seed');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Tech Corp');
  });

  it('searches by ticker', async () => {
    const store = await setupStore();
    const results = store.searchCompanies('hlth');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Health Inc');
  });

  it('orders companies deterministically by match score', async () => {
    const { useCompanyDiscoveryStore } = await import('../../src/store/companyDiscovery');
    const store = useCompanyDiscoveryStore.getState();

    // Ensure clean state
    store.clearCompanies();

    const names = ['Alpha Corp', 'Beta LLC', 'Gamma Inc'];
    names.forEach((name, index) => {
      store.addCompany({
        name,
        description: `${name} description`,
        industry: 'Tech',
        location: 'SF',
        fundingStage: 'Seed',
        ticker: name.slice(0, 4).toUpperCase(),
        tags: ['Tech'],
        sources: [],
        matchScore: 100 - index,
      });
    });

    const ordered = [...useCompanyDiscoveryStore.getState().companies].sort(
      (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
    );
    expect(ordered.map(c => c.name)).toEqual(names);
  });
});

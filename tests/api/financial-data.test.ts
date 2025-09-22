import { describe, it, expect } from 'vitest';
import { POST as financialDataPost } from '../../src/app/api/financial-data/route';

describe('Financial data API', () => {
  it('searches companies', async () => {
    const req = new Request('http://localhost/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({ action: 'search-companies', query: 'tech', financialProvider: 'mock' }),
    });
    const res = await financialDataPost(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.results.length).toBeGreaterThan(0);
  });

  it('gets company profile', async () => {
    const req = new Request('http://localhost/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({ action: 'company-profile', ticker: 'AAPL', financialProvider: 'mock' }),
    });
    const res = await financialDataPost(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.ticker).toBe('AAPL');
  });

  it('gets company financials', async () => {
    const req = new Request('http://localhost/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({ action: 'company-financials', ticker: 'AAPL', financialProvider: 'mock' }),
    });
    const res = await financialDataPost(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.statements.income).toBeDefined();
  });

  it('gets stock price', async () => {
    const req = new Request('http://localhost/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({ action: 'stock-price', ticker: 'AAPL', financialProvider: 'mock' }),
    });
    const res = await financialDataPost(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.ticker).toBe('AAPL');
  });

  it('returns consistent mock data when deterministic mode enabled', async () => {
    const body = { action: 'stock-price', ticker: 'AAPL', financialProvider: 'mock', deterministic: true };
    const req1 = new Request('http://localhost/api/financial-data', { method: 'POST', body: JSON.stringify(body) });
    const req2 = new Request('http://localhost/api/financial-data', { method: 'POST', body: JSON.stringify(body) });
    const res1 = await financialDataPost(req1 as any);
    const res2 = await financialDataPost(req2 as any);
    const json1 = await res1.json();
    const json2 = await res2.json();
    expect(json1.data.price).toBe(json2.data.price);
    expect(json1.data.volume).toBe(json2.data.volume);
  });
});

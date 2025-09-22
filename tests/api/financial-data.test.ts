import { describe, it, expect, afterEach, vi } from 'vitest';
import { POST as financialDataPost } from '../../src/app/api/financial-data/route';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

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
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;
    const req = new Request('http://localhost/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({ action: 'stock-price', ticker: 'AAPL', financialProvider: 'mock' }),
    });
    const res = await financialDataPost(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.ticker).toBe('AAPL');
    expect(fetchSpy).not.toHaveBeenCalled();
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

  it('prefers the requested financial provider when keys are available', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (!url.includes('financialdatasets.ai')) {
        throw new Error(`Unexpected fetch call: ${url}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            price: 125.67,
            change: 1.23,
            changePercent: 0.98,
            volume: 1200000,
            high: 130.12,
            low: 120.34,
            open: 122.45,
            previousClose: 124.11,
            marketCap: '150B',
            peRatio: 24.5,
          },
        }),
        { status: 200 }
      );
    });

    global.fetch = fetchMock as any;

    const req = new Request('http://localhost/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({
        action: 'stock-price',
        ticker: 'AAPL',
        financialProvider: 'financial_datasets',
        financialDatasetsApiKey: 'test-key',
      }),
    });

    const res = await financialDataPost(req as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.source).toBe('financial_datasets');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].toString()).toContain('financialdatasets.ai');
  });

  it('uses real data providers when API keys are configured but provider is left as mock', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (!url.includes('financialdatasets.ai')) {
        throw new Error(`Unexpected fetch call: ${url}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            price: 99.99,
            change: 0.45,
            changePercent: 0.33,
            volume: 123_000,
            high: 102.0,
            low: 95.0,
            open: 98.5,
            previousClose: 99.5,
            marketCap: '120B',
            peRatio: 30.1,
          },
        }),
        { status: 200 }
      );
    });

    global.fetch = fetchMock as any;

    const req = new Request('http://localhost/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({
        action: 'stock-price',
        ticker: 'MSFT',
        financialProvider: 'mock',
        financialDatasetsApiKey: 'demo-key',
      }),
    });

    const res = await financialDataPost(req as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.source).toBe('financial_datasets');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].toString()).toContain('financialdatasets.ai');
  });

  it('falls back to Yahoo Finance when the requested provider fails', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('alphavantage.co')) {
        return new Response(JSON.stringify({}), { status: 200 });
      }

      if (url.includes('finance.yahoo.com')) {
        return new Response(
          JSON.stringify({
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 210.25,
                    regularMarketVolume: 980000,
                    regularMarketDayHigh: 215.4,
                    regularMarketDayLow: 205.1,
                    previousClose: 208.0,
                    marketCap: 180_000_000_000,
                  },
                  indicators: {
                    quote: [
                      {
                        open: [208.5],
                        close: [210.25],
                        volume: [980000],
                        high: [215.4],
                        low: [205.1],
                      },
                    ],
                  },
                },
              ],
            },
          }),
          { status: 200 }
        );
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    global.fetch = fetchMock as any;

    const req = new Request('http://localhost/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({
        action: 'stock-price',
        ticker: 'AAPL',
        financialProvider: 'alpha_vantage',
        alphaVantageApiKey: 'demo',
      }),
    });

    const res = await financialDataPost(req as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.source).toBe('yahoo_finance');
    expect(fetchMock.mock.calls.some(call => call[0].toString().includes('alphavantage.co'))).toBe(true);
    expect(fetchMock.mock.calls.some(call => call[0].toString().includes('finance.yahoo.com'))).toBe(true);
  });
});

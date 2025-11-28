import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../../src/middleware';

// Mock dependencies
vi.mock('../../src/utils/model', () => ({
  getCustomModelList: vi.fn(() => ({
    availableModelList: [],
    disabledModelList: [],
  })),
  multiApiKeyPolling: vi.fn((keys: string) => keys.split(',')[0] || ''),
}));

vi.mock('../../src/utils/signature', () => ({
  verifySignature: vi.fn((signature: string, password: string) => {
    return signature === password;
  }),
}));

describe('Middleware - Search Providers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      ACCESS_PASSWORD: 'test-password',
      TAVILY_API_KEY: 'test-tavily-key',
      FIRECRAWL_API_KEY: 'test-firecrawl-key',
      EXA_API_KEY: 'test-exa-key',
      BOCHA_API_KEY: 'test-bocha-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Tavily Search', () => {
    it('should allow authenticated POST request', async () => {
      const request = new NextRequest('http://localhost/api/search/tavily', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject GET request', async () => {
      const request = new NextRequest('http://localhost/api/search/tavily?query=test', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-password',
        },
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const request = new NextRequest('http://localhost/api/search/tavily', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should return 500 when API key is missing', async () => {
      process.env.TAVILY_API_KEY = '';

      const request = new NextRequest('http://localhost/api/search/tavily', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.message).toContain('API key');
    });
  });

  describe('Firecrawl Search', () => {
    it('should allow authenticated POST request', async () => {
      const request = new NextRequest('http://localhost/api/search/firecrawl', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject GET request', async () => {
      const request = new NextRequest('http://localhost/api/search/firecrawl', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-password',
        },
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });
  });

  describe('Exa Search', () => {
    it('should allow authenticated POST request', async () => {
      const request = new NextRequest('http://localhost/api/search/exa', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const request = new NextRequest('http://localhost/api/search/exa', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });
  });

  describe('Bocha Search', () => {
    it('should allow authenticated POST request', async () => {
      const request = new NextRequest('http://localhost/api/search/bocha', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });
  });

  describe('SearXNG Search', () => {
    it('should allow authenticated POST request without API key', async () => {
      const request = new NextRequest('http://localhost/api/search/searxng', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject GET request', async () => {
      const request = new NextRequest('http://localhost/api/search/searxng', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-password',
        },
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const request = new NextRequest('http://localhost/api/search/searxng', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });
  });

  describe('Disabled Search Providers', () => {
    it('should reject request to disabled search provider', async () => {
      process.env.NEXT_PUBLIC_DISABLED_SEARCH_PROVIDER = 'tavily';

      const request = new NextRequest('http://localhost/api/search/tavily', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should reject multiple disabled search providers', async () => {
      process.env.NEXT_PUBLIC_DISABLED_SEARCH_PROVIDER = 'tavily,firecrawl,exa';

      const tavilyRequest = new NextRequest('http://localhost/api/search/tavily', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const tavilyResponse = await middleware(tavilyRequest);
      expect(tavilyResponse.status).toBe(403);

      const firecrawlRequest = new NextRequest('http://localhost/api/search/firecrawl', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ url: 'test' }),
      });

      const firecrawlResponse = await middleware(firecrawlRequest);
      expect(firecrawlResponse.status).toBe(403);
    });
  });
});

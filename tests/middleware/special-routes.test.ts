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

describe('Middleware - Special Routes', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      ACCESS_PASSWORD: 'test-password',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('SSE Endpoint', () => {
    it('should allow authenticated POST request with Bearer token', async () => {
      const request = new NextRequest('http://localhost/api/sse', {
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

    it('should allow authenticated GET request with password query param', async () => {
      const request = new NextRequest('http://localhost/api/sse?password=test-password', {
        method: 'GET',
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject request with incorrect password in Bearer token', async () => {
      const request = new NextRequest('http://localhost/api/sse', {
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

    it('should reject GET request with incorrect password query param', async () => {
      const request = new NextRequest('http://localhost/api/sse?password=wrong-password', {
        method: 'GET',
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should reject request without credentials', async () => {
      const request = new NextRequest('http://localhost/api/sse', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should work when ACCESS_PASSWORD is empty', async () => {
      process.env.ACCESS_PASSWORD = '';

      const request = new NextRequest('http://localhost/api/sse', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });
  });

  describe('MCP Endpoint', () => {
    it('should allow authenticated request', async () => {
      const request = new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ method: 'initialize' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(401);
    });

    it('should reject unauthenticated request with 401', async () => {
      const request = new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ method: 'initialize' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe(401);
      expect(body.error_description).toBe('No permissions');
    });

    it('should set WWW-Authenticate header on 401 response', async () => {
      const request = new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ method: 'initialize' }),
      });

      const response = await middleware(request);

      expect(response.headers.get('WWW-Authenticate')).toBe('No permissions');
    });

    it('should reject request without authorization header', async () => {
      const request = new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ method: 'initialize' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Crawler Endpoint', () => {
    it('should allow authenticated POST request', async () => {
      const request = new NextRequest('http://localhost/api/crawler', {
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

    it('should reject unauthenticated request', async () => {
      const request = new NextRequest('http://localhost/api/crawler', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should reject GET request', async () => {
      const request = new NextRequest('http://localhost/api/crawler', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-password',
        },
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should reject request without authorization header', async () => {
      const request = new NextRequest('http://localhost/api/crawler', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });
  });

  describe('Unmatched Routes', () => {
    it('should pass through non-API routes', async () => {
      const request = new NextRequest('http://localhost/', {
        method: 'GET',
      });

      const response = await middleware(request);

      // Should return NextResponse.next() without modification
      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(500);
    });

    it('should pass through unknown API routes', async () => {
      const request = new NextRequest('http://localhost/api/unknown', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ data: 'test' }),
      });

      const response = await middleware(request);

      // Should return NextResponse.next() for unmatched API routes
      expect(response.status).not.toBe(403);
    });
  });
});

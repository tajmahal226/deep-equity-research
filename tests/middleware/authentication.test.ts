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
    // Simple mock: signature matches password
    return signature === password;
  }),
}));

describe('Middleware - Authentication', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      ACCESS_PASSWORD: 'test-password',
      OPENAI_API_KEY: 'sk-test-openai',
      ANTHROPIC_API_KEY: 'sk-test-anthropic',
      GOOGLE_GENERATIVE_AI_API_KEY: 'test-google',
      DEEPSEEK_API_KEY: 'sk-test-deepseek',
      XAI_API_KEY: 'sk-test-xai',
      MISTRAL_API_KEY: 'sk-test-mistral',
      OPENROUTER_API_KEY: 'sk-test-openrouter',
      TAVILY_API_KEY: 'test-tavily',
      FIRECRAWL_API_KEY: 'test-firecrawl',
      EXA_API_KEY: 'test-exa',
      BOCHA_API_KEY: 'test-bocha',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('OpenAI Provider', () => {
    it('should allow authenticated request with valid signature', async () => {
      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      // Should return NextResponse.next() for valid auth
      expect(response).toBeDefined();
      expect(response.status).not.toBe(403);
    });

    it('should reject request with invalid signature', async () => {
      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe(403);
      expect(body.error.message).toBe('No permissions');
    });

    it('should reject request without authorization header', async () => {
      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should return 500 when API key is missing', async () => {
      process.env.OPENAI_API_KEY = '';

      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.message).toContain('API key');
    });
  });

  describe('Anthropic Provider', () => {
    it('should allow authenticated request with x-api-key header', async () => {
      const request = new NextRequest('http://localhost/api/ai/anthropic/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': 'test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'claude-3-opus' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject request with invalid x-api-key', async () => {
      const request = new NextRequest('http://localhost/api/ai/anthropic/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': 'wrong-key',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'claude-3-opus' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });
  });

  describe('Google Provider', () => {
    it('should allow authenticated request with x-goog-api-key header', async () => {
      const request = new NextRequest('http://localhost/api/ai/google/v1/models', {
        method: 'POST',
        headers: {
          'x-goog-api-key': 'test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject request with invalid x-goog-api-key', async () => {
      const request = new NextRequest('http://localhost/api/ai/google/v1/models', {
        method: 'POST',
        headers: {
          'x-goog-api-key': 'wrong-key',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });
  });

  describe('DeepSeek Provider', () => {
    it('should allow authenticated request', async () => {
      const request = new NextRequest('http://localhost/api/ai/deepseek/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'deepseek-chat' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject request with invalid credentials', async () => {
      const request = new NextRequest('http://localhost/api/ai/deepseek/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'deepseek-chat' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });
  });

  describe('xAI Provider', () => {
    it('should allow authenticated request', async () => {
      const request = new NextRequest('http://localhost/api/ai/xai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'grok-1' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });
  });

  describe('Mistral Provider', () => {
    it('should allow authenticated request', async () => {
      const request = new NextRequest('http://localhost/api/ai/mistral/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'mistral-large' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });
  });

  describe('OpenRouter Provider', () => {
    it('should allow authenticated request', async () => {
      const request = new NextRequest('http://localhost/api/ai/openrouter/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'anthropic/claude-3-opus' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });
  });

  describe('Ollama Provider', () => {
    it('should allow authenticated request without API key requirement', async () => {
      const request = new NextRequest('http://localhost/api/ai/ollama/api/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'llama2' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const request = new NextRequest('http://localhost/api/ai/ollama/api/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'llama2' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });
  });
});

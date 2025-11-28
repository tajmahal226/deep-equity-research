import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../../src/middleware';

// Mock dependencies
vi.mock('../../src/utils/model', () => ({
  getCustomModelList: vi.fn((customList: string[]) => {
    const availableModelList: string[] = [];
    const disabledModelList: string[] = [];
    customList.forEach((model) => {
      if (model.startsWith('+')) {
        availableModelList.push(model.substring(1));
      } else if (model.startsWith('-')) {
        disabledModelList.push(model.substring(1));
      } else {
        availableModelList.push(model);
      }
    });
    return { availableModelList, disabledModelList };
  }),
  multiApiKeyPolling: vi.fn((keys: string) => keys.split(',')[0] || ''),
}));

vi.mock('../../src/utils/signature', () => ({
  verifySignature: vi.fn((signature: string, password: string) => {
    return signature === password;
  }),
}));

describe('Middleware - Provider and Model Filtering', () => {
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
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Disabled AI Providers', () => {
    it('should reject request to disabled provider', async () => {
      process.env.NEXT_PUBLIC_DISABLED_AI_PROVIDER = 'openai';

      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should reject requests to multiple disabled providers', async () => {
      process.env.NEXT_PUBLIC_DISABLED_AI_PROVIDER = 'openai,anthropic,deepseek';

      const openaiRequest = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const openaiResponse = await middleware(openaiRequest);
      expect(openaiResponse.status).toBe(403);

      const anthropicRequest = new NextRequest('http://localhost/api/ai/anthropic/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': 'test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'claude-3-opus' }),
      });

      const anthropicResponse = await middleware(anthropicRequest);
      expect(anthropicResponse.status).toBe(403);
    });

    it('should allow request to non-disabled provider', async () => {
      process.env.NEXT_PUBLIC_DISABLED_AI_PROVIDER = 'anthropic';

      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });
  });

  describe('Model Filtering for Non-Google Providers', () => {
    it('should reject request with disabled model', async () => {
      process.env.NEXT_PUBLIC_MODEL_LIST = '-gpt-4';

      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should allow request with available model', async () => {
      process.env.NEXT_PUBLIC_MODEL_LIST = '+gpt-4,+claude-3-opus';

      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should reject all models when -all is specified', async () => {
      process.env.NEXT_PUBLIC_MODEL_LIST = '-all';

      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should not filter models for GET requests', async () => {
      process.env.NEXT_PUBLIC_MODEL_LIST = '-all';

      const request = new NextRequest('http://localhost/api/ai/openai/v1/models', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-password',
        },
      });

      const response = await middleware(request);

      // GET requests should not be subject to model filtering
      expect(response.status).not.toBe(403);
    });
  });

  describe('Google Model Filtering', () => {
    it('should reject request to disabled Gemini model via URL pattern', async () => {
      process.env.NEXT_PUBLIC_MODEL_LIST = '-gemini-pro';

      const request = new NextRequest('http://localhost/api/ai/google/v1/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'x-goog-api-key': 'test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ contents: [] }),
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('should allow request to available Gemini model', async () => {
      process.env.NEXT_PUBLIC_MODEL_LIST = '+gemini-pro';

      const request = new NextRequest('http://localhost/api/ai/google/v1/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'x-goog-api-key': 'test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ contents: [] }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });

    it('should not filter Google models for GET requests', async () => {
      process.env.NEXT_PUBLIC_MODEL_LIST = '-all';

      const request = new NextRequest('http://localhost/api/ai/google/v1/models', {
        method: 'GET',
        headers: {
          'x-goog-api-key': 'test-password',
        },
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
    });
  });

  describe('Multiple API Keys (Polling)', () => {
    it('should work with single API key', async () => {
      process.env.OPENAI_API_KEY = 'sk-key-1';

      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(500);
    });

    it('should work with multiple comma-separated API keys', async () => {
      process.env.OPENAI_API_KEY = 'sk-key-1,sk-key-2,sk-key-3';

      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4' }),
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(500);
    });
  });

  describe('Request Body Parsing', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
        body: 'invalid-json{',
      });

      // Should not throw an error, should handle gracefully
      const response = await middleware(request);

      // The middleware should still process (though downstream might fail)
      expect(response).toBeDefined();
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost/api/ai/openai/v1/chat', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-password',
          'content-type': 'application/json',
        },
      });

      const response = await middleware(request);

      expect(response).toBeDefined();
    });
  });
});

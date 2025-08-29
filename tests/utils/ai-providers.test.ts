import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAIProvider } from '../../src/utils/deep-research/provider';

// Record final settings passed to each provider
const providerCalls: Record<string, any[]> = {};

function registerProvider(key: string) {
  providerCalls[key] = [];
}

// Mock OpenAI provider with responses support
registerProvider('openai');
registerProvider('openaiResponses');
vi.mock('@ai-sdk/openai', () => {
  const openaiFn = vi.fn((model: string, settings: any) => {
    providerCalls.openai.push(settings);
    return { model, settings } as any;
  });
  openaiFn.responses = vi.fn(() => {
    return {
      doGenerate: vi.fn((options: any) => {
        providerCalls.openaiResponses.push(options);
        return {};
      }),
      doStream: vi.fn((options: any) => {
        providerCalls.openaiResponses.push(options);
        return {};
      }),
    } as any;
  });
  openaiFn.tools = {
    webSearchPreview: vi.fn(() => ({})),
  } as any;
  return { createOpenAI: vi.fn(() => openaiFn) } as any;
});

// Mock providers with simple factories
registerProvider('google');
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() =>
    vi.fn((model: string, settings: any) => {
      providerCalls.google.push(settings);
      return { model, settings } as any;
    })
  ),
}));

registerProvider('anthropic');
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() =>
    vi.fn((model: string, settings: any) => {
      providerCalls.anthropic.push(settings);
      return { model, settings } as any;
    })
  ),
}));

registerProvider('deepseek');
vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: vi.fn(() =>
    vi.fn((model: string, settings: any) => {
      providerCalls.deepseek.push(settings);
      return { model, settings } as any;
    })
  ),
}));

registerProvider('xai');
vi.mock('@ai-sdk/xai', () => ({
  createXai: vi.fn(() =>
    vi.fn((model: string, settings: any) => {
      providerCalls.xai.push(settings);
      return { model, settings } as any;
    })
  ),
}));

registerProvider('mistral');
vi.mock('@ai-sdk/mistral', () => ({
  createMistral: vi.fn(() =>
    vi.fn((model: string, settings: any) => {
      providerCalls.mistral.push(settings);
      return { model, settings } as any;
    })
  ),
}));

registerProvider('azure');
vi.mock('@ai-sdk/azure', () => ({
  createAzure: vi.fn(() =>
    vi.fn((model: string, settings: any) => {
      providerCalls.azure.push(settings);
      return { model, settings } as any;
    })
  ),
}));

registerProvider('openrouter');
vi.mock('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: vi.fn(() =>
    vi.fn((model: string, settings: any) => {
      providerCalls.openrouter.push(settings);
      return { model, settings } as any;
    })
  ),
}));

registerProvider('ollama');
vi.mock('ollama-ai-provider', () => ({
  createOllama: vi.fn(() =>
    vi.fn((model: string, settings: any) => {
      providerCalls.ollama.push(settings);
      return { model, settings } as any;
    })
  ),
}));

// OpenAI-compatible providers differentiate by name
registerProvider('openaicompatible');
registerProvider('pollinations');
vi.mock('@ai-sdk/openai-compatible', () => {
  return {
    createOpenAICompatible: vi.fn((options: any) => {
      const key = options?.name as string;
      return vi.fn((model: string, settings: any) => {
        providerCalls[key].push(settings);
        return { model, settings } as any;
      });
    }),
  } as any;
});

beforeEach(() => {
  for (const key of Object.keys(providerCalls)) providerCalls[key] = [];
});

// Map of providers with sample basic and thinking models
const providerModels: Record<string, { basic: string; thinking: string }> = {
  openai: { basic: 'gpt-4o-mini', thinking: 'o1-mini' },
  google: { basic: 'gemini-1.5-flash', thinking: 'gemini-1.5-pro' },
  anthropic: { basic: 'claude-3-haiku-20240307', thinking: 'claude-3-5-sonnet-20241022' },
  deepseek: { basic: 'deepseek-chat', thinking: 'deepseek-reasoner' },
  xai: { basic: 'grok-2-mini', thinking: 'grok-2' },
  mistral: { basic: 'mistral-small', thinking: 'mistral-large-latest' },
  azure: { basic: 'gpt-4o-mini', thinking: 'o1-mini' },
  openrouter: { basic: 'openrouter/anthropic/claude-3-haiku', thinking: 'openrouter/openai/gpt-4o' },
  openaicompatible: { basic: 'gpt-3.5-turbo', thinking: 'gpt-4' },
  pollinations: { basic: 'gpt-3.5-turbo', thinking: 'gpt-4o' },
  ollama: { basic: 'llama3.2', thinking: 'qwen2.5:7b' },
};

describe('AI provider initialization', () => {
  for (const [provider, models] of Object.entries(providerModels)) {
    it(`initializes ${provider} basic model`, async () => {
      const model = await createAIProvider({
        provider,
        apiKey: 'test-key',
        baseURL: 'https://example.com',
        model: models.basic,
        settings: { temperature: 0.7 },
      });
      expect(model).toBeTruthy();
      const call = provider === 'openai'
        ? providerCalls.openai[0]
        : providerCalls[provider][0];
      expect(call).toBeDefined();
      expect(call.temperature).toBe(0.7);
    });

    it(`initializes ${provider} thinking model`, async () => {
      const model = await createAIProvider({
        provider,
        apiKey: 'test-key',
        baseURL: 'https://example.com',
        model: models.thinking,
        settings: { temperature: 0.7, reasoning_effort: 'medium' },
      });
      expect(model).toBeTruthy();

      if (provider === 'openai') {
        // Responses models sanitize options at call time
        await (model as any).doGenerate({
          temperature: 0.7,
          reasoning_effort: 'medium',
        });
        const call = providerCalls.openaiResponses[0];
        expect(call.temperature).toBeUndefined();
        expect(call.reasoning_effort).toBe('medium');
      } else {
        const call = providerCalls[provider][0];
        expect(call).toBeDefined();
        if (provider === 'azure') {
          expect(call.temperature).toBeUndefined();
          expect(call.reasoning_effort).toBe('medium');
        } else {
          expect(call.temperature).toBe(0.7);
        }
      }
    });
  }
});

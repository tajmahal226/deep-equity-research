import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage before importing store
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

describe('Setting Store', () => {
  it('should initialize with default values', async () => {
    const { useSettingStore } = await import('../../src/store/setting');
    const store = useSettingStore.getState();

    expect(store.provider).toBe('');
    expect(store.openAIThinkingModel).toBe('gpt-4o');
    expect(store.anthropicThinkingModel).toBe('claude-3-5-sonnet-20241022');
    expect(store.deepseekThinkingModel).toBe('deepseek-reasoner');
    expect(store.temperature).toBe(0.7);
    expect(store.cacheEnabled).toBe('enable');
    expect(store.debug).toBe('disable');
  });

  it('should update settings', async () => {
    const { useSettingStore } = await import('../../src/store/setting');
    const store = useSettingStore.getState();

    store.update({ provider: 'openai' });
    expect(store.provider).toBe('');  // Need to get fresh state

    const updatedStore = useSettingStore.getState();
    expect(updatedStore.provider).toBe('openai');
  });

  it('should update API keys', async () => {
    const { useSettingStore } = await import('../../src/store/setting');

    useSettingStore.getState().update({
      openAIApiKey: 'sk-test-123',
      anthropicApiKey: 'sk-ant-456',
      deepseekApiKey: 'sk-ds-789',
    });

    const store = useSettingStore.getState();
    expect(store.openAIApiKey).toBe('sk-test-123');
    expect(store.anthropicApiKey).toBe('sk-ant-456');
    expect(store.deepseekApiKey).toBe('sk-ds-789');
  });

  it('should update search settings', async () => {
    const { useSettingStore } = await import('../../src/store/setting');

    useSettingStore.getState().update({
      enableSearch: '1',
      searchProvider: 'tavily',
      tavilyApiKey: 'tavily-key-123',
      parallelSearch: 3,
      searchMaxResult: 10,
    });

    const store = useSettingStore.getState();
    expect(store.enableSearch).toBe('1');
    expect(store.searchProvider).toBe('tavily');
    expect(store.tavilyApiKey).toBe('tavily-key-123');
    expect(store.parallelSearch).toBe(3);
    expect(store.searchMaxResult).toBe(10);
  });

  it('should update cache settings', async () => {
    const { useSettingStore } = await import('../../src/store/setting');

    useSettingStore.getState().update({
      cacheEnabled: 'disable',
      cacheTTLCompanyResearch: 48,
      cacheTTLMarketResearch: 24,
      cacheMaxEntries: 1000,
    });

    const store = useSettingStore.getState();
    expect(store.cacheEnabled).toBe('disable');
    expect(store.cacheTTLCompanyResearch).toBe(48);
    expect(store.cacheTTLMarketResearch).toBe(24);
    expect(store.cacheMaxEntries).toBe(1000);
  });

  it('should update theme and UI settings', async () => {
    const { useSettingStore } = await import('../../src/store/setting');

    useSettingStore.getState().update({
      theme: 'dark',
      language: 'zh-CN',
      debug: 'enable',
      references: 'disable',
      citationImage: 'disable',
      smoothTextStreamType: 'character',
    });

    const store = useSettingStore.getState();
    expect(store.theme).toBe('dark');
    expect(store.language).toBe('zh-CN');
    expect(store.debug).toBe('enable');
    expect(store.references).toBe('disable');
    expect(store.citationImage).toBe('disable');
    expect(store.smoothTextStreamType).toBe('character');
  });

  it('should update multiple provider settings at once', async () => {
    const { useSettingStore } = await import('../../src/store/setting');

    useSettingStore.getState().update({
      openAIApiKey: 'sk-openai',
      openAIThinkingModel: 'gpt-4-turbo',
      anthropicApiKey: 'sk-anthropic',
      anthropicThinkingModel: 'claude-3-opus',
      deepseekApiKey: 'sk-deepseek',
      deepseekThinkingModel: 'deepseek-chat',
    });

    const store = useSettingStore.getState();
    expect(store.openAIApiKey).toBe('sk-openai');
    expect(store.openAIThinkingModel).toBe('gpt-4-turbo');
    expect(store.anthropicApiKey).toBe('sk-anthropic');
    expect(store.anthropicThinkingModel).toBe('claude-3-opus');
    expect(store.deepseekApiKey).toBe('sk-deepseek');
    expect(store.deepseekThinkingModel).toBe('deepseek-chat');
  });

  it('should reset settings to defaults', async () => {
    const { useSettingStore, defaultValues } = await import('../../src/store/setting');

    // Modify some settings
    useSettingStore.getState().update({
      provider: 'openai',
      openAIApiKey: 'sk-test',
      temperature: 0.9,
      debug: 'enable',
    });

    // Reset to defaults
    useSettingStore.getState().reset();

    const store = useSettingStore.getState();
    expect(store.provider).toBe(defaultValues.provider);
    expect(store.openAIApiKey).toBe(defaultValues.openAIApiKey);
    expect(store.temperature).toBe(defaultValues.temperature);
    expect(store.debug).toBe(defaultValues.debug);
  });

  it('should update partial settings without affecting others', async () => {
    const { useSettingStore } = await import('../../src/store/setting');

    useSettingStore.getState().update({
      provider: 'openai',
      temperature: 0.5,
    });

    useSettingStore.getState().update({
      temperature: 0.9,
    });

    const store = useSettingStore.getState();
    expect(store.provider).toBe('openai'); // Should remain unchanged
    expect(store.temperature).toBe(0.9); // Should be updated
  });

  it('should handle all AI provider configurations', async () => {
    const { useSettingStore } = await import('../../src/store/setting');

    const providers = [
      { key: 'openai', thinkingModel: 'gpt-4o', networkingModel: 'gpt-4o-mini' },
      { key: 'anthropic', thinkingModel: 'claude-3-5-sonnet-20241022', networkingModel: 'claude-3-5-haiku-20241022' },
      { key: 'deepseek', thinkingModel: 'deepseek-reasoner', networkingModel: 'deepseek-chat' },
      { key: 'xAI', thinkingModel: 'grok-2-1212', networkingModel: 'grok-2-mini-1212' },
      { key: 'mistral', thinkingModel: 'mistral-large-latest', networkingModel: 'mistral-medium-latest' },
    ];

    for (const provider of providers) {
      useSettingStore.getState().update({
        [`${provider.key}ThinkingModel`]: provider.thinkingModel,
        [`${provider.key}NetworkingModel`]: provider.networkingModel,
      } as any);

      const store = useSettingStore.getState();
      expect((store as any)[`${provider.key}ThinkingModel`]).toBe(provider.thinkingModel);
      expect((store as any)[`${provider.key}NetworkingModel`]).toBe(provider.networkingModel);
    }
  });

  it('should handle financial provider settings', async () => {
    const { useSettingStore } = await import('../../src/store/setting');

    useSettingStore.getState().update({
      financialProvider: 'alpha_vantage',
      alphaVantageApiKey: 'av-key-123',
      yahooFinanceApiKey: 'yf-key-456',
      financialDatasetsApiKey: 'fd-key-789',
    });

    const store = useSettingStore.getState();
    expect(store.financialProvider).toBe('alpha_vantage');
    expect(store.alphaVantageApiKey).toBe('av-key-123');
    expect(store.yahooFinanceApiKey).toBe('yf-key-456');
    expect(store.financialDatasetsApiKey).toBe('fd-key-789');
  });

  it('should handle all search provider configurations', async () => {
    const { useSettingStore } = await import('../../src/store/setting');

    useSettingStore.getState().update({
      tavilyApiKey: 'tavily-123',
      firecrawlApiKey: 'firecrawl-456',
      exaApiKey: 'exa-789',
      bochaApiKey: 'bocha-012',
      searxngApiProxy: 'https://searxng.example.com',
    });

    const store = useSettingStore.getState();
    expect(store.tavilyApiKey).toBe('tavily-123');
    expect(store.firecrawlApiKey).toBe('firecrawl-456');
    expect(store.exaApiKey).toBe('exa-789');
    expect(store.bochaApiKey).toBe('bocha-012');
    expect(store.searxngApiProxy).toBe('https://searxng.example.com');
  });
});

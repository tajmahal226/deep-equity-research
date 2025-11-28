import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage
const mockStorage: Record<string, any> = {};

vi.mock('../../src/utils/storage', () => ({
  researchStore: {
    getItem: vi.fn(async (key: string) => mockStorage[key]),
    setItem: vi.fn(async (key: string, value: any) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete mockStorage[key];
    }),
  },
}));

// Mock localStorage before importing store
beforeEach(() => {
  vi.resetModules();
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);

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

describe('Knowledge Store', () => {
  const createMockKnowledge = (overrides?: Partial<Knowledge>): Knowledge => ({
    id: 'knowledge-1',
    title: 'Test Knowledge',
    content: 'This is test content',
    type: 'knowledge' as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  it('should initialize with empty knowledges array', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');
    const store = useKnowledgeStore.getState();

    expect(store.knowledges).toEqual([]);
  });

  it('should save knowledge', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const knowledge = createMockKnowledge();
    useKnowledgeStore.getState().save(knowledge);

    const knowledges = useKnowledgeStore.getState().knowledges;
    expect(knowledges).toHaveLength(1);
    expect(knowledges[0].id).toBe('knowledge-1');
    expect(knowledges[0].title).toBe('Test Knowledge');
    expect(knowledges[0].content).toBe('This is test content');
  });

  it('should check if knowledge exists', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const knowledge = createMockKnowledge({ id: 'exists-1' });
    useKnowledgeStore.getState().save(knowledge);

    expect(useKnowledgeStore.getState().exist('exists-1')).toBe(true);
    expect(useKnowledgeStore.getState().exist('does-not-exist')).toBe(false);
  });

  it('should get knowledge by id', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const knowledge = createMockKnowledge({
      id: 'get-test',
      title: 'Get Test',
      content: 'Content to retrieve',
    });
    useKnowledgeStore.getState().save(knowledge);

    const retrieved = useKnowledgeStore.getState().get('get-test');

    expect(retrieved).toBeTruthy();
    expect(retrieved?.id).toBe('get-test');
    expect(retrieved?.title).toBe('Get Test');
    expect(retrieved?.content).toBe('Content to retrieve');
  });

  it('should return null when getting non-existent knowledge', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const retrieved = useKnowledgeStore.getState().get('non-existent');

    expect(retrieved).toBeNull();
  });

  it('should update knowledge', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const knowledge = createMockKnowledge({ id: 'update-test' });
    useKnowledgeStore.getState().save(knowledge);

    const originalTime = knowledge.updatedAt;

    // Wait a bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const success = useKnowledgeStore.getState().update('update-test', {
      title: 'Updated Title',
      content: 'Updated Content',
    });

    expect(success).toBe(true);

    const updated = useKnowledgeStore.getState().get('update-test');
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.content).toBe('Updated Content');
    expect(updated?.updatedAt).toBeGreaterThan(originalTime);
  });

  it('should remove knowledge', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const knowledge1 = createMockKnowledge({ id: 'remove-1', title: 'Keep This' });
    const knowledge2 = createMockKnowledge({ id: 'remove-2', title: 'Remove This' });

    useKnowledgeStore.getState().save(knowledge1);
    useKnowledgeStore.getState().save(knowledge2);

    expect(useKnowledgeStore.getState().knowledges).toHaveLength(2);

    const success = useKnowledgeStore.getState().remove('remove-2');

    expect(success).toBe(true);
    expect(useKnowledgeStore.getState().knowledges).toHaveLength(1);
    expect(useKnowledgeStore.getState().knowledges[0].id).toBe('remove-1');
  });

  it('should save knowledge in LIFO order (newest first)', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const k1 = createMockKnowledge({ id: 'k1', title: 'First' });
    const k2 = createMockKnowledge({ id: 'k2', title: 'Second' });
    const k3 = createMockKnowledge({ id: 'k3', title: 'Third' });

    useKnowledgeStore.getState().save(k1);
    useKnowledgeStore.getState().save(k2);
    useKnowledgeStore.getState().save(k3);

    const knowledges = useKnowledgeStore.getState().knowledges;

    expect(knowledges[0].id).toBe('k3');
    expect(knowledges[1].id).toBe('k2');
    expect(knowledges[2].id).toBe('k1');
  });

  it('should handle file type knowledge', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const fileKnowledge = createMockKnowledge({
      id: 'file-1',
      type: 'file',
      title: 'Document.pdf',
      content: 'PDF content here',
      fileMeta: {
        name: 'Document.pdf',
        size: 102400,
        type: 'application/pdf',
        lastModified: Date.now(),
      },
    });

    useKnowledgeStore.getState().save(fileKnowledge);

    const retrieved = useKnowledgeStore.getState().get('file-1');

    expect(retrieved?.type).toBe('file');
    expect(retrieved?.fileMeta?.name).toBe('Document.pdf');
    expect(retrieved?.fileMeta?.size).toBe(102400);
    expect(retrieved?.fileMeta?.type).toBe('application/pdf');
  });

  it('should handle url type knowledge', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const urlKnowledge = createMockKnowledge({
      id: 'url-1',
      type: 'url',
      title: 'Example Website',
      content: 'Webpage content',
      url: 'https://example.com',
    });

    useKnowledgeStore.getState().save(urlKnowledge);

    const retrieved = useKnowledgeStore.getState().get('url-1');

    expect(retrieved?.type).toBe('url');
    expect(retrieved?.url).toBe('https://example.com');
  });

  it('should clone knowledge when getting', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const knowledge = createMockKnowledge({ id: 'clone-test' });
    useKnowledgeStore.getState().save(knowledge);

    const retrieved1 = useKnowledgeStore.getState().get('clone-test');
    const retrieved2 = useKnowledgeStore.getState().get('clone-test');

    // Should be different instances
    expect(retrieved1).not.toBe(retrieved2);
    expect(retrieved1).toEqual(retrieved2);
  });

  it('should clone knowledge when updating', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const knowledge = createMockKnowledge({ id: 'clone-update-test' });
    useKnowledgeStore.getState().save(knowledge);

    const updateData = { title: 'Modified Title' };
    useKnowledgeStore.getState().update('clone-update-test', updateData);

    // Modifying updateData should not affect stored knowledge
    (updateData as any).title = 'Changed Again';

    const retrieved = useKnowledgeStore.getState().get('clone-update-test');
    expect(retrieved?.title).toBe('Modified Title');
  });

  it('should preserve all knowledge properties on update', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    const knowledge = createMockKnowledge({
      id: 'preserve-test',
      title: 'Original',
      content: 'Original content',
      type: 'file',
      fileMeta: {
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        lastModified: Date.now(),
      },
    });

    useKnowledgeStore.getState().save(knowledge);

    useKnowledgeStore.getState().update('preserve-test', {
      title: 'Updated',
    });

    const updated = useKnowledgeStore.getState().get('preserve-test');

    expect(updated?.title).toBe('Updated');
    expect(updated?.content).toBe('Original content'); // Should be preserved
    expect(updated?.type).toBe('file'); // Should be preserved
    expect(updated?.fileMeta).toBeTruthy(); // Should be preserved
  });

  it('should handle multiple knowledge entries', async () => {
    const { useKnowledgeStore } = await import('../../src/store/knowledge');

    for (let i = 1; i <= 20; i++) {
      const knowledge = createMockKnowledge({
        id: `knowledge-${i}`,
        title: `Knowledge ${i}`,
        content: `Content ${i}`,
      });
      useKnowledgeStore.getState().save(knowledge);
    }

    expect(useKnowledgeStore.getState().knowledges).toHaveLength(20);

    // Verify they all exist
    for (let i = 1; i <= 20; i++) {
      expect(useKnowledgeStore.getState().exist(`knowledge-${i}`)).toBe(true);
    }
  });
});

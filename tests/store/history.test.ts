import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TaskStore } from '../../src/store/task';

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

describe('History Store', () => {
  const createMockTaskStore = (overrides?: Partial<TaskStore>): TaskStore => ({
    status: 'success' as const,
    error: null,
    id: 'test-id',
    title: 'Test Research',
    question: 'What is the market size?',
    resources: [],
    query: 'test query',
    questions: 'Question 1\nQuestion 2',
    feedback: 'Good analysis',
    reportPlan: 'Plan section',
    suggestion: 'Consider this',
    tasks: [],
    requirement: 'Analyze the market',
    finalReport: '# Final Report\n\nContent here',
    sources: [],
    images: [],
    knowledgeGraph: '',
    ...overrides,
  });

  it('should initialize with empty history', async () => {
    const { useHistoryStore } = await import('../../src/store/history');
    const store = useHistoryStore.getState();

    expect(store.history).toEqual([]);
  });

  it('should save task to history', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const taskStore = createMockTaskStore();
    const id = useHistoryStore.getState().save(taskStore);

    expect(id).toBeTruthy();
    expect(id.length).toBe(12); // nanoid with custom alphabet

    const history = useHistoryStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0].title).toBe('Test Research');
    expect(history[0].finalReport).toBe('# Final Report\n\nContent here');
    expect(history[0].createdAt).toBeTruthy();
  });

  it('should not save task without title', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const taskStore = createMockTaskStore({ title: '' });
    const id = useHistoryStore.getState().save(taskStore);

    expect(id).toBe('');
    expect(useHistoryStore.getState().history).toHaveLength(0);
  });

  it('should not save task without final report', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const taskStore = createMockTaskStore({ finalReport: '' });
    const id = useHistoryStore.getState().save(taskStore);

    expect(id).toBe('');
    expect(useHistoryStore.getState().history).toHaveLength(0);
  });

  it('should load task from history', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const taskStore = createMockTaskStore();
    const id = useHistoryStore.getState().save(taskStore);

    const loaded = useHistoryStore.getState().load(id);

    expect(loaded).toBeTruthy();
    expect(loaded?.title).toBe('Test Research');
    expect(loaded?.question).toBe('What is the market size?');
    expect(loaded?.finalReport).toBe('# Final Report\n\nContent here');
  });

  it('should return undefined when loading non-existent task', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const loaded = useHistoryStore.getState().load('non-existent-id');

    expect(loaded).toBeUndefined();
  });

  it('should update task in history', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const taskStore = createMockTaskStore();
    const id = useHistoryStore.getState().save(taskStore);

    const original = useHistoryStore.getState().history.find(h => h.id === id);

    const updatedTaskStore = createMockTaskStore({
      title: 'Updated Title',
      finalReport: '# Updated Report',
    });

    const success = useHistoryStore.getState().update(id, updatedTaskStore);

    expect(success).toBe(true);

    const history = useHistoryStore.getState().history;
    const updated = history.find(h => h.id === id);

    expect(updated?.id).toBe(id);
    expect(updated?.createdAt).toBe(original?.createdAt);
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.finalReport).toBe('# Updated Report');
    expect(updated?.updatedAt).toBeTruthy();
  });

  it('should remove task from history', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const taskStore1 = createMockTaskStore({ title: 'Task 1' });
    const taskStore2 = createMockTaskStore({ title: 'Task 2' });

    const id1 = useHistoryStore.getState().save(taskStore1);
    const id2 = useHistoryStore.getState().save(taskStore2);

    expect(useHistoryStore.getState().history).toHaveLength(2);

    const success = useHistoryStore.getState().remove(id1);

    expect(success).toBe(true);
    expect(useHistoryStore.getState().history).toHaveLength(1);
    expect(useHistoryStore.getState().history[0].id).toBe(id2);
  });

  it('should maintain history order (newest first)', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const task1 = createMockTaskStore({ title: 'First Task' });
    const task2 = createMockTaskStore({ title: 'Second Task' });
    const task3 = createMockTaskStore({ title: 'Third Task' });

    useHistoryStore.getState().save(task1);
    useHistoryStore.getState().save(task2);
    useHistoryStore.getState().save(task3);

    const history = useHistoryStore.getState().history;

    expect(history[0].title).toBe('Third Task');
    expect(history[1].title).toBe('Second Task');
    expect(history[2].title).toBe('First Task');
  });

  it('should clone task data when saving', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const taskStore = createMockTaskStore();
    const id = useHistoryStore.getState().save(taskStore);

    // Modify original
    taskStore.title = 'Modified Title';

    const loaded = useHistoryStore.getState().load(id);

    // Loaded version should not be affected
    expect(loaded?.title).toBe('Test Research');
  });

  it('should clone task data when loading', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const taskStore = createMockTaskStore();
    const id = useHistoryStore.getState().save(taskStore);

    const loaded1 = useHistoryStore.getState().load(id);
    const loaded2 = useHistoryStore.getState().load(id);

    // Should be different instances
    expect(loaded1).not.toBe(loaded2);
    expect(loaded1).toEqual(loaded2);
  });

  it('should preserve all task properties', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const taskStore = createMockTaskStore({
      question: 'Complex question',
      questions: 'Q1\nQ2\nQ3',
      feedback: 'Detailed feedback',
      reportPlan: 'Complex plan',
      suggestion: 'Multiple suggestions',
      sources: [
        { url: 'https://example.com/1', title: 'Source 1', content: 'Content 1' },
        { url: 'https://example.com/2', title: 'Source 2', content: 'Content 2' },
      ],
      images: [
        { url: 'https://example.com/img1.jpg', title: 'Image 1' },
      ],
      knowledgeGraph: 'graph TD\n  A-->B',
    });

    const id = useHistoryStore.getState().save(taskStore);
    const loaded = useHistoryStore.getState().load(id);

    expect(loaded?.question).toBe('Complex question');
    expect(loaded?.questions).toBe('Q1\nQ2\nQ3');
    expect(loaded?.feedback).toBe('Detailed feedback');
    expect(loaded?.reportPlan).toBe('Complex plan');
    expect(loaded?.sources).toHaveLength(2);
    expect(loaded?.images).toHaveLength(1);
    expect(loaded?.knowledgeGraph).toBe('graph TD\n  A-->B');
  });

  it('should handle multiple save operations', async () => {
    const { useHistoryStore } = await import('../../src/store/history');

    const ids: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const task = createMockTaskStore({ title: `Task ${i}` });
      const id = useHistoryStore.getState().save(task);
      ids.push(id);
    }

    expect(useHistoryStore.getState().history).toHaveLength(10);
    expect(ids).toHaveLength(10);

    // All IDs should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });
});

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

describe('Task Store', () => {
  it('should initialize with default values', async () => {
    const { useTaskStore } = await import('../../src/store/task');
    const store = useTaskStore.getState();

    expect(store.status).toBe('idle');
    expect(store.error).toBeNull();
    expect(store.id).toBe('');
    expect(store.question).toBe('');
    expect(store.resources).toEqual([]);
    expect(store.tasks).toEqual([]);
    expect(store.sources).toEqual([]);
    expect(store.images).toEqual([]);
  });

  it('should set status', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    useTaskStore.getState().setStatus('loading');
    expect(useTaskStore.getState().status).toBe('loading');

    useTaskStore.getState().setStatus('success');
    expect(useTaskStore.getState().status).toBe('success');

    useTaskStore.getState().setStatus('error');
    expect(useTaskStore.getState().status).toBe('error');
  });

  it('should set and clear error', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    useTaskStore.getState().setError('Test error message');
    expect(useTaskStore.getState().error).toBe('Test error message');
    expect(useTaskStore.getState().status).toBe('error');

    useTaskStore.getState().setStatus('idle');
    expect(useTaskStore.getState().error).toBeNull();
  });

  it('should set task properties', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    useTaskStore.getState().setId('task-123');
    useTaskStore.getState().setTitle('Test Research');
    useTaskStore.getState().setQuestion('What is the market size?');
    useTaskStore.getState().setQuery('market size analysis');

    const store = useTaskStore.getState();
    expect(store.id).toBe('task-123');
    expect(store.title).toBe('Test Research');
    expect(store.question).toBe('What is the market size?');
    expect(store.query).toBe('market size analysis');
  });

  it('should add and update tasks', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    const task1: SearchTask = {
      state: 'processing',
      query: 'query1',
      researchGoal: 'goal1',
      learning: '',
      sources: [],
      images: [],
    };

    const task2: SearchTask = {
      state: 'unprocessed',
      query: 'query2',
      researchGoal: 'goal2',
      learning: '',
      sources: [],
      images: [],
    };

    useTaskStore.getState().update([task1, task2]);
    expect(useTaskStore.getState().tasks).toHaveLength(2);
    expect(useTaskStore.getState().tasks[0].query).toBe('query1');

    // Update a task
    useTaskStore.getState().updateTask('query1', { state: 'completed', learning: 'learned something' });
    const updatedTask = useTaskStore.getState().tasks.find(t => t.query === 'query1');
    expect(updatedTask?.state).toBe('completed');
    expect(updatedTask?.learning).toBe('learned something');
  });

  it('should remove tasks', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    const task1: SearchTask = {
      state: 'processing',
      query: 'query1',
      researchGoal: 'goal1',
      learning: '',
      sources: [],
      images: [],
    };

    const task2: SearchTask = {
      state: 'unprocessed',
      query: 'query2',
      researchGoal: 'goal2',
      learning: '',
      sources: [],
      images: [],
    };

    useTaskStore.getState().update([task1, task2]);
    expect(useTaskStore.getState().tasks).toHaveLength(2);

    const removed = useTaskStore.getState().removeTask('query1');
    expect(removed).toBe(true);
    expect(useTaskStore.getState().tasks).toHaveLength(1);
    expect(useTaskStore.getState().tasks[0].query).toBe('query2');
  });

  it('should add and update resources', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    const resource: Resource = {
      id: 'res-1',
      name: 'document.pdf',
      type: 'application/pdf',
      size: 1024,
      status: 'unprocessed',
    };

    useTaskStore.getState().addResource(resource);
    expect(useTaskStore.getState().resources).toHaveLength(1);
    expect(useTaskStore.getState().resources[0].name).toBe('document.pdf');

    // Update resource
    useTaskStore.getState().updateResource('res-1', { status: 'completed' });
    expect(useTaskStore.getState().resources[0].status).toBe('completed');
  });

  it('should remove resources', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    const resource1: Resource = {
      id: 'res-1',
      name: 'document1.pdf',
      type: 'application/pdf',
      size: 1024,
      status: 'completed',
    };

    const resource2: Resource = {
      id: 'res-2',
      name: 'document2.pdf',
      type: 'application/pdf',
      size: 2048,
      status: 'unprocessed',
    };

    useTaskStore.getState().addResource(resource1);
    useTaskStore.getState().addResource(resource2);
    expect(useTaskStore.getState().resources).toHaveLength(2);

    const removed = useTaskStore.getState().removeResource('res-1');
    expect(removed).toBe(true);
    expect(useTaskStore.getState().resources).toHaveLength(1);
    expect(useTaskStore.getState().resources[0].id).toBe('res-2');
  });

  it('should update research content', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    useTaskStore.getState().updateQuestions('Question 1\nQuestion 2');
    useTaskStore.getState().updateReportPlan('Plan section 1\nPlan section 2');
    useTaskStore.getState().updateFinalReport('# Final Report\nContent here');
    useTaskStore.getState().setFeedback('Good progress');

    const store = useTaskStore.getState();
    expect(store.questions).toBe('Question 1\nQuestion 2');
    expect(store.reportPlan).toBe('Plan section 1\nPlan section 2');
    expect(store.finalReport).toBe('# Final Report\nContent here');
    expect(store.feedback).toBe('Good progress');
  });

  it('should set sources and images', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    const sources: Source[] = [
      { url: 'https://example.com/1', title: 'Source 1', content: 'Content 1' },
      { url: 'https://example.com/2', title: 'Source 2', content: 'Content 2' },
    ];

    const images: Source[] = [
      { url: 'https://example.com/image1.jpg', title: 'Image 1' },
      { url: 'https://example.com/image2.jpg', title: 'Image 2' },
    ];

    useTaskStore.getState().setSources(sources);
    useTaskStore.getState().setImages(images);

    const store = useTaskStore.getState();
    expect(store.sources).toHaveLength(2);
    expect(store.images).toHaveLength(2);
    expect(store.sources[0].url).toBe('https://example.com/1');
    expect(store.images[0].url).toBe('https://example.com/image1.jpg');
  });

  it('should update knowledge graph', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    const graph = 'graph TD\n  A-->B\n  B-->C';
    useTaskStore.getState().updateKnowledgeGraph(graph);

    expect(useTaskStore.getState().knowledgeGraph).toBe(graph);
  });

  it('should clear tasks but preserve other data', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    const task: SearchTask = {
      state: 'completed',
      query: 'test',
      researchGoal: 'goal',
      learning: 'learned',
      sources: [],
      images: [],
    };

    useTaskStore.getState().setTitle('Test');
    useTaskStore.getState().update([task]);

    expect(useTaskStore.getState().tasks).toHaveLength(1);
    expect(useTaskStore.getState().title).toBe('Test');

    useTaskStore.getState().clear();

    expect(useTaskStore.getState().tasks).toHaveLength(0);
    expect(useTaskStore.getState().title).toBe('Test'); // Title should remain
  });

  it('should reset all values', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    useTaskStore.getState().setId('test-id');
    useTaskStore.getState().setTitle('Test Title');
    useTaskStore.getState().setQuestion('Test Question');
    useTaskStore.getState().updateFinalReport('# Report');

    useTaskStore.getState().reset();

    const store = useTaskStore.getState();
    expect(store.id).toBe('');
    expect(store.title).toBe('');
    expect(store.question).toBe('');
    expect(store.finalReport).toBe('');
    expect(store.status).toBe('idle');
  });

  it('should backup and restore task state', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    useTaskStore.getState().setId('backup-test');
    useTaskStore.getState().setTitle('Backup Title');
    useTaskStore.getState().setQuestion('Backup Question');
    useTaskStore.getState().updateFinalReport('# Backup Report');

    const backup = useTaskStore.getState().backup();

    expect(backup.id).toBe('backup-test');
    expect(backup.title).toBe('Backup Title');

    // Reset and verify clean state
    useTaskStore.getState().reset();
    expect(useTaskStore.getState().id).toBe('');

    // Restore from backup
    useTaskStore.getState().restore(backup);
    const restored = useTaskStore.getState();

    expect(restored.id).toBe('backup-test');
    expect(restored.title).toBe('Backup Title');
    expect(restored.question).toBe('Backup Question');
    expect(restored.finalReport).toBe('# Backup Report');
  });

  it('should maintain task array immutability', async () => {
    const { useTaskStore } = await import('../../src/store/task');

    const task: SearchTask = {
      state: 'unprocessed',
      query: 'test',
      researchGoal: 'goal',
      learning: '',
      sources: [],
      images: [],
    };

    useTaskStore.getState().update([task]);
    const tasks1 = useTaskStore.getState().tasks;

    useTaskStore.getState().updateTask('test', { state: 'completed' });
    const tasks2 = useTaskStore.getState().tasks;

    // Arrays should be different instances
    expect(tasks1).not.toBe(tasks2);
  });
});

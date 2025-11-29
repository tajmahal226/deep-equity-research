import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { requestManager } from '../../src/utils/request-manager';

describe('requestManager.deduplicateRequest', () => {
  beforeEach(() => {
    requestManager.reset();
    vi.useRealTimers();
  });

  afterEach(() => {
    requestManager.reset();
    vi.useRealTimers();
  });

  it('deduplicates identical requests by returning the same promise', async () => {
    vi.useFakeTimers();

    const requestFn = vi.fn((signal: AbortSignal) =>
      new Promise<string>(resolve => {
        signal.addEventListener('abort', () => {
          // Not expected to be called in this test
        });
        setTimeout(() => resolve('result'), 50);
      })
    );

    const firstPromise = requestManager.deduplicateRequest(
      'endpoint',
      { a: 1 },
      requestFn
    );
    const secondPromise = requestManager.deduplicateRequest(
      'endpoint',
      { a: 1 },
      requestFn
    );

    expect(firstPromise).toBe(secondPromise);
    expect(requestFn).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();
    await expect(firstPromise).resolves.toBe('result');
  });

  it('aborts pending requests when abortRequests is invoked', async () => {
    vi.useFakeTimers();

    const abortError = new Error('aborted');
    const requestFn = vi.fn((signal: AbortSignal) =>
      new Promise<string>((resolve, reject) => {
        signal.addEventListener('abort', () => reject(abortError));
        setTimeout(() => resolve('result'), 1000);
      })
    );

    const promise = requestManager.deduplicateRequest(
      'cancel-endpoint',
      { q: 'x' },
      requestFn
    );

    requestManager.abortRequests('cancel-endpoint');

    await expect(promise).rejects.toBe(abortError);
    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestManager.getPendingCount()).toBe(0);

    vi.runAllTimers();
  });

  it('allows new requests after an aborted duplicate', async () => {
    vi.useFakeTimers();

    const abortError = new Error('aborted');
    const requestFn = vi.fn((signal: AbortSignal) =>
      new Promise<string>((resolve, reject) => {
        signal.addEventListener('abort', () => reject(abortError));
        setTimeout(() => resolve('result'), 1000);
      })
    );

    const firstPromise = requestManager.deduplicateRequest(
      'endpoint',
      { retry: 1 },
      requestFn
    );

    requestManager.abortRequests('endpoint');

    await expect(firstPromise).rejects.toBe(abortError);

    const secondPromise = requestManager.deduplicateRequest(
      'endpoint',
      { retry: 2 },
      requestFn
    );

    expect(secondPromise).not.toBe(firstPromise);
    expect(requestFn).toHaveBeenCalledTimes(2);

    await vi.runAllTimersAsync();
    await expect(secondPromise).resolves.toBe('result');
  });

  it('shares abort rejections across deduplicated requests', async () => {
    vi.useFakeTimers();

    const requestFn = vi.fn((signal: AbortSignal) => {
      return new Promise<string>((resolve, reject) => {
        signal.addEventListener('abort', () => {
          const abortError = new Error('Aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });

        setTimeout(() => resolve('finished'), 50);
      });
    });

    const firstPromise = requestManager.deduplicateRequest(
      'endpoint',
      { id: 1 },
      requestFn
    );
    const secondPromise = requestManager.deduplicateRequest(
      'endpoint',
      { id: 1 },
      requestFn
    );

    const resultPromise = Promise.allSettled([firstPromise, secondPromise]);
    requestManager.abortRequests('endpoint');

    await vi.runAllTimersAsync();
    const results = await resultPromise;

    expect(results).toEqual([
      expect.objectContaining({ status: 'rejected' }),
      expect.objectContaining({ status: 'rejected' }),
    ]);
    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestManager.getPendingCount()).toBe(0);
  });

  it('only aborts requests matching the provided endpoint', async () => {
    vi.useFakeTimers();

    const abortedFn = vi.fn((signal: AbortSignal) => {
      return new Promise<string>((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const abortError = new Error('Aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });

        setTimeout(() => reject(new Error('should have aborted')), 50);
      });
    });

    const completedFn = vi.fn((signal: AbortSignal) => {
      return new Promise<string>(resolve => {
        setTimeout(() => resolve('finished'), 50);
        signal.addEventListener('abort', () => {
          resolve('aborted unexpectedly');
        });
      });
    });

    const abortedPromise = requestManager.deduplicateRequest(
      'endpoint',
      { id: 1 },
      abortedFn
    );
    const completedPromise = requestManager.deduplicateRequest(
      'other-endpoint',
      { id: 2 },
      completedFn
    );

    const abortedExpectation = expect(abortedPromise).rejects.toMatchObject({
      name: 'AbortError',
    });
    const completedExpectation = expect(completedPromise).resolves.toBe(
      'finished'
    );
    requestManager.abortRequests('endpoint');

    await abortedExpectation;
    await vi.runAllTimersAsync();
    await completedExpectation;
    expect(abortedFn).toHaveBeenCalledTimes(1);
    expect(completedFn).toHaveBeenCalledTimes(1);
    expect(requestManager.getPendingCount()).toBe(0);
  });
});

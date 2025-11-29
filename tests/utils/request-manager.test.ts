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
});

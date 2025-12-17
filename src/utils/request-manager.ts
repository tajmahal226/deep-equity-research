/**
 * Request Manager for preventing race conditions and duplicate requests
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  abortController?: AbortController;
}

class RequestManager {
  private pendingRequests = new Map<string, PendingRequest>();
  private requestSequence = new Map<string, number>();
  private sequenceLocks = new Map<string, Promise<void>>();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache for duplicate requests

  /**
   * Generate a unique key for a request
   */
  private generateKey(endpoint: string, params: any): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  /**
   * Check if we have a recent identical request
   */
  private hasCachedRequest(key: string): PendingRequest | null {
    const pending = this.pendingRequests.get(key);
    if (!pending) return null;

    const age = Date.now() - pending.timestamp;
    if (age < this.CACHE_DURATION) {
      return pending;
    }

    // Request is too old, remove it
    this.pendingRequests.delete(key);
    return null;
  }

  /**
   * Deduplicate requests - prevents multiple identical requests
   */
  async deduplicateRequest<T>(
    endpoint: string,
    params: any,
    requestFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    const key = this.generateKey(endpoint, params);

    // Check for existing request
    const existing = this.hasCachedRequest(key);
    if (existing) {
      console.log(`[RequestManager] Deduplicating request: ${key}`);
      return existing.promise as Promise<T>;
    }

    // Create new request
    const abortController = new AbortController();
    const promise = requestFn(abortController.signal);
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
      abortController,
    });

    // Clean up after completion
    promise
      .finally(() => {
        // Remove from pending after a short delay to allow deduplication
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, 100);
      })
      .catch(() => {
        // Immediately remove on error
        this.pendingRequests.delete(key);
      });

    return promise;
  }

  /**
   * Ensure requests are processed in sequence
   */
  async sequentialRequest<T>(
    queueName: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const currentSeq = this.requestSequence.get(queueName) || 0;
    const mySeq = currentSeq + 1;
    const activeKey = `${queueName}_active`;
    this.requestSequence.set(queueName, mySeq);

    const previousLock = this.sequenceLocks.get(queueName) || Promise.resolve();
    let release: () => void;
    const currentLock = new Promise<void>(resolve => {
      release = resolve;
    });

    this.sequenceLocks.set(
      queueName,
      previousLock.then(() => currentLock).catch(() => currentLock)
    );

    await previousLock;
    this.requestSequence.set(activeKey, mySeq);

    try {
      return await requestFn();
    } finally {
      this.requestSequence.set(activeKey, mySeq + 1);
      release?.();
    }
  }

  /**
   * Abort all pending requests for a specific endpoint
   */
  abortRequests(endpoint?: string) {
    if (endpoint) {
      // Abort specific endpoint requests
      for (const [key, pending] of this.pendingRequests.entries()) {
        if (key.startsWith(endpoint)) {
          pending.abortController?.abort();
          this.pendingRequests.delete(key);
        }
      }
    } else {
      // Abort all requests
      for (const pending of this.pendingRequests.values()) {
        pending.abortController?.abort();
      }
      this.pendingRequests.clear();
    }
  }

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clear all caches and reset
   */
  reset() {
    this.abortRequests();
    this.requestSequence.clear();
    this.sequenceLocks.clear();
  }

  /**
   * Introspection helper for tests and debugging
   */
  getActiveSequence(queueName: string): number | undefined {
    return this.requestSequence.get(`${queueName}_active`);
  }
}

// Singleton instance
export const requestManager = new RequestManager();

/**
 * Mutex for preventing race conditions in critical sections
 */
export class Mutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];

  async acquire(): Promise<void> {
    while (this.locked) {
      await new Promise<void>(resolve => {
        this.waitQueue.push(resolve);
      });
    }
    this.locked = true;
  }

  release(): void {
    this.locked = false;
    const next = this.waitQueue.shift();
    if (next) {
      next();
    }
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Semaphore for limiting concurrent operations
 */
export class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    await new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }

  async runWithPermit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// Global semaphore for limiting concurrent API calls
export const apiSemaphore = new Semaphore(5); // Max 5 concurrent API calls

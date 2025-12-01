/**
 * Request Manager for preventing race conditions and duplicate requests
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  abortController?: AbortController;
}

/**
 * Request Manager class.
 * Manages deduplication, sequencing, and cancellation of async requests.
 */
class RequestManager {
  private pendingRequests = new Map<string, PendingRequest>();
  private requestSequence = new Map<string, number>();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache for duplicate requests

  /**
   * Generate a unique key for a request.
   *
   * @param endpoint - The API endpoint.
   * @param params - The request parameters.
   * @returns A unique string key.
   */
  private generateKey(endpoint: string, params: any): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  /**
   * Check if we have a recent identical request.
   *
   * @param key - The request key.
   * @returns The pending request if found and fresh, null otherwise.
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
   * Deduplicate requests - prevents multiple identical requests.
   * If an identical request is already pending, returns the existing promise.
   *
   * @param endpoint - The API endpoint.
   * @param params - The request parameters.
   * @param requestFn - The function to execute the request.
   * @returns The result of the request.
   */
  deduplicateRequest<T>(
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
   * Ensure requests are processed in sequence.
   * Waits for previous requests in the queue to complete before starting.
   *
   * @param queueName - The name of the sequence queue.
   * @param requestFn - The function to execute.
   * @returns The result of the request.
   */
  async sequentialRequest<T>(
    queueName: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Get current sequence number
    const currentSeq = this.requestSequence.get(queueName) || 0;
    const mySeq = currentSeq + 1;
    this.requestSequence.set(queueName, mySeq);

    // Wait for previous requests to complete
    while (true) {
      const activeSeq = this.requestSequence.get(queueName + '_active') || 0;
      if (activeSeq < mySeq - 1) {
        // Previous request still running, wait
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        break;
      }
    }

    // Mark this request as active
    this.requestSequence.set(queueName + '_active', mySeq);

    try {
      return await requestFn();
    } finally {
      // Mark as complete
      this.requestSequence.set(queueName + '_active', mySeq + 1);
    }
  }

  /**
   * Abort all pending requests for a specific endpoint or all requests.
   *
   * @param endpoint - Optional endpoint prefix to filter requests to abort.
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
   * Get count of pending requests.
   *
   * @returns Number of pending requests.
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clear all caches and reset.
   */
  reset() {
    this.abortRequests();
    this.requestSequence.clear();
  }
}

// Singleton instance
export const requestManager = new RequestManager();

/**
 * Mutex for preventing race conditions in critical sections.
 */
export class Mutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];

  /**
   * Acquire the lock.
   * Waits if the lock is already held.
   */
  async acquire(): Promise<void> {
    while (this.locked) {
      await new Promise<void>(resolve => {
        this.waitQueue.push(resolve);
      });
    }
    this.locked = true;
  }

  /**
   * Release the lock.
   * Wakes up the next waiting task.
   */
  release(): void {
    this.locked = false;
    const next = this.waitQueue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Run a function exclusively.
   * Acquires the lock, runs the function, and releases the lock.
   *
   * @param fn - The function to run.
   * @returns The result of the function.
   */
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
 * Semaphore for limiting concurrent operations.
 */
export class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  /**
   * Creates a new Semaphore.
   *
   * @param permits - Number of concurrent permits allowed.
   */
  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquire a permit.
   * Waits if no permits are available.
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    await new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release a permit.
   * Wakes up the next waiting task or increments available permits.
   */
  release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }

  /**
   * Run a function with a permit.
   * Acquires a permit, runs the function, and releases the permit.
   *
   * @param fn - The function to run.
   * @returns The result of the function.
   */
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

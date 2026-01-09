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
   *
   * MEMORY LEAK FIX:
   * - Uses a cleanup tracking Map to ensure pending requests are always cleaned up
   * - Cleanup runs immediately on promise settlement (no setTimeout that could fail)
   * - AbortController is properly aborted on cleanup
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

    // Clean up immediately when promise settles (no setTimeout)
    // This ensures cleanup happens even if component unmounts
    const cleanup = () => {
      this.pendingRequests.delete(key);
      // Abort the controller if the request is still pending
      if (!this.isPromiseSettled(promise)) {
        abortController.abort();
      }
    };

    promise.then(cleanup, cleanup);

    return promise;
  }

  /**
   * Check if a promise has settled (resolved or rejected)
   * This is a heuristic check - returns false if we can't determine state
   */
  private isPromiseSettled(promise: Promise<any>): boolean {
    // We can't reliably check promise state in JS,
    // but we can track it via a wrapper if needed.
    // For now, assume not settled - abort will be no-op if already done.
    return false;
  }

  /**
   * Ensure requests are processed in sequence
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
    const activeKey = `${queueName}_active`;
    while (true) {
      const activeSeq = this.requestSequence.get(activeKey) || 0;
      if (activeSeq < mySeq - 1) {
        // Previous requests have not finished; wait until the last completed
        // sequence is strictly behind this request's sequence number.
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        break;
      }
    }

    try {
      return await requestFn();
    } finally {
      // Mark as complete. `_active` always reflects the latest finished
      // sequence to prevent later callers from advancing before prior
      // requests resolve.
      this.requestSequence.set(activeKey, mySeq);
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

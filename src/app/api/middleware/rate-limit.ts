/**
 * Rate limiting middleware for API routes
 *
 * MEMORY LEAK FIX:
 * - Added MAX_ENTRIES to prevent unbounded Map growth
 * - Proactive cleanup during each request (not just periodic)
 * - Removed module-level setInterval (problematic in Next.js serverless)
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  AI_PROXY: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  CRAWLER: { maxRequests: 20, windowMs: 60000 },   // 20 requests per minute
  SSE: { maxRequests: 50, windowMs: 60000 },       // 50 requests per minute
  DEFAULT: { maxRequests: 60, windowMs: 60000 },   // 60 requests per minute
} as const;

// Maximum number of unique entries to track (prevents unbounded memory growth)
const MAX_ENTRIES = 10000;

// Cleanup threshold: perform full cleanup when Map reaches this size
const CLEANUP_THRESHOLD = 5000;

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private lastCleanup: number = Date.now();
  private cleanupInterval: number = 60000; // 1 minute

  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();

    // Periodic proactive cleanup (prevents memory leak)
    if (this.requests.size > CLEANUP_THRESHOLD || now - this.lastCleanup > this.cleanupInterval) {
      this.performCleanup(now);
    }

    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    // Evict oldest entries if we exceed max (LRU-style)
    if (this.requests.size > MAX_ENTRIES) {
      this.evictOldestEntries();
    }

    return true;
  }

  reset(key: string) {
    this.requests.delete(key);
  }

  /**
   * Full cleanup pass - removes expired entries and enforces max size
   */
  private performCleanup(now: number) {
    this.lastCleanup = now;

    // Remove entries with no valid timestamps (older than 5 minutes)
    const staleThreshold = 300000; // 5 minutes
    const entriesToDelete: string[] = [];

    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => now - t < staleThreshold);
      if (valid.length === 0) {
        entriesToDelete.push(key);
      } else if (valid.length !== timestamps.length) {
        this.requests.set(key, valid);
      }
    }

    // Delete stale entries
    for (const key of entriesToDelete) {
      this.requests.delete(key);
    }
  }

  /**
   * Remove oldest entries when max size is exceeded
   * Uses a simple FIFO approach (first keys in Map are oldest)
   */
  private evictOldestEntries() {
    const entries = Array.from(this.requests.entries());
    // Sort by oldest timestamp in each entry
    entries.sort((a, b) => {
      const aOldest = a[1][0] ?? Infinity;
      const bOldest = b[1][0] ?? Infinity;
      return aOldest - bOldest;
    });

    // Remove oldest 10% of entries
    const toRemove = Math.floor(MAX_ENTRIES * 0.1);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.requests.delete(entries[i][0]);
    }
  }

  /**
   * Get current stats (useful for monitoring)
   */
  getStats() {
    return {
      totalEntries: this.requests.size,
      maxEntries: MAX_ENTRIES,
      lastCleanup: new Date(this.lastCleanup).toISOString(),
    };
  }

  /**
   * Manual cleanup method (can be called externally if needed)
   */
  cleanup() {
    this.performCleanup(Date.now());
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware for API routes
 */
export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT
): NextResponse | null {
  // Get client identifier (IP or a header)
  const identifier =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const key = `${identifier}:${req.nextUrl.pathname}`;

  if (!rateLimiter.isAllowed(key, config.maxRequests, config.windowMs)) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(config.windowMs / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(config.windowMs / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  return null; // Allow request
}

export { rateLimiter };

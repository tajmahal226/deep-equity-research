/**
 * Rate limiting middleware for API routes
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

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }
  
  reset(key: string) {
    this.requests.delete(key);
  }
  
  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => now - t < 300000); // 5 min window
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

// Periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 300000);
}

/**
 * Rate limit middleware for API routes
 */
export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT
): NextResponse | null {
  // Get client identifier (IP or a header)
  const identifier = 
    req.headers.get('x-forwarded-for') ||
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

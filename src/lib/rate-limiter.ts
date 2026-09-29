import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  /** Time window in seconds */
  windowSeconds?: number;
  /** Maximum allowed requests within the window */
  maxRequests?: number;
  /** Route or action namespace */
  namespace?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeSeconds: number;
  retryAfterSeconds: number;
}

/**
 * Check and record a rate limit hit for a given key
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    windowSeconds = 60,
    maxRequests = 30,
    namespace = 'global',
  } = options;

  const storageKey = `${namespace}:${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = rateLimitStore.get(storageKey);

  if (!record || now > record.resetAt) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(storageKey, record);
    return {
      allowed: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      resetTimeSeconds: Math.ceil(record.resetAt / 1000),
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetTimeSeconds: Math.ceil(record.resetAt / 1000),
      retryAfterSeconds: retryAfter,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    resetTimeSeconds: Math.ceil(record.resetAt / 1000),
    retryAfterSeconds: 0,
  };
}

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }
  return '127.0.0.1';
}

import 'server-only';
import { RateLimitError } from '@/lib/errors';

/**
 * Simple fixed-window, in-memory rate limiter.
 *
 * Good enough for a single Node.js server (our deployment target). If ErHub
 * is ever run on several instances, swap the Map for Redis — callers only use
 * `rateLimit()` so nothing else changes.
 */
type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as { erhubRateLimit?: Map<string, Bucket> };
const store = (globalStore.erhubRateLimit ??= new Map<string, Bucket>());

export type RateLimitOptions = { limit: number; windowMs: number };

export function checkRateLimit(key: string, { limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) return { allowed: false, remaining: 0 };

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

/** Throws a RateLimitError when the key has exceeded its budget. */
export function rateLimit(key: string, options: RateLimitOptions) {
  if (!checkRateLimit(key, options).allowed) throw new RateLimitError();
}

export const RATE_LIMITS = {
  login: { limit: 8, windowMs: 60_000 },
  register: { limit: 5, windowMs: 10 * 60_000 },
  upload: { limit: 30, windowMs: 60_000 },
  mutation: { limit: 60, windowMs: 60_000 },
} satisfies Record<string, RateLimitOptions>;

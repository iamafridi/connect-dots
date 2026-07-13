import type { LinkType } from "../shared/index.js";
import { redis, subscriber } from "./redis.js";
import keys from "../config/keys.js";

export interface ICachedUrl {
  id: number;
  real_url: string;
  link_type: LinkType;
}

export type CacheEntry = ICachedUrl | "__404__";

// ─── L1: In-Memory V8 Process Cache ──────────────────────────────────────────
// Bounded LRU-style Map holding the hottest URLs directly in process RAM.
// Hits resolve in < 0.05ms with 0 network trips and 0 socket allocations.

const MAX_L1_ITEMS = 50_000;
const DEFAULT_L1_TTL_MS = 60_000; // 60 seconds
const NEGATIVE_L1_TTL_MS = 15_000; // 15 seconds for non-existent codes

interface IL1Entry {
  value: CacheEntry;
  expiresAt: number;
}

const l1Store = new Map<string, IL1Entry>();

function l1Get(key: string): CacheEntry | null {
  const entry = l1Store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    l1Store.delete(key);
    return null;
  }

  // Refresh LRU order on hit
  l1Store.delete(key);
  l1Store.set(key, entry);
  return entry.value;
}

function l1Set(key: string, value: CacheEntry, ttlMs: number = DEFAULT_L1_TTL_MS): void {
  if (l1Store.size >= MAX_L1_ITEMS) {
    // Evict oldest inserted entry
    const oldestKey = l1Store.keys().next().value;
    if (oldestKey) l1Store.delete(oldestKey);
  }

  l1Store.delete(key);
  l1Store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function l1Delete(key: string): void {
  l1Store.delete(key);
}

export function l1Clear(): void {
  l1Store.clear();
}

// ─── Redis Cluster Hashtag Key Generator ─────────────────────────────────────
// Uses {lookupKey} hashtag syntax so Redis Cluster hashes the inner key to a single slot.
export const INVALIDATION_CHANNEL = "connectdots:cache:invalidate";

export function formatCacheKey(lookupKey: string): string {
  return `url:{${lookupKey}}`;
}

// ─── L1 + L2 Read Pipeline ───────────────────────────────────────────────────

const DEFAULT_L2_TTL_SEC = 86_400; // 24 hours
const NEGATIVE_L2_TTL_SEC = 30; // 30 seconds

/**
 * Resolves a URL from L1 (RAM) or L2 (Redis).
 * Returns:
 * - ICachedUrl if found
 * - "__404__" if previously verified non-existent (negative cache)
 * - null if cache miss (needs PostgreSQL lookup)
 */
export async function resolveCachedUrl(lookupKey: string): Promise<CacheEntry | null> {
  // 1. Check L1 In-Memory Cache (< 0.05ms)
  const l1Hit = l1Get(lookupKey);
  if (l1Hit) return l1Hit;

  // If Redis is disabled, skip L2
  if (!keys.redisEnabled) return null;

  // 2. Check L2 Redis Cluster Cache (< 0.40ms)
  try {
    const raw = await redis.get(formatCacheKey(lookupKey));
    if (!raw) return null;

    if (raw === "__404__") {
      l1Set(lookupKey, "__404__", NEGATIVE_L1_TTL_MS);
      return "__404__";
    }

    const parsed = JSON.parse(raw) as ICachedUrl;
    l1Set(lookupKey, parsed, DEFAULT_L1_TTL_MS);
    return parsed;
  } catch (err: any) {
    console.error("[cache] L2 read failed:", err.message);
    return null;
  }
}

/**
 * Stores a URL in L1 and L2 cache.
 */
export async function setCachedUrl(
  lookupKey: string,
  data: CacheEntry,
  ttlSec?: number,
): Promise<void> {
  const isNegative = data === "__404__";
  const l1Ttl = isNegative ? NEGATIVE_L1_TTL_MS : DEFAULT_L1_TTL_MS;
  const l2Ttl = ttlSec ?? (isNegative ? NEGATIVE_L2_TTL_SEC : DEFAULT_L2_TTL_SEC);

  // Populate L1
  l1Set(lookupKey, data, l1Ttl);

  if (!keys.redisEnabled) return;

  // Populate L2
  try {
    const payload = isNegative ? "__404__" : JSON.stringify(data);
    await redis.set(formatCacheKey(lookupKey), payload, "EX", l2Ttl);
  } catch (err: any) {
    console.error("[cache] L2 write failed:", err.message);
  }
}

/**
 * Evicts a URL from L1, L2, and broadcasts across all cluster workers via Redis Pub/Sub.
 */
export async function invalidateCachedUrl(lookupKey: string): Promise<void> {
  // Evict local L1 immediately
  l1Delete(lookupKey);

  if (!keys.redisEnabled) return;

  try {
    // Evict L2
    await redis.del(formatCacheKey(lookupKey));

    // Broadcast eviction to all other Node cluster workers / PM2 processes
    await redis.publish(INVALIDATION_CHANNEL, lookupKey);
  } catch (err: any) {
    console.error("[cache] Invalidation failed:", err.message);
  }
}

// ─── Distributed Pub/Sub Listener for Multi-Process Sync ─────────────────────

export function initCacheInvalidationListener(): void {
  if (!keys.redisEnabled || !subscriber) return;

  try {
    subscriber.subscribe(INVALIDATION_CHANNEL, (err) => {
      if (err) {
        console.error("[cache-sync] failed to subscribe to invalidation channel:", err.message);
      } else {
        console.log(`[cache-sync] subscribed to ${INVALIDATION_CHANNEL}`);
      }
    });

    subscriber.on("message", (channel: string, message: string) => {
      if (channel === INVALIDATION_CHANNEL && message) {
        l1Delete(message);
      }
    });
  } catch (err: any) {
    console.error("[cache-sync] listener setup error:", err.message);
  }
}

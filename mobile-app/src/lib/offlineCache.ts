/**
 * offlineCache.ts
 * AsyncStorage-backed offline cache for the SmartDTC mobile app.
 * Uses @react-native-community/netinfo to detect connectivity and
 * serves stale data when the device is offline.
 *
 * Usage:
 *   import { cachedGet, invalidate } from '@/lib/offlineCache';
 *   const routes = await cachedGet('/public/routes', 300);   // TTL 5 min
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '@/lib/api';

const CACHE_PREFIX = '@smartdtc_cache:';

interface CacheEntry<T> {
  data:      T;
  timestamp: number;  // Unix ms
  ttl:       number;  // seconds
}

const cacheKey = (url: string) => `${CACHE_PREFIX}${url}`;

/** Write data to AsyncStorage cache */
const writeCache = async <T>(url: string, data: T, ttlSeconds: number): Promise<void> => {
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlSeconds };
  await AsyncStorage.setItem(cacheKey(url), JSON.stringify(entry));
};

/** Read cached data — returns null if missing or expired */
const readCache = async <T>(url: string): Promise<{ data: T; stale: boolean } | null> => {
  const raw = await AsyncStorage.getItem(cacheKey(url));
  if (!raw) return null;

  const entry: CacheEntry<T> = JSON.parse(raw);
  const ageSeconds = (Date.now() - entry.timestamp) / 1000;
  const stale      = ageSeconds > entry.ttl;

  return { data: entry.data, stale };
};

/**
 * Fetch with offline fallback.
 *  - If online: fetches fresh data, caches it, and returns it.
 *  - If offline (or fetch fails): returns stale cached data if available.
 *
 * @param url         API path relative to base URL (e.g. '/public/routes')
 * @param ttlSeconds  How long to consider the cache fresh (default 300 s = 5 min)
 * @param params      Optional axios query params
 */
export const cachedGet = async <T = any>(
  url: string,
  ttlSeconds = 300,
  params?: Record<string, any>
): Promise<{ data: T; fromCache: boolean }> => {
  const net = await NetInfo.fetch();
  const isOnline = net.isConnected && net.isInternetReachable !== false;

  if (isOnline) {
    try {
      const res = await api.get<T>(url, { params });
      await writeCache(url, res.data, ttlSeconds);
      return { data: res.data, fromCache: false };
    } catch {
      // Network call failed — fall through to cache
    }
  }

  const cached = await readCache<T>(url);
  if (cached) {
    return { data: cached.data, fromCache: true };
  }

  throw new Error(`No cached data for ${url} and device is offline.`);
};

/**
 * Invalidate a single cache entry.
 */
export const invalidate = async (url: string): Promise<void> => {
  await AsyncStorage.removeItem(cacheKey(url));
};

/**
 * Clear ALL SmartDTC cache entries.
 */
export const clearAllCache = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  const dtcKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
  if (dtcKeys.length) await AsyncStorage.multiRemove(dtcKeys);
};

/**
 * Pre-fetch a list of URLs and warm the cache (useful on app launch).
 * @param urls  Array of { url, ttl } objects
 */
export const warmCache = async (urls: { url: string; ttl?: number }[]): Promise<void> => {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  await Promise.allSettled(
    urls.map(({ url, ttl = 300 }) => cachedGet(url, ttl))
  );
};

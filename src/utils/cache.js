/**
 * In-memory client cache with TTL (Time-To-Live).
 * Eliminates redundant HTTP requests and waterfall latency during client-side page transitions.
 */

const memoryCache = new Map();

/**
 * Fetch data using in-memory cache if fresh.
 * @param {string} key - Unique cache key
 * @param {Function} fetcher - Async function that fetches data if not in cache
 * @param {number} ttlMs - Cache duration in milliseconds (default 60 seconds)
 * @returns {Promise<any>}
 */
export async function fetchWithCache(key, fetcher, ttlMs = 60000) {
    const cached = memoryCache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp < ttlMs)) {
        return cached.data;
    }

    const data = await fetcher();
    memoryCache.set(key, { data, timestamp: Date.now() });
    return data;
}

/**
 * Invalidate cached items matching a key or prefix.
 * Call this when mutating data (e.g. creating/updating/deleting courses or students).
 * @param {string} [keyPrefix] - Prefix to match, or omit to clear all cache
 */
export function invalidateCache(keyPrefix) {
    if (!keyPrefix) {
        memoryCache.clear();
        return;
    }
    for (const key of memoryCache.keys()) {
        if (key.startsWith(keyPrefix)) {
            memoryCache.delete(key);
        }
    }
}

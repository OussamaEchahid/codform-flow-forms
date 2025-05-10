
/**
 * Simple client-side data caching utility
 */

interface CacheOptions {
  ttl?: number;  // Time to live in milliseconds
}

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

export const dataCache = {
  /**
   * Store data in the cache
   */
  set: <T>(key: string, data: T, options?: CacheOptions): void => {
    try {
      const ttl = options?.ttl || DEFAULT_TTL;
      const expires = Date.now() + ttl;
      const entry: CacheEntry<T> = { data, expires };
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error('Error storing data in cache:', error);
    }
  },

  /**
   * Get data from the cache
   */
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`cache:${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      if (Date.now() > entry.expires) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error retrieving data from cache:', error);
      return null;
    }
  },

  /**
   * Clear specific cache entry
   */
  clear: (key: string): void => {
    localStorage.removeItem(`cache:${key}`);
  },

  /**
   * Clear all cache entries or entries with a specific prefix
   */
  clearAll: (prefix?: string): void => {
    try {
      const keys = Object.keys(localStorage);
      const cachePrefix = 'cache:';
      const fullPrefix = prefix ? `${cachePrefix}${prefix}` : cachePrefix;

      keys.forEach(key => {
        if (key.startsWith(fullPrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
};

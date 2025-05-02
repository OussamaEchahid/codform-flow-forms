
/**
 * Request manager utility for handling concurrent requests and caching
 */

// Default timeout durations
export const DEFAULT_CACHE_TTL = 60000; // 1 minute
export const DEFAULT_THROTTLE_TIME = 5000; // 5 seconds
export const DEFAULT_DEBOUNCE_TIME = 500; // 0.5 seconds

/**
 * Creates a request tracker object to manage request states
 */
export const createRequestTracker = () => {
  const activeRequests: Record<string, boolean> = {};
  const requestTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
  
  /**
   * Check if a request with the given key is in progress
   */
  const isInProgress = (key: string): boolean => {
    return !!activeRequests[key];
  };
  
  /**
   * Track the start/end of a request and manage debounce timeouts
   */
  const trackRequest = (key: string, inProgress: boolean, debounceTime = DEFAULT_DEBOUNCE_TIME) => {
    if (inProgress) {
      activeRequests[key] = true;
    } else {
      if (requestTimeouts[key]) {
        clearTimeout(requestTimeouts[key]);
      }
      
      requestTimeouts[key] = setTimeout(() => {
        activeRequests[key] = false;
        delete requestTimeouts[key];
      }, debounceTime);
    }
  };
  
  /**
   * Clear all pending request timeouts
   */
  const clearAllTimeouts = () => {
    Object.values(requestTimeouts).forEach(timeout => {
      clearTimeout(timeout);
    });
  };
  
  return {
    isInProgress,
    trackRequest,
    clearAllTimeouts
  };
};

/**
 * Creates a cache manager for storing and retrieving data with TTL
 */
export const createCacheManager = <T>() => {
  const cache: Record<string, { data: T | null; timestamp: number }> = {};
  
  /**
   * Set data in the cache with the current timestamp
   */
  const set = (key: string, data: T | null) => {
    cache[key] = {
      data,
      timestamp: Date.now()
    };
  };
  
  /**
   * Get data from cache if it exists and is not expired
   */
  const get = (key: string, ttl = DEFAULT_CACHE_TTL): { data: T | null; expired: boolean } => {
    const entry = cache[key];
    
    if (!entry) {
      return { data: null, expired: true };
    }
    
    const expired = Date.now() - entry.timestamp > ttl;
    
    return {
      data: entry.data,
      expired
    };
  };
  
  /**
   * Clear a specific cache entry or all entries
   */
  const clear = (key?: string) => {
    if (key) {
      delete cache[key];
    } else {
      Object.keys(cache).forEach(k => delete cache[k]);
    }
  };
  
  return {
    set,
    get,
    clear
  };
};

/**
 * Helper to handle offline data storage and retrieval
 */
export const offlineStorage = {
  /**
   * Save data to offline storage
   */
  save: <T>(key: string, data: T): boolean => {
    try {
      const existingData = offlineStorage.get<T[]>(key) || [];
      existingData.push({
        ...data,
        offlineTimestamp: Date.now()
      });
      localStorage.setItem(key, JSON.stringify(existingData));
      return true;
    } catch (error) {
      console.error(`Error saving offline data for ${key}:`, error);
      return false;
    }
  },
  
  /**
   * Get data from offline storage
   */
  get: <T>(key: string): T | null => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error retrieving offline data for ${key}:`, error);
      return null;
    }
  },
  
  /**
   * Clear offline storage for a key
   */
  clear: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error clearing offline data for ${key}:`, error);
      return false;
    }
  }
};

/**
 * Create a throttled function that only executes once within the specified time window
 */
export const createThrottled = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = DEFAULT_THROTTLE_TIME
) => {
  let lastCall = 0;
  let lastResult: ReturnType<T>;
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const now = Date.now();
    
    if (now - lastCall >= wait) {
      lastCall = now;
      lastResult = func(...args);
    }
    
    return lastResult;
  };
};

// أداة لتقليل استدعاءات API وإدارة الـ cache

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class APIThrottle {
  private cache = new Map<string, CacheItem<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly defaultCacheDuration = 5 * 60 * 1000; // 5 دقائق

  // إنشاء مفتاح فريد للـ cache
  private createCacheKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }

  // تحقق من وجود بيانات في الـ cache
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.defaultCacheDuration) {
      this.cache.delete(key);
      return null;
    }

    console.log(`Using cached data for: ${key}`);
    return cached.data;
  }

  // حفظ البيانات في الـ cache
  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // تنفيذ الطلب مع منع التكرار
  async throttledRequest<T>(
    endpoint: string,
    requestFunction: () => Promise<T>,
    params?: any,
    cacheDuration?: number
  ): Promise<T> {
    const cacheKey = this.createCacheKey(endpoint, params);

    // تحقق من الـ cache أولاً
    const cachedData = this.getCachedData<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // تحقق من وجود طلب مماثل قيد التنفيذ
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      console.log(`Waiting for pending request: ${cacheKey}`);
      return pendingRequest;
    }

    // إنشاء طلب جديد
    const request = requestFunction();
    this.pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error);
      throw error;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  // محو الـ cache
  clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(pattern)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  // الحصول على إحصائيات الـ cache
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const apiThrottle = new APIThrottle();
import { useState, useEffect } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface FormCacheConfig {
  duration: number; // مدة الـ cache بالملي ثانية
  key: string; // مفتاح التخزين
}

export function useFormCache<T>(
  config: FormCacheConfig,
  fetchFunction: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // قراءة من الـ cache
  const getCachedData = (): T | null => {
    try {
      const cached = sessionStorage.getItem(config.key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      
      // تحقق من انتهاء صلاحية الـ cache
      if (now - cacheItem.timestamp > config.duration) {
        sessionStorage.removeItem(config.key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  // حفظ في الـ cache
  const setCachedData = (data: T) => {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(config.key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  // تحميل البيانات
  const loadData = async (forceRefresh = false) => {
    if (loading) return;

    // تحقق من الـ cache أولاً
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      setData(result);
      setCachedData(result);
    } catch (err: any) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // محو الـ cache
  const clearCache = () => {
    sessionStorage.removeItem(config.key);
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    loading,
    error,
    loadData,
    clearCache
  };
}
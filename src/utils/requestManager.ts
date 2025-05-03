
/**
 * مدير الطلبات - أدوات لتتبع ومنع الطلبات المتكررة والتخزين المؤقت
 */

export const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 دقائق
export const DEFAULT_THROTTLE_TIME = 30 * 1000; // 30 ثانية

// إنشاء متتبع للطلبات لتجنب الطلبات المتكررة
export const createRequestTracker = () => {
  const inProgressRequests: Record<string, boolean> = {};
  const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  return {
    // تتبع حالة الطلب
    trackRequest: (key: string, inProgress: boolean) => {
      inProgressRequests[key] = inProgress;
      if (!inProgress) {
        // إضافة تأخير صغير قبل إزالة حالة "في التقدم" لمنع الطلبات المتزامنة
        timeouts[`track_${key}`] = setTimeout(() => {
          inProgressRequests[key] = false;
        }, 100);
      }
    },
    
    // التحقق مما إذا كان الطلب قيد التنفيذ
    isInProgress: (key: string) => {
      return !!inProgressRequests[key];
    },
    
    // إعادة تعيين حالة الطلب
    reset: (key?: string) => {
      if (key) {
        inProgressRequests[key] = false;
      } else {
        Object.keys(inProgressRequests).forEach((k) => {
          inProgressRequests[k] = false;
        });
      }
    },
    
    // مسح جميع المهلات
    clearAllTimeouts: () => {
      Object.keys(timeouts).forEach((key) => {
        if (timeouts[key]) {
          clearTimeout(timeouts[key]);
        }
      });
    }
  };
};

// مدير التخزين المؤقت للبيانات
interface CachedData<T> {
  data: T;
  timestamp: number;
  expired: boolean;
}

export const createCacheManager = <T>() => {
  const cache: Record<string, any> = {};

  return {
    // حفظ البيانات في التخزين المؤقت
    set: (key: string, data: T) => {
      cache[key] = {
        data,
        timestamp: Date.now(),
      };
    },
    
    // الحصول على البيانات من التخزين المؤقت
    get: (key: string, ttl: number = DEFAULT_CACHE_TTL): CachedData<T> => {
      const cachedItem = cache[key];
      
      if (!cachedItem) {
        return {
          data: null as T,
          timestamp: 0,
          expired: true,
        };
      }
      
      const now = Date.now();
      const isExpired = now - cachedItem.timestamp > ttl;
      
      return {
        ...cachedItem,
        expired: isExpired,
      };
    },
    
    // مسح عناصر محددة أو كل التخزين المؤقت
    clear: (key?: string) => {
      if (key) {
        delete cache[key];
      } else {
        Object.keys(cache).forEach((k) => {
          delete cache[k];
        });
      }
    },
    
    // تحديث توقيت العنصر فقط دون تغيير البيانات
    touch: (key: string) => {
      if (cache[key]) {
        cache[key].timestamp = Date.now();
      }
    }
  };
};

// مساعد لتحسين إدارة التخزين المحلي
export const createStorageHelper = (prefix: string = 'app_') => {
  return {
    set: (key: string, value: any) => {
      try {
        const fullKey = `${prefix}${key}`;
        const stringValue = JSON.stringify(value);
        localStorage.setItem(fullKey, stringValue);
        return true;
      } catch (error) {
        console.error('خطأ في حفظ البيانات في التخزين المحلي:', error);
        return false;
      }
    },
    
    get: <T>(key: string, defaultValue?: T): T | null => {
      try {
        const fullKey = `${prefix}${key}`;
        const value = localStorage.getItem(fullKey);
        return value ? JSON.parse(value) : defaultValue || null;
      } catch (error) {
        console.error('خطأ في قراءة البيانات من التخزين المحلي:', error);
        return defaultValue || null;
      }
    },
    
    remove: (key: string) => {
      try {
        const fullKey = `${prefix}${key}`;
        localStorage.removeItem(fullKey);
        return true;
      } catch (error) {
        console.error('خطأ في حذف البيانات من التخزين المحلي:', error);
        return false;
      }
    }
  };
};

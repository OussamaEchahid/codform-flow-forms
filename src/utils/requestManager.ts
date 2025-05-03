
/**
 * مدير الطلبات - أدوات لتتبع ومنع الطلبات المتكررة والتخزين المؤقت
 */

export const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 دقائق
export const DEFAULT_THROTTLE_TIME = 30 * 1000; // 30 ثانية

// إنشاء متتبع للطلبات لتجنب الطلبات المتكررة
export const createRequestTracker = () => {
  const inProgressRequests: Record<string, boolean> = {};
  const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};
  const lastRequestTime: Record<string, number> = {};

  return {
    // تتبع حالة الطلب
    trackRequest: (key: string, inProgress: boolean) => {
      inProgressRequests[key] = inProgress;
      
      // سجل وقت آخر طلب
      if (inProgress) {
        lastRequestTime[key] = Date.now();
      }
      
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
    
    // الحصول على وقت آخر طلب
    getLastRequestTime: (key: string) => {
      return lastRequestTime[key] || 0;
    },
    
    // التحقق مما إذا كان ينبغي تقييد الطلب
    shouldThrottle: (key: string, throttleTime: number = DEFAULT_THROTTLE_TIME) => {
      const lastTime = lastRequestTime[key] || 0;
      return (Date.now() - lastTime) < throttleTime;
    },
    
    // إعادة تعيين حالة الطلب
    reset: (key?: string) => {
      if (key) {
        inProgressRequests[key] = false;
        delete lastRequestTime[key];
      } else {
        Object.keys(inProgressRequests).forEach((k) => {
          inProgressRequests[k] = false;
        });
        Object.keys(lastRequestTime).forEach((k) => {
          delete lastRequestTime[k];
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
  const expiryTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  return {
    // حفظ البيانات في التخزين المؤقت
    set: (key: string, data: T, ttl: number = DEFAULT_CACHE_TTL) => {
      // مسح المهلة السابقة إذا كانت موجودة
      if (expiryTimeouts[key]) {
        clearTimeout(expiryTimeouts[key]);
      }
      
      cache[key] = {
        data,
        timestamp: Date.now(),
      };
      
      // وضع مؤقت لتنظيف البيانات القديمة
      expiryTimeouts[key] = setTimeout(() => {
        // تعيين الحالة كمنتهية الصلاحية ولكن لا تحذفها
        // سيتم حذفها عند الاستبدال فقط
        if (cache[key]) {
          cache[key].expired = true;
        }
      }, ttl);
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
        expired: isExpired || !!cachedItem.expired,
      };
    },
    
    // مسح عناصر محددة أو كل التخزين المؤقت
    clear: (key?: string) => {
      if (key) {
        delete cache[key];
        if (expiryTimeouts[key]) {
          clearTimeout(expiryTimeouts[key]);
          delete expiryTimeouts[key];
        }
      } else {
        Object.keys(cache).forEach((k) => {
          delete cache[k];
        });
        Object.keys(expiryTimeouts).forEach((k) => {
          clearTimeout(expiryTimeouts[k]);
          delete expiryTimeouts[k];
        });
      }
    },
    
    // تحديث توقيت العنصر فقط دون تغيير البيانات
    touch: (key: string) => {
      if (cache[key]) {
        cache[key].timestamp = Date.now();
        cache[key].expired = false;
        
        // تحديث مهلة انتهاء الصلاحية
        if (expiryTimeouts[key]) {
          clearTimeout(expiryTimeouts[key]);
        }
        
        expiryTimeouts[key] = setTimeout(() => {
          if (cache[key]) {
            cache[key].expired = true;
          }
        }, DEFAULT_CACHE_TTL);
      }
    },
    
    // إلغاء المهلات عند التنظيف
    dispose: () => {
      Object.keys(expiryTimeouts).forEach(key => {
        if (expiryTimeouts[key]) {
          clearTimeout(expiryTimeouts[key]);
        }
      });
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
    },
    
    // مسح جميع المفاتيح التي تبدأ بالبادئة المحددة
    clearAll: () => {
      try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        return true;
      } catch (error) {
        console.error('خطأ في مسح التخزين المحلي:', error);
        return false;
      }
    }
  };
};

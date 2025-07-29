// Store Manager - وحدة مركزية لإدارة المتاجر
// لحل مشكلة التضارب بين localStorage keys المختلفة

export class StoreManager {
  // إعداد مفتاح واحد موحد لجميع المتاجر
  private static readonly PRIMARY_KEY = 'active_shopify_store';
  private static readonly LEGACY_KEYS = [
    'current_shopify_store',
    'shopify_store',
    'shopify_active_store',
    'activeShopId',
    'simple_active_store',
    'shopify_temp_store'
  ];

  // الحصول على المتجر النشط مع آلية تنظيف شاملة
  static getActiveStore(): string | null {
    try {
      console.log('🔍 StoreManager: Getting active store...');
      
      // أولاً جرب المفتاح الرئيسي
      const primaryStore = localStorage.getItem(this.PRIMARY_KEY);
      if (primaryStore && primaryStore.trim()) {
        console.log('✅ Found primary store:', primaryStore);
        // تأكد من تنظيف المفاتيح القديمة
        this.cleanupLegacyKeys();
        return primaryStore.trim();
      }

      // إذا لم يوجد، جرب المفاتيح القديمة
      for (const key of this.LEGACY_KEYS) {
        const store = localStorage.getItem(key);
        if (store && store.trim()) {
          console.log(`🔄 Found store in legacy key "${key}":`, store);
          // انقل إلى المفتاح الرئيسي وامسح القديمة
          this.setActiveStore(store.trim());
          return store.trim();
        }
      }

      console.log('⚠️ No active store found');
      return null;
    } catch (error) {
      console.error('❌ Error getting active store:', error);
      return null;
    }
  }

  // تعيين المتجر النشط مع تنظيف شامل
  static setActiveStore(store: string): void {
    try {
      if (!store || !store.trim()) {
        console.warn('⚠️ Attempting to set empty store');
        return;
      }

      const normalizedStore = store.trim();
      console.log('🔄 Setting active store:', normalizedStore);
      
      // تنظيف شامل قبل التعيين
      this.cleanupAll();
      
      // تعيين في المفتاح الرئيسي
      localStorage.setItem(this.PRIMARY_KEY, normalizedStore);
      
      // تعيين في المفاتيح المطلوبة للتوافق
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_connection_status', 'connected');
      
      console.log('✅ Store set successfully:', normalizedStore);
      
      // إطلاق حدث للتحديث
      window.dispatchEvent(new CustomEvent('storeChanged', { 
        detail: { store: normalizedStore } 
      }));
      
      // إطلاق حدث إضافي لضمان التحديث
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('shopifyStoreChanged', { 
          detail: { activeStore: normalizedStore } 
        }));
      }, 100);
      
    } catch (error) {
      console.error('❌ Error setting active store:', error);
    }
  }

  // مسح المتجر النشط بشكل شامل
  static clearActiveStore(): void {
    try {
      console.log('🧹 Clearing active store...');
      
      // تنظيف شامل لجميع البيانات
      this.cleanupAll();
      
      console.log('✅ Store cleared successfully');
      
      // إطلاق حدث للتحديث
      window.dispatchEvent(new CustomEvent('storeChanged', { 
        detail: { store: null } 
      }));
      
      window.dispatchEvent(new CustomEvent('shopifyStoreChanged', { 
        detail: { activeStore: null } 
      }));
    } catch (error) {
      console.error('❌ Error clearing active store:', error);
    }
  }

  // التحقق من صحة المتجر
  static isValidStore(store: string): boolean {
    if (!store || !store.trim()) return false;
    
    // التحقق من تنسيق متجر Shopify
    const shopifyPattern = /^[a-zA-Z0-9\-]+\.myshopify\.com$/;
    return shopifyPattern.test(store.trim());
  }

  // تنظيف شامل لجميع البيانات المتعلقة بالمتجر
  static cleanup(): void {
    this.cleanupAll();
  }

  // دالة تنظيف شاملة ومحسنة
  private static cleanupAll(): void {
    try {
      console.log('🧹 Starting comprehensive cleanup...');
      
      // إزالة جميع مفاتيح المتاجر
      localStorage.removeItem(this.PRIMARY_KEY);
      this.LEGACY_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });

      // إزالة بيانات الاتصال
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_connection_status');
      localStorage.removeItem('shopify_connection_timestamp');
      
      // إزالة حالات الخطأ والتعافي
      localStorage.removeItem('shopify_last_error');
      localStorage.removeItem('shopify_recovery_attempt');
      localStorage.removeItem('shopify_failsafe');
      
      // إزالة بيانات مؤقتة أخرى
      localStorage.removeItem('shopify_connecting');
      localStorage.removeItem('shopify_connection_success');
      localStorage.removeItem('shopify_token_error');
      
      console.log('✅ Comprehensive cleanup completed');
    } catch (error) {
      console.error('❌ Error during comprehensive cleanup:', error);
    }
  }

  // تنظيف المفاتيح القديمة فقط
  private static cleanupLegacyKeys(): void {
    try {
      this.LEGACY_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🧹 Legacy keys cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning legacy keys:', error);
    }
  }

  // مراقب للتغييرات
  static onStoreChange(callback: (store: string | null) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail.store);
    };

    window.addEventListener('storeChanged', handler as EventListener);
    
    // إرجاع دالة لإلغاء المراقبة
    return () => {
      window.removeEventListener('storeChanged', handler as EventListener);
    };
  }
}

// تصدير مبسط للاستخدام السريع
export const {
  getActiveStore,
  setActiveStore,
  clearActiveStore,
  isValidStore,
  cleanup: cleanupStoreData,
  onStoreChange
} = StoreManager;
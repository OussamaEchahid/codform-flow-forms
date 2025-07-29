// Store Manager - وحدة مركزية لإدارة المتاجر
// لحل مشكلة التضارب بين localStorage keys المختلفة

export class StoreManager {
  private static readonly PRIMARY_KEY = 'current_shopify_store';
  private static readonly LEGACY_KEYS = [
    'shopify_store',
    'shopify_active_store',
    'activeShopId'
  ];

  // الحصول على المتجر النشط
  static getActiveStore(): string | null {
    try {
      // أولاً جرب المفتاح الرئيسي
      const primaryStore = localStorage.getItem(this.PRIMARY_KEY);
      if (primaryStore && primaryStore.trim()) {
        return primaryStore.trim();
      }

      // إذا لم يوجد، جرب المفاتيح القديمة
      for (const key of this.LEGACY_KEYS) {
        const store = localStorage.getItem(key);
        if (store && store.trim()) {
          // انقل إلى المفتاح الرئيسي
          this.setActiveStore(store.trim());
          return store.trim();
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting active store:', error);
      return null;
    }
  }

  // تعيين المتجر النشط
  static setActiveStore(store: string): void {
    try {
      if (!store || !store.trim()) {
        console.warn('⚠️ Attempting to set empty store');
        return;
      }

      const normalizedStore = store.trim();
      
      // تعيين في المفتاح الرئيسي
      localStorage.setItem(this.PRIMARY_KEY, normalizedStore);
      
      // تنظيف المفاتيح القديمة
      this.LEGACY_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('✅ Store set successfully:', normalizedStore);
      
      // إطلاق حدث للتحديث
      window.dispatchEvent(new CustomEvent('storeChanged', { 
        detail: { store: normalizedStore } 
      }));
    } catch (error) {
      console.error('❌ Error setting active store:', error);
    }
  }

  // مسح المتجر النشط
  static clearActiveStore(): void {
    try {
      // إزالة جميع المفاتيح
      localStorage.removeItem(this.PRIMARY_KEY);
      this.LEGACY_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🧹 Store cleared successfully');
      
      // إطلاق حدث للتحديث
      window.dispatchEvent(new CustomEvent('storeChanged', { 
        detail: { store: null } 
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

  // تنظيف جميع البيانات المتعلقة بالمتجر
  static cleanup(): void {
    try {
      // إزالة جميع مفاتيح المتاجر
      localStorage.removeItem(this.PRIMARY_KEY);
      this.LEGACY_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });

      // إزالة بيانات أخرى متعلقة بالمتجر
      localStorage.removeItem('shopify_user_email');
      localStorage.removeItem('shopify_auth_state');
      
      console.log('🧹 Complete store cleanup done');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
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
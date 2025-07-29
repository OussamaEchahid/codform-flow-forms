// وحدة إدارة المتاجر الموحدة - الحل الشامل لجميع مشاكل التبديل
// يحل محل جميع أنظمة إدارة المتاجر المتضاربة

export class UnifiedStoreManager {
  // مفتاح واحد أساسي لجميع العمليات
  private static readonly STORE_KEY = 'active_shopify_store';
  
  // المفاتيح المتضاربة - تحديث شامل لجميع المفاتيح المكتشفة
  private static readonly LEGACY_KEYS = [
    'current_shopify_store',
    'shopify_store', 
    'shopify_active_store',
    'simple_active_store',
    'shopify_temp_store',
    'activeShopId',
    'shopify_connected',
    'connectionStatusKey',
    'storageKey',
    'shop',
    'selectedStore',
    'connectedStore',
    'activeShopifyStore',
    'shopify_connected_stores',
    'cached_forms',
    'language'
  ];

  // حالة الكاش للأداء
  private static cache: {
    store: string | null;
    timestamp: number;
  } = { store: null, timestamp: 0 };

  private static readonly CACHE_DURATION = 30000; // 30 ثانية

  /**
   * الحصول على المتجر النشط
   */
  static getActiveStore(): string | null {
    try {
      const now = Date.now();
      
      // فحص الكاش أولاً
      if (this.cache.store && (now - this.cache.timestamp) < this.CACHE_DURATION) {
        // تحقق إضافي من التطابق
        const currentStore = localStorage.getItem(this.STORE_KEY);
        if (currentStore === this.cache.store) {
          console.log('📋 Retrieved store from cache:', this.cache.store);
          return this.cache.store;
        }
        // إذا لم يتطابق، امسح الكاش
        this.invalidateCache();
      }

      // فحص المفتاح الأساسي
      const primaryStore = localStorage.getItem(this.STORE_KEY);
      if (primaryStore && primaryStore.trim()) {
        const cleanStore = primaryStore.trim();
        this.updateCache(cleanStore);
        this.cleanupLegacyKeys();
        console.log('✅ Found active store:', cleanStore);
        return cleanStore;
      }

      // فحص المفاتيح القديمة والترقية
      for (const key of this.LEGACY_KEYS) {
        const store = localStorage.getItem(key);
        if (store && store.trim()) {
          const cleanStore = store.trim();
          console.log(`🔄 Migrating store from "${key}" to unified system:`, cleanStore);
          this.setActiveStore(cleanStore);
          return cleanStore;
        }
      }

      console.log('⚠️ No active store found');
      return null;
    } catch (error) {
      console.error('❌ Error getting active store:', error);
      return null;
    }
  }

  /**
   * تعيين المتجر النشط
   */
  static setActiveStore(store: string): boolean {
    try {
      if (!store || !store.trim()) {
        console.warn('⚠️ Cannot set empty store');
        return false;
      }

      const cleanStore = store.trim();
      
      // التحقق من صحة تنسيق المتجر
      if (!this.isValidStoreFormat(cleanStore)) {
        console.error('❌ Invalid store format:', cleanStore);
        return false;
      }

      console.log('🔄 Setting active store:', cleanStore);

      // تنظيف شامل أولاً
      this.performFullCleanup();

      // تعيين المتجر الجديد
      localStorage.setItem(this.STORE_KEY, cleanStore);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_connection_status', 'connected');
      localStorage.setItem('shopify_connection_timestamp', Date.now().toString());

      // تحديث الكاش
      this.updateCache(cleanStore);

      // إطلاق الأحداث
      this.emitStoreChangeEvents(cleanStore);

      console.log('✅ Store set successfully:', cleanStore);
      return true;
    } catch (error) {
      console.error('❌ Error setting active store:', error);
      return false;
    }
  }

  /**
   * مسح المتجر النشط
   */
  static clearActiveStore(): boolean {
    try {
      console.log('🧹 Clearing active store...');
      
      this.performFullCleanup();
      this.invalidateCache();
      this.emitStoreChangeEvents(null);
      
      console.log('✅ Store cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Error clearing active store:', error);
      return false;
    }
  }

  /**
   * التحقق من حالة الاتصال
   */
  static isConnected(): boolean {
    const store = this.getActiveStore();
    const connected = localStorage.getItem('shopify_connected') === 'true';
    return !!(store && connected);
  }

  /**
   * التحقق من صحة تنسيق المتجر
   */
  static isValidStoreFormat(store: string): boolean {
    if (!store || !store.trim()) return false;
    const shopifyPattern = /^[a-zA-Z0-9\-]+\.myshopify\.com$/;
    return shopifyPattern.test(store.trim());
  }

  /**
   * تبديل المتجر مع إعادة تحميل الصفحة
   */
  static switchStore(store: string, reload = true): boolean {
    const success = this.setActiveStore(store);
    if (success && reload) {
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    }
    return success;
  }

  /**
   * تنظيف شامل لجميع البيانات - محسن للتعامل مع جميع المفاتيح المتضاربة
   */
  static performFullCleanup(): void {
    try {
      console.log('🧹 Starting comprehensive cleanup...');
      
      // مسح جميع المفاتيح المتضاربة أولاً
      this.LEGACY_KEYS.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`🗑️ Removing conflicting key: ${key}`);
          localStorage.removeItem(key);
        }
      });

      // مسح جميع بيانات Shopify المرتبطة
      const shopifyKeys = [
        'shopify_connected',
        'shopify_connection_status', 
        'shopify_connection_timestamp',
        'shopify_connecting',
        'shopify_connection_success',
        'shopify_last_error',
        'shopify_recovery_attempt',
        'shopify_failsafe',
        'shopify_token_error',
        'shopify_user_email',
        'shopify_auth_token',
        'simple_connection_status'
      ];
      
      shopifyKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`🗑️ Removing Shopify key: ${key}`);
          localStorage.removeItem(key);
        }
      });

      console.log('✅ Comprehensive cleanup completed - all conflicting keys removed');
    } catch (error) {
      console.error('❌ Error during comprehensive cleanup:', error);
    }
  }

  /**
   * تنظيف المفاتيح القديمة فقط
   */
  private static cleanupLegacyKeys(): void {
    try {
      this.LEGACY_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('❌ Error cleaning legacy keys:', error);
    }
  }

  /**
   * تحديث الكاش
   */
  private static updateCache(store: string | null): void {
    this.cache = {
      store,
      timestamp: Date.now()
    };
  }

  /**
   * مسح الكاش
   */
  private static invalidateCache(): void {
    console.log('🗑️ Cache invalidated');
    this.cache = { store: null, timestamp: 0 };
  }

  /**
   * تنظيف فوري وإجباري لحل التضارب
   */
  static forceCleanupAndSet(store: string): boolean {
    try {
      console.log('🚨 FORCE CLEANUP AND SET:', store);
      
      // مسح كامل فوري
      this.performFullCleanup();
      this.invalidateCache();
      
      // انتظار قصير للتأكد من المسح
      setTimeout(() => {
        // تعيين المتجر الجديد
        localStorage.setItem(this.STORE_KEY, store);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('shopify_connection_status', 'connected');
        
        // تحديث الكاش
        this.updateCache(store);
        
        // إطلاق الأحداث
        this.emitStoreChangeEvents(store);
        
        console.log('✅ FORCE SET COMPLETED:', store);
        
        // إعادة تحميل الصفحة للتأكد
        window.location.reload();
      }, 100);
      
      return true;
    } catch (error) {
      console.error('❌ Error in force cleanup and set:', error);
      return false;
    }
  }

  /**
   * إطلاق أحداث تغيير المتجر
   */
  private static emitStoreChangeEvents(store: string | null): void {
    try {
      // حدث عام لتغيير المتجر
      window.dispatchEvent(new CustomEvent('storeChanged', {
        detail: { store, timestamp: Date.now() }
      }));

      // حدث خاص بـ Shopify
      window.dispatchEvent(new CustomEvent('shopifyStoreChanged', {
        detail: { activeStore: store, timestamp: Date.now() }
      }));

      // حدث للنظام الموحد
      window.dispatchEvent(new CustomEvent('unifiedStoreChanged', {
        detail: { store, timestamp: Date.now() }
      }));
    } catch (error) {
      console.error('❌ Error emitting store change events:', error);
    }
  }

  /**
   * مراقبة تغييرات المتجر
   */
  static onStoreChange(callback: (store: string | null) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail.store);
    };

    window.addEventListener('unifiedStoreChanged', handler as EventListener);
    
    return () => {
      window.removeEventListener('unifiedStoreChanged', handler as EventListener);
    };
  }

  /**
   * الحصول على معلومات التشخيص
   */
  static getDiagnosticInfo(): any {
    return {
      activeStore: this.getActiveStore(),
      isConnected: this.isConnected(),
      cache: this.cache,
      localStorage: {
        [this.STORE_KEY]: localStorage.getItem(this.STORE_KEY),
        shopify_connected: localStorage.getItem('shopify_connected'),
        shopify_connection_status: localStorage.getItem('shopify_connection_status')
      },
      legacyKeys: this.LEGACY_KEYS.reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {} as any)
    };
  }

  /**
   * تنظيف عام وإصلاح شامل
   */
  static performMaintenance(): void {
    console.log('🔧 Performing system maintenance...');
    
    // جمع المعلومات الحالية
    const currentStore = this.getActiveStore();
    
    // تنظيف شامل
    this.performFullCleanup();
    this.invalidateCache();
    
    // إعادة تعيين المتجر إذا كان موجوداً
    if (currentStore && this.isValidStoreFormat(currentStore)) {
      this.setActiveStore(currentStore);
    }
    
    console.log('✅ System maintenance completed');
  }
}

// تصدير مبسط للاستخدام السريع
export const {
  getActiveStore,
  setActiveStore,
  clearActiveStore,
  isConnected,
  switchStore,
  onStoreChange,
  getDiagnosticInfo,
  performMaintenance
} = UnifiedStoreManager;

// تصدير الكلاس الكامل
export default UnifiedStoreManager;
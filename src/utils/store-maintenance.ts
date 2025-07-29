// أداة الصيانة الشاملة للنظام الموحد لإدارة المتاجر
import UnifiedStoreManager from '@/utils/unified-store-manager';

export class StoreMaintenance {
  /**
   * تشغيل الصيانة الشاملة عند بدء التطبيق
   */
  static performStartupMaintenance(): void {
    console.log('🔧 Starting comprehensive store management maintenance...');
    
    try {
      // الحصول على معلومات التشخيص قبل التنظيف
      const diagnosticBefore = UnifiedStoreManager.getDiagnosticInfo();
      console.log('📋 Store state before maintenance:', diagnosticBefore);
      
      // تشغيل الصيانة الشاملة
      UnifiedStoreManager.performMaintenance();
      
      // معلومات التشخيص بعد التنظيف
      const diagnosticAfter = UnifiedStoreManager.getDiagnosticInfo();
      console.log('✅ Store state after maintenance:', diagnosticAfter);
      
      // تقرير التنظيف
      const activeStore = diagnosticAfter.activeStore;
      if (activeStore) {
        console.log(`✅ System maintenance completed. Active store: ${activeStore}`);
      } else {
        console.log('✅ System maintenance completed. No active store.');
      }
      
    } catch (error) {
      console.error('❌ Error during store maintenance:', error);
    }
  }
  
  /**
   * فحص شامل لحالة النظام
   */
  static performHealthCheck(): boolean {
    try {
      const diagnostic = UnifiedStoreManager.getDiagnosticInfo();
      const activeStore = diagnostic.activeStore;
      const isConnected = diagnostic.isConnected;
      
      console.log('🔍 Store Management Health Check:', {
        activeStore,
        isConnected,
        hasLegacyKeys: Object.values(diagnostic.legacyKeys).some(val => val !== null),
        cacheState: diagnostic.cache
      });
      
      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
  
  /**
   * إصلاح حالات التضارب
   */
  static fixConflicts(): void {
    console.log('🔧 Fixing store management conflicts...');
    
    try {
      // تنظيف شامل أولاً
      UnifiedStoreManager.performFullCleanup();
      
      // إعادة تهيئة النظام
      const potentialStore = this.findValidStore();
      if (potentialStore) {
        UnifiedStoreManager.setActiveStore(potentialStore);
        console.log(`✅ Restored store: ${potentialStore}`);
      }
      
      console.log('✅ Conflicts resolved successfully');
    } catch (error) {
      console.error('❌ Error fixing conflicts:', error);
    }
  }
  
  /**
   * البحث عن متجر صالح في localStorage
   */
  private static findValidStore(): string | null {
    const possibleKeys = [
      'active_shopify_store',
      'current_shopify_store',
      'shopify_store',
      'simple_active_store',
      'shop'
    ];
    
    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim() && UnifiedStoreManager.isValidStoreFormat(value.trim())) {
        console.log(`Found valid store in "${key}": ${value}`);
        return value.trim();
      }
    }
    
    return null;
  }
}

// تشغيل الصيانة تلقائياً عند استيراد الملف
StoreMaintenance.performStartupMaintenance();

export default StoreMaintenance;
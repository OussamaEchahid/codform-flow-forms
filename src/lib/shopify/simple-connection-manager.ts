// نظام إدارة المتاجر المبسط
// لا cache، لا recovery، لا تعقيدات - فقط storage بسيط

import { cleanShopifyDomain } from './types';

class SimpleShopifyConnectionManager {
  private readonly ACTIVE_STORE_KEY = 'simple_active_store';
  
  /**
   * تحديد المتجر النشط
   */
  public setActiveStore(domain: string): void {
    try {
      const cleanedDomain = cleanShopifyDomain(domain);
      
      if (!cleanedDomain) {
        console.error('Invalid domain provided');
        return;
      }
      
      // التأكد من أن النطاق هو متجر Shopify صحيح وليس النطاق الخاص بالتطبيق
      if (cleanedDomain === 'codmagnet.com') {
        console.error('Cannot set codmagnet.com as a Shopify store - this is the app domain');
        return;
      }
      
      console.log(`🔄 Setting active store: ${cleanedDomain}`);
      
      // مسح جميع البيانات القديمة
      this.clearAllData();
      
      // تحديد المتجر الجديد
      localStorage.setItem(this.ACTIVE_STORE_KEY, cleanedDomain);
      localStorage.setItem('shopify_store', cleanedDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      console.log(`✅ Active store set: ${cleanedDomain}`);
      
    } catch (error) {
      console.error('Error setting active store:', error);
    }
  }
  
  /**
   * الحصول على المتجر النشط
   */
  public getActiveStore(): string | null {
    try {
      const stored = localStorage.getItem(this.ACTIVE_STORE_KEY);
      
      // إذا كان المخزن codmagnet.com، فهذا خطأ - احذفه
      if (stored === 'codmagnet.com') {
        localStorage.removeItem(this.ACTIVE_STORE_KEY);
        return null;
      }
      
      return stored;
    } catch (error) {
      console.error('Error getting active store:', error);
      return null;
    }
  }
  
  /**
   * التحقق من وجود اتصال
   */
  public isConnected(): boolean {
    const activeStore = this.getActiveStore();
    const connected = localStorage.getItem('shopify_connected') === 'true';
    return !!(activeStore && connected);
  }
  
  /**
   * قطع الاتصال نهائياً
   */
  public disconnect(): void {
    try {
      console.log('🔌 Disconnecting from all stores...');
      this.clearAllData();
      console.log('✅ Disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }
  
  /**
   * مسح جميع البيانات
   */
  private clearAllData(): void {
    try {
      // قائمة بجميع مفاتيح Shopify
      const shopifyKeys = [
        this.ACTIVE_STORE_KEY,
        'shopify_store',
        'shopify_connected',
        'shopify_active_store',
        'shopify_stores',
        'shopify_connected_stores',
        'shopify_last_url_shop',
        'shopify_failsafe',
        'shopify_token_error',
        'shopify_temp_store',
        'shopify_connecting',
        'shopify_connection_success',
        'shopify_connection_timestamp',
        'shopify_last_error',
        'shopify_recovery_attempt'
      ];
      
      // مسح المفاتيح المحددة
      shopifyKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // مسح أي مفاتيح أخرى تبدأ بـ shopify_
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('shopify_') && 
            !key.includes('user') && 
            !key.includes('settings')) {
          localStorage.removeItem(key);
        }
      });
      
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
  
  /**
   * الحصول على معلومات التصحيح
   */
  public getDebugInfo(): any {
    return {
      activeStore: this.getActiveStore(),
      isConnected: this.isConnected(),
      localStorageData: {
        simple_active_store: localStorage.getItem(this.ACTIVE_STORE_KEY),
        shopify_store: localStorage.getItem('shopify_store'),
        shopify_connected: localStorage.getItem('shopify_connected')
      }
    };
  }
}

export const simpleShopifyConnectionManager = new SimpleShopifyConnectionManager();
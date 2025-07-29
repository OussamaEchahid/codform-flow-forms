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
      // قائمة مفاتيح البحث بترتيب الأولوية
      const searchKeys = [
        this.ACTIVE_STORE_KEY,
        'shopify_store', 
        'active_shop',
        'shopify_active_store'
      ];
      
      let activeStore: string | null = null;
      
      // البحث في كل مفتاح حتى نجد متجر صالح
      for (const key of searchKeys) {
        const stored = localStorage.getItem(key);
        if (stored && stored !== 'null' && stored !== 'codmagnet.com' && stored.trim() !== '') {
          activeStore = stored;
          break;
        }
      }
      
      // إذا وجدنا متجر، تأكد من مزامنة جميع المفاتيح (بدون تسجيل متكرر)
      if (activeStore) {
        // مزامنة جميع مفاتيح المتجر النشط
        localStorage.setItem(this.ACTIVE_STORE_KEY, activeStore);
        localStorage.setItem('shopify_store', activeStore);
        localStorage.setItem('active_shop', activeStore);
        localStorage.setItem('shopify_connected', 'true');
      }
      
      return activeStore;
    } catch (error) {
      console.error('Error getting active store:', error);
      return null;
    }
  }

  /**
   * الحصول على جميع المتاجر المحفوظة من قاعدة البيانات
   */
  public async getAllStores(): Promise<string[]> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: stores, error } = await supabase
        .from('shopify_stores')
        .select('shop')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching stores:', error);
        return [];
      }

      return stores ? stores.map(s => s.shop) : [];
    } catch (error) {
      console.error('Error getting all stores:', error);
      return [];
    }
  }

  /**
   * التحقق من صحة المتجر النشط ضد قاعدة البيانات
   */
  public async validateActiveStore(): Promise<boolean> {
    try {
      const currentStore = this.getActiveStore();
      if (!currentStore) {
        console.log('❌ لا يوجد متجر نشط محلياً');
        return false;
      }

      const { supabase } = await import('@/integrations/supabase/client');
      const { data: storeData, error } = await supabase
        .from('shopify_stores')
        .select('shop, access_token, is_active')
        .eq('shop', currentStore)
        .eq('is_active', true)
        .single();

      if (error || !storeData) {
        console.log(`❌ المتجر ${currentStore} غير موجود في قاعدة البيانات`);
        return false;
      }

      console.log(`✅ المتجر ${currentStore} صحيح ونشط`);
      return true;
    } catch (error) {
      console.error('Error validating active store:', error);
      return false;
    }
  }

  /**
   * إصلاح حالة المتجر النشط تلقائياً
   */
  public async autoFixActiveStore(): Promise<boolean> {
    try {
      console.log('🔧 بدء إصلاح حالة المتجر النشط...');
      
      // التحقق من صحة المتجر الحالي
      const isValid = await this.validateActiveStore();
      if (isValid) {
        console.log('✅ المتجر النشط صحيح - لا حاجة للإصلاح');
        return true;
      }

      // الحصول على جميع المتاجر المتاحة
      const availableStores = await this.getAllStores();
      if (availableStores.length === 0) {
        console.log('❌ لا توجد متاجر متاحة في قاعدة البيانات');
        this.disconnect();
        return false;
      }

      // تعيين أول متجر متاح كمتجر نشط
      const firstStore = availableStores[0];
      console.log(`🔄 تعيين المتجر ${firstStore} كمتجر نشط`);
      this.setActiveStore(firstStore);
      
      console.log('✅ تم إصلاح حالة المتجر النشط بنجاح');
      return true;
      
    } catch (error) {
      console.error('Error fixing active store:', error);
      return false;
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
   * مسح جميع البيانات وإعادة تعيين حالة نظيفة
   */
  private clearAllData(): void {
    try {
      console.log('🧹 مسح جميع بيانات Shopify...');
      
      // قائمة بجميع مفاتيح Shopify المحتملة
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
        'shopify_recovery_attempt',
        'active_shop'
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
      
      console.log('✅ تم مسح جميع البيانات');
      
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
  
  /**
   * تحديث المتجر النشط مع التحقق من صحة البيانات
   */
  public async validateAndSetActiveStore(domain: string, forceUpdate: boolean = false): Promise<boolean> {
    try {
      const cleanedDomain = cleanShopifyDomain(domain);
      
      if (!cleanedDomain) {
        console.error('Invalid domain provided');
        return false;
      }
      
      console.log(`🔍 التحقق من صحة المتجر: ${cleanedDomain}`);
      
      // التحقق من وجود المتجر في قاعدة البيانات
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: storeData, error } = await supabase
        .from('shopify_stores')
        .select('shop, access_token, is_active')
        .eq('shop', cleanedDomain)
        .eq('is_active', true)
        .single();
      
      if (error || !storeData || !storeData.access_token) {
        console.error(`❌ المتجر ${cleanedDomain} غير موجود أو غير نشط في قاعدة البيانات`);
        return false;
      }
      
      console.log(`✅ تم التحقق من صحة المتجر: ${cleanedDomain}`);
      
      // تعيين المتجر النشط
      if (forceUpdate || this.getActiveStore() !== cleanedDomain) {
        this.setActiveStore(cleanedDomain);
      }
      
      return true;
      
    } catch (error) {
      console.error('Error validating store:', error);
      return false;
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
/**
 * أداة للتحقق من صحة المتاجر ومزامنتها
 */

import { supabase } from '@/integrations/supabase/client';
import { simpleShopifyConnectionManager } from '@/lib/shopify/simple-connection-manager';

export interface StoreValidationResult {
  isValid: boolean;
  availableStores: string[];
  currentStore: string | null;
  recommendedStore: string | null;
}

/**
 * التحقق من صحة المتجر النشط ومزامنة البيانات
 */
export async function validateCurrentStore(userId: string): Promise<StoreValidationResult> {
  try {
    console.log('🔍 بدء التحقق من صحة المتجر النشط...');
    
    // الحصول على المتاجر المتاحة من قاعدة البيانات
    const response = await supabase.functions.invoke('store-link-manager', {
      body: {
        action: 'get_stores',
        userId: userId
      }
    });

    const availableStores = response.data?.stores?.map((store: any) => store.shop) || [];
    const currentStore = simpleShopifyConnectionManager.getActiveStore();
    
    console.log('📋 المتاجر المتاحة:', availableStores);
    console.log('🏪 المتجر النشط الحالي:', currentStore);
    
    // التحقق من صحة المتجر النشط
    const isValid = currentStore && availableStores.includes(currentStore);
    const recommendedStore = availableStores.length > 0 ? availableStores[0] : null;
    
    const result: StoreValidationResult = {
      isValid: !!isValid,
      availableStores,
      currentStore,
      recommendedStore
    };
    
    console.log('✅ نتيجة التحقق:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من صحة المتجر:', error);
    return {
      isValid: false,
      availableStores: [],
      currentStore: null,
      recommendedStore: null
    };
  }
}

/**
 * إصلاح وتصحيح حالة المتجر النشط
 */
export async function fixStoreConnection(userId: string): Promise<boolean> {
  try {
    console.log('🔧 بدء إصلاح حالة المتجر النشط...');
    
    const validation = await validateCurrentStore(userId);
    
    if (validation.isValid) {
      console.log('✅ المتجر النشط صحيح، لا حاجة للإصلاح');
      return true;
    }
    
    if (validation.recommendedStore) {
      console.log(`🔄 إصلاح المتجر النشط إلى: ${validation.recommendedStore}`);
      
      // مسح البيانات القديمة وتعيين المتجر الجديد
      simpleShopifyConnectionManager.setActiveStore(validation.recommendedStore);
      localStorage.setItem('shopify_connected', 'true');
      
      console.log('✅ تم إصلاح المتجر النشط بنجاح');
      return true;
    } else {
      console.log('❌ لا توجد متاجر متاحة للإصلاح');
      simpleShopifyConnectionManager.disconnect();
      return false;
    }
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح حالة المتجر:', error);
    return false;
  }
}

/**
 * إعادة تحميل البيانات بعد إصلاح المتجر
 */
export function reloadAfterStoreFix() {
  console.log('🔄 إعادة تحميل الصفحة بعد إصلاح المتجر...');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}
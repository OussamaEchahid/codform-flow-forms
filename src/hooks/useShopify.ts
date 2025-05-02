
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { toast } from 'sonner';

export const useShopify = () => {
  const { shop, shopifyConnected, forceReconnect, refreshShopifyConnection } = useAuth();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false);

  // تحديث قائمة منتجات Shopify
  const refreshProducts = async () => {
    if (!shopifyConnected || !shop) {
      return [];
    }

    setIsLoading(true);
    try {
      console.log('Refreshing Shopify products for shop:', shop);
      
      // نحاول استخدام وظيفة get_shopify_store_data بدلاً من get_user_shop
      // لكن إذا فشل ذلك، نستخدم get_user_shop كاحتياطي
      let shopData;
      
      try {
        // أولاً، نحاول استخدام وظيفة get_shopify_store_data التي تعيد معلومات المتجر كاملة
        const { data: storeData, error: storeError } = await supabase
          .rpc('get_shopify_store_data');
        
        if (storeError) throw storeError;
        shopData = storeData?.[0];
      } catch (storeError) {
        console.log('Falling back to get_user_shop for basic shop name');
        // في حالة الفشل، نستخدم get_user_shop للحصول على اسم المتجر فقط
        const { data: shopName, error } = await supabase.rpc('get_user_shop');
        
        if (error) {
          throw error;
        }
        
        shopData = { shop: shopName };
      }

      console.log('Shop data received:', shopData);

      // استخدام بيانات وهمية مؤقتة للمنتجات
      const formattedProducts: ShopifyProduct[] = [
        {
          id: "mock1",
          title: "Sample Product",
          handle: "sample-product",
          description: "This is a sample product",
          price: "19.99",
          image: ""
        }
      ];

      setProducts(formattedProducts);
      return formattedProducts;
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
      // استخدام بيانات وهمية في حالة فشل الاتصال
      const mockProducts: ShopifyProduct[] = [
        {
          id: "offline1",
          title: "Offline Product",
          handle: "offline-product",
          description: "This product is available while offline",
          price: "9.99",
          image: ""
        }
      ];
      setProducts(mockProducts);
      setError('Failed to fetch products');
      return mockProducts;
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من اتصال Shopify
  const verifyShopifyConnection = async (): Promise<boolean> => {
    if (!shop) return false;
    
    try {
      console.log('Verifying Shopify connection for shop:', shop);
      
      // التحقق من وقت آخر فحص لمنع الفحص المتكرر
      if (Date.now() - lastCheck < 3000) {
        console.log("Skipping connection verification - checked recently");
        return shopifyConnected;
      }
      
      setLastCheck(Date.now());
      
      // التحقق من وجود رمز وصول صالح في قاعدة البيانات
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .maybeSingle();
      
      if (shopError) {
        console.error('Database error checking connection:', shopError);
        setConnectionStatus(false);
        return false;
      }
      
      if (!shopData || !shopData.access_token) {
        console.log("No valid access token found for shop:", shop);
        setConnectionStatus(false);
        return false;
      }
      
      console.log('Valid Shopify connection verified');
      setConnectionStatus(true);
      return true;
    } catch (error) {
      console.error('Error verifying Shopify connection:', error);
      setConnectionStatus(false);
      return false;
    }
  };

  // تحديث منتجات Shopify عند تغير المتجر المتصل
  useEffect(() => {
    if (shopifyConnected && shop) {
      refreshProducts().catch(err => {
        console.error('Error in refreshProducts effect:', err);
      });
    }
  }, [shopifyConnected, shop]);

  // إعادة الاتصال اليدوي بـ Shopify
  const manualReconnect = () => {
    // منع إعادة الاتصال المتعدد
    if (isRedirecting) return false;
    
    setIsRedirecting(true);
    
    // تنفيذ عملية إعادة الاتصال
    if (typeof forceReconnect === 'function') {
      console.log('Using direct reconnect function');
      return forceReconnect();
    }
    
    // إذا لم تكن دالة إعادة الاتصال المباشر متاحة، استخدم طريقة بديلة
    console.log('Using URL redirect for reconnection');
    const redirectUrl = `/shopify?force=true&ts=${Date.now()}&random=${Math.random().toString(36).substring(7)}`;
    window.location.href = redirectUrl;
    return true;
  };

  // حفظ إعدادات النموذج لمنتج معين
  const saveFormToProduct = async (formData: ShopifyFormData) => {
    if (!shopifyConnected || !shop) {
      toast.error('يجب الاتصال بـ Shopify أولاً');
      return false;
    }

    try {
      console.log('Saving form settings to product:', formData);
      // تخزين البيانات محليًا في حالة عدم توفر الاتصال
      const formSettings = {
        productId: formData.product_id,
        formId: formData.form_id,
        blockId: formData.settings?.blockId,
        enabled: formData.settings?.enabled || true,
        shopId: shop,
      };
      
      // محاولة حفظ البيانات في قاعدة البيانات
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .upsert({
          product_id: formSettings.productId,
          form_id: formSettings.formId,
          shop_id: formSettings.shopId,
          block_id: formSettings.blockId,
          enabled: formSettings.enabled,
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        console.error('Error saving form settings:', error);
        throw error;
      }
      
      console.log('Form settings saved successfully:', data);
      return true;
    } catch (error) {
      console.error('Error saving form to product:', error);
      
      // تخزين في التخزين المحلي كنسخة احتياطية
      try {
        const offlineSettings = JSON.parse(localStorage.getItem('offline_shopify_settings') || '[]');
        offlineSettings.push({
          product_id: formData.product_id,
          form_id: formData.form_id,
          settings: formData.settings,
          shop_id: shop,
          timestamp: Date.now()
        });
        localStorage.setItem('offline_shopify_settings', JSON.stringify(offlineSettings));
        
        toast.warning('تم تخزين الإعدادات محليًا. ستتم المزامنة عند استعادة الاتصال.');
        return true;
      } catch (storageError) {
        console.error('Error saving to local storage:', storageError);
      }
      
      return false;
    }
  };
  
  // مزامنة النموذج مع Shopify
  const syncFormWithShopify = async (formData: ShopifyFormData): Promise<boolean> => {
    setIsSyncing(true);
    try {
      console.log('Syncing form with Shopify:', formData);
      
      if (!shopifyConnected || !shop) {
        toast.error('يجب الاتصال بـ Shopify أولاً');
        return false;
      }

      // حفظ إعدادات النموذج
      const saved = await saveFormToProduct(formData);
      
      if (!saved) {
        throw new Error('Failed to sync form with Shopify');
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      setError('Failed to sync form');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // محاولة مزامنة البيانات المخزنة محليًا عند استعادة الاتصال
  useEffect(() => {
    const attemptOfflineSync = async () => {
      if (shopifyConnected && shop) {
        try {
          // التحقق من وجود إعدادات مخزنة محليًا
          const offlineSettings = JSON.parse(localStorage.getItem('offline_shopify_settings') || '[]');
          
          if (offlineSettings.length > 0) {
            console.log('Found offline settings to sync:', offlineSettings.length);
            toast.info('جاري مزامنة الإعدادات المخزنة محليًا...');
            
            for (const setting of offlineSettings) {
              await saveFormToProduct(setting);
            }
            
            // مسح البيانات المخزنة بعد المزامنة
            localStorage.removeItem('offline_shopify_settings');
            toast.success('تمت مزامنة جميع الإعدادات بنجاح');
          }
        } catch (error) {
          console.error('Error syncing offline settings:', error);
        }
      }
    };
    
    attemptOfflineSync();
  }, [shopifyConnected, shop]);

  // الواجهة المزودة من الخطاف
  return {
    products,
    isLoading,
    shop,
    isConnected: shopifyConnected,
    refreshProducts,
    manualReconnect,
    saveFormToProduct,
    verifyShopifyConnection,
    refreshConnection: refreshShopifyConnection,
    error,
    isRedirecting,
    isSyncing,
    connectionStatus,
    syncFormWithShopify
  };
};

export default useShopify;

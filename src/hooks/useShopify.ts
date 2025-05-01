
import { useState, useEffect } from 'react';
import { createShopifyAPI } from '@/lib/shopify/api';
import { ShopifyProduct, ShopifyFormData, ProductSettingsRequest } from '@/lib/shopify/types';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { saveProductSettings } from '@/pages/api/shopify/product-settings';

export const useShopify = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { shop, shopifyConnected } = useAuth();

  // جلب المنتجات عندما يتغير اتصال المتجر
  useEffect(() => {
    if (shopifyConnected && shop) {
      fetchProducts();
    } else {
      // إعادة تعيين المنتجات عند قطع الاتصال
      setProducts([]);
    }
  }, [shopifyConnected, shop]);

  const fetchProducts = async () => {
    if (!shopifyConnected || !shop) {
      setError('Shopify connection not established');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // الحصول على رمز وصول المتجر
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (storeError || !storeData) {
        throw new Error('Could not retrieve store access token');
      }

      // إنشاء مثيل API بالرمز ونطاق المتجر
      const api = createShopifyAPI(storeData.access_token, shop);
      const fetchedProducts = await api.getProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const syncFormWithShopify = async (formData: ShopifyFormData) => {
    if (!shopifyConnected || !shop) {
      throw new Error('Shopify connection not established');
    }

    setIsSyncing(true);
    setError(null);
    try {
      console.log('Starting Shopify sync with data:', formData);
      
      // الحصول على رمز وصول المتجر
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (storeError || !storeData) {
        console.error('Store access token error:', storeError);
        throw new Error('Could not retrieve store access token');
      }
      
      console.log('Retrieved store access token successfully');

      // إنشاء مثيل API بالرمز ونطاق المتجر
      const api = createShopifyAPI(storeData.access_token, shop);
      
      // حفظ إعدادات المنتج في قاعدة البيانات
      console.log('Saving product settings for productId:', formData.settings.products?.[0] || 'default');
      
      try {
        // استخدام معرف المنتج من الإعدادات أو استخدام قيمة افتراضية
        const productId = formData.settings.products?.[0] || 'default-product';
        
        // التأكد من أن معرف النموذج صالح قبل الإرسال
        if (!formData.formId) {
          throw new Error('Form ID is missing or invalid');
        }
        
        // إعداد بيانات الطلب
        const requestData: ProductSettingsRequest = {
          productId: productId,
          formId: formData.formId,
          enabled: true,
          blockId: formData.settings.blockId
        };
        
        console.log('Sending product settings data:', requestData);
        
        // استدعاء وظيفة حفظ إعدادات المنتج مباشرة بدلاً من استخدام fetch
        const result = await saveProductSettings(shop, requestData);
        
        console.log('Product settings result:', result);
        
        if (result.error) {
          throw new Error(result.error);
        }
      } catch (apiError) {
        console.error('API request error:', apiError);
        throw apiError instanceof Error ? apiError : new Error('Unknown API error');
      }

      // مزامنة النموذج مع شوبيفاي
      console.log('Setting up auto sync with Shopify');
      try {
        await api.setupAutoSync(formData);
      } catch (syncError) {
        console.error('Auto-sync error:', syncError);
        throw new Error('Failed to set up auto-sync with Shopify');
      }
      
      // حفظ ارتباط النموذج بالمتجر
      console.log('Updating form-shop association in database');
      const { error: formUpdateError } = await supabase
        .from('forms')
        .update({ shop_id: shop })
        .eq('id', formData.formId);
        
      if (formUpdateError) {
        console.error('Form update error:', formUpdateError);
        // نستمر على الرغم من هذا الخطأ، لأنه غير حاسم
        console.log('Continuing despite form update error');
      }

      toast.success('تم مزامنة النموذج مع Shopify بنجاح');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في مزامنة بيانات النموذج';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    products,
    isLoading,
    error,
    syncFormWithShopify,
    fetchProducts,
    isConnected: !!shopifyConnected,
    isSyncing
  };
};

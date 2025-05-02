
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

  // تحديث قائمة منتجات Shopify
  const refreshProducts = async () => {
    if (!shopifyConnected || !shop) {
      return [];
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopify_products')
        .select('*')
        .eq('shop', shop)
        .order('title', { ascending: true });

      if (error) {
        throw error;
      }

      const formattedProducts: ShopifyProduct[] = data.map((product: any) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description || '',
        price: product.price || '',
        image: product.image || '',
      }));

      setProducts(formattedProducts);
      return formattedProducts;
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من اتصال Shopify
  const verifyShopifyConnection = async (): Promise<boolean> => {
    if (!shop) return false;
    
    try {
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
      
      if (shopError || !shopData || !shopData.access_token) {
        console.log("No valid access token found for shop:", shop);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying Shopify connection:', error);
      return false;
    }
  };

  // تحديث منتجات Shopify عند تغير المتجر المتصل
  useEffect(() => {
    if (shopifyConnected && shop) {
      refreshProducts();
    }
  }, [shopifyConnected, shop]);

  // إعادة الاتصال اليدوي بـ Shopify
  const manualReconnect = () => {
    // تنفيذ عملية إعادة الاتصال
    if (typeof forceReconnect === 'function') {
      return forceReconnect();
    }
    
    // إذا لم تكن دالة إعادة الاتصال المباشر متاحة، استخدم طريقة بديلة
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
      // معالجة البيانات وحفظها
      const response = await fetch('/api/shopify/product-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: formData.product_id,
          formId: formData.form_id,
          blockId: formData.settings?.blockId,
          enabled: formData.settings?.enabled || true,
          shopId: shop,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'فشل حفظ إعدادات النموذج');
      }

      return true;
    } catch (error) {
      console.error('Error saving form to product:', error);
      return false;
    }
  };

  // تنفيذ أي عمليات تنظيف ضرورية عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      // التنظيف إذا لزم الأمر
    };
  }, []);

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
  };
};

export default useShopify;

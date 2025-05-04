
import { useState, useEffect, useCallback } from 'react';
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
  const [tokenError, setTokenError] = useState<boolean>(false);
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);
  const [lastTokenCheck, setLastTokenCheck] = useState<number>(0);
  const { shop, shopifyConnected } = useAuth();

  // Clear errors when shop changes
  useEffect(() => {
    if (shopifyConnected && shop) {
      setTokenError(false);
      setTokenExpired(false);
      setError(null);
    }
  }, [shopifyConnected, shop]);

  // جلب المنتجات عندما يتغير اتصال المتجر
  useEffect(() => {
    if (shopifyConnected && shop) {
      fetchProducts();
    } else {
      // إعادة تعيين المنتجات عند قطع الاتصال
      setProducts([]);
    }
  }, [shopifyConnected, shop]);

  const fetchProducts = useCallback(async () => {
    if (!shopifyConnected || !shop) {
      setError('Shopify connection not established');
      return;
    }

    // Avoid repeated attempts in a short timeframe
    const now = Date.now();
    if (tokenError && (now - lastTokenCheck < 60000)) {
      console.log('Skipping fetch due to recent token error:', 
        (now - lastTokenCheck) / 1000, 'seconds since last check');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTokenError(false);
    setTokenExpired(false);
    setLastTokenCheck(Date.now());
    
    try {
      console.log(`Fetching products for shop: ${shop}`);
      // الحصول على رمز وصول المتجر
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .single();
      
      if (storeError || !storeData || !storeData.access_token) {
        console.error('Store access token error:', storeError || 'No access token found');
        setTokenError(true);
        setTokenExpired(true);
        throw new Error('لم يتم العثور على رمز الوصول للمتجر، يرجى إعادة الاتصال بالمتجر');
      }
      
      // التحقق من تاريخ تحديث رمز الوصول
      const tokenUpdatedAt = new Date(storeData.updated_at);
      const currentDate = new Date();
      const daysSinceUpdate = Math.floor((currentDate.getTime() - tokenUpdatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate > 5) {
        console.warn('Access token might be expired, it was updated', daysSinceUpdate, 'days ago');
        
        if (daysSinceUpdate > 7) {
          setTokenExpired(true);
          throw new Error('رمز الوصول للمتجر قديم وقد يكون منتهي الصلاحية. يرجى إعادة الاتصال بالمتجر للحصول على رمز جديد.');
        }
      }
      
      console.log('Access token retrieved successfully, last updated:', storeData.updated_at);

      // إنشاء مثيل API بالرمز ونطاق المتجر
      const api = createShopifyAPI(storeData.access_token, shop);
      
      // التحقق من صحة الاتصال قبل جلب المنتجات
      await api.verifyConnection();
      
      const fetchedProducts = await api.getProducts();
      console.log(`Retrieved ${fetchedProducts.length} products`);
      setProducts(fetchedProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
      
      // تحديد إذا كان الخطأ متعلق برمز الوصول
      if (errorMessage.includes('Authentication error') || 
          errorMessage.includes('access token') ||
          errorMessage.includes('Received HTML') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403')) {
        setTokenError(true);
        setTokenExpired(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [shop, shopifyConnected, tokenError, lastTokenCheck]);

  const refreshConnection = useCallback(async () => {
    if (!shop) return;
    
    setIsLoading(true);
    try {
      // إعادة توجيه المستخدم لإعادة المصادقة مع Shopify بوضع التحديث الإجباري
      localStorage.setItem('shopify_force_refresh', 'true');
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      window.location.href = `/shopify-redirect?shop=${encodeURIComponent(shop)}&force_update=true&t=${timestamp}`;
    } catch (error) {
      console.error('Error refreshing connection:', error);
    } finally {
      setIsLoading(false);
    }
  }, [shop]);

  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData) => {
    if (!shopifyConnected || !shop) {
      toast.error('Shopify connection not established');
      throw new Error('Shopify connection not established');
    }

    // Prevent sync if token is expired
    if (tokenError || tokenExpired) {
      toast.error('يرجى تحديث اتصال متجر Shopify أولاً');
      throw new Error('Token error or expired. Please refresh connection first.');
    }

    setIsSyncing(true);
    setError(null);
    
    try {
      console.log('Starting Shopify sync with data:', formData);
      console.log('Using shop domain:', shop);
      
      // Validate shop format
      if (!shop.includes('myshopify.com')) {
        console.warn('Shop domain might not be properly formatted:', shop);
        console.log('Will attempt to normalize in the API client');
      }
      
      // الحصول على رمز وصول المتجر
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .single();
      
      if (storeError || !storeData || !storeData.access_token) {
        console.error('Store access token error:', storeError || 'No access token found');
        setTokenError(true);
        setTokenExpired(true);
        throw new Error('لم يتم العثور على رمز الوصول للمتجر، يرجى إعادة الاتصال بالمتجر');
      }
      
      console.log('Retrieved store access token successfully, token length:', storeData.access_token.length);
      console.log('Token last updated:', storeData.updated_at);
      
      // التحقق من تاريخ تحديث رمز الوصول
      const tokenUpdatedAt = new Date(storeData.updated_at);
      const currentDate = new Date();
      const daysSinceUpdate = Math.floor((currentDate.getTime() - tokenUpdatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate > 5) {
        console.warn('Access token might be expired, it was updated', daysSinceUpdate, 'days ago');
        
        if (daysSinceUpdate > 7) {
          setTokenExpired(true);
          throw new Error('رمز الوصول للمتجر قديم وقد يكون منتهي الصلاحية. يرجى إعادة الاتصال بالمتجر للحصول على رمز جديد.');
        }
      }

      // حفظ إعدادات المنتج في قاعدة البيانات أولاً
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
        
        console.log('Saving product settings data:', requestData);
        
        // استدعاء وظيفة حفظ إعدادات المنتج
        const result = await saveProductSettings(shop, requestData);
        
        console.log('Product settings result:', result);
        
        if (result.error) {
          throw new Error(result.error);
        }
      } catch (apiError) {
        console.error('Product settings save error:', apiError);
        throw apiError instanceof Error ? apiError : new Error('Unknown error saving product settings');
      }

      // إنشاء مثيل API بالرمز ونطاق المتجر
      try {
        console.log(`Creating API instance for shop: ${shop}`);
        const api = createShopifyAPI(storeData.access_token, shop);
        
        // First verify the connection is working
        console.log('Verifying connection to Shopify API before sync...');
        await api.verifyConnection();
        console.log('Connection verification successful');
        
        // مزامنة النموذج مع شوبيفاي
        console.log('Setting up auto sync with Shopify');
        await api.setupAutoSync(formData);
        console.log('Auto-sync completed successfully');
      } catch (syncError) {
        console.error('Auto-sync error:', syncError);
        
        // تحديد إذا كان الخطأ متعلق برمز الوصول المنتهي الصلاحية
        const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';
        if (errorMessage.includes('Authentication error') || 
            errorMessage.includes('Received HTML') || 
            errorMessage.includes('401') || 
            errorMessage.includes('403')) {
          setTokenError(true);
          setTokenExpired(true);
          throw new Error('رمز الوصول للمتجر غير صالح أو منتهي الصلاحية، يرجى إعادة الاتصال بالمتجر');
        }
        
        throw new Error(errorMessage);
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
  }, [shop, shopifyConnected, tokenError, tokenExpired]);

  return {
    products,
    isLoading,
    error,
    syncFormWithShopify,
    fetchProducts,
    refreshConnection,
    isConnected: !!shopifyConnected,
    isSyncing,
    tokenError,
    tokenExpired
  };
};

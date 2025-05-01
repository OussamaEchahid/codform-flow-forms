
import { useState, useEffect, useCallback } from 'react';
import { createShopifyAPI } from '@/lib/shopify/api';
import { ShopifyProduct, ShopifyFormData, ProductSettingsRequest } from '@/lib/shopify/types';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { saveProductSettings } from '@/pages/api/shopify/product-settings';
import { useNavigate } from 'react-router-dom';

export const useShopify = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { shop, shopifyConnected, refreshShopifyConnection } = useAuth();
  const navigate = useNavigate();

  // جلب المنتجات عندما يتغير اتصال المتجر
  useEffect(() => {
    if (shopifyConnected && shop) {
      fetchProducts();
    } else {
      // إعادة تعيين المنتجات عند قطع الاتصال
      setProducts([]);
    }
  }, [shopifyConnected, shop]);

  // Helper function to handle authentication errors
  const handleAuthError = useCallback((errorMessage: string) => {
    console.error('Shopify authentication error:', errorMessage);
    
    // Check for specific authentication error patterns
    const isAuthError = 
      errorMessage.includes('authentication error') || 
      errorMessage.includes('token is invalid') || 
      errorMessage.includes('token has expired') || 
      errorMessage.includes('HTML instead of JSON');
    
    if (isAuthError) {
      toast.error('Shopify connection needs to be refreshed. Redirecting to reconnect...', {
        duration: 5000,
      });
      
      // Clear stored connection data
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      
      // Refresh the auth context
      if (refreshShopifyConnection) {
        refreshShopifyConnection();
      }
      
      // Redirect to reconnect page after a short delay
      setTimeout(() => {
        navigate('/shopify');
      }, 2000);
      
      return true;
    }
    return false;
  }, [navigate, refreshShopifyConnection]);

  const fetchProducts = useCallback(async () => {
    if (!shopifyConnected || !shop) {
      setError('Shopify connection not established');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log(`Fetching products for shop: ${shop}`);
      // الحصول على رمز وصول المتجر
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, created_at, updated_at')
        .eq('shop', shop)
        .single();
      
      if (storeError || !storeData || !storeData.access_token) {
        console.error('Store access token error:', storeError || 'No access token found');
        throw new Error('Could not retrieve store access token');
      }
      
      console.log('Access token retrieved successfully');
      console.log('Token age:', new Date(storeData.updated_at || storeData.created_at));

      // إنشاء مثيل API بالرمز ونطاق المتجر
      try {
        const api = createShopifyAPI(storeData.access_token, shop);
        
        // Verify connection first
        try {
          await api.verifyConnection();
          console.log('Connection verified successfully');
        } catch (verifyError: any) {
          console.error('Verification error:', verifyError.message);
          if (handleAuthError(verifyError.message)) {
            return; // Stop execution if it's an auth error that's being handled
          }
          throw verifyError;
        }
        
        const fetchedProducts = await api.getProducts();
        console.log(`Retrieved ${fetchedProducts.length} products`);
        setProducts(fetchedProducts);
      } catch (apiError: any) {
        console.error('API error:', apiError);
        if (handleAuthError(apiError.message)) {
          return; // Stop execution if it's an auth error that's being handled
        }
        throw apiError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [shop, shopifyConnected, handleAuthError]);

  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData) => {
    if (!shopifyConnected || !shop) {
      toast.error('Shopify connection not established');
      throw new Error('Shopify connection not established');
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
        .select('access_token, created_at, updated_at')
        .eq('shop', shop)
        .single();
      
      if (storeError || !storeData || !storeData.access_token) {
        console.error('Store access token error:', storeError || 'No access token found');
        throw new Error('Could not retrieve store access token');
      }
      
      console.log('Retrieved store access token successfully');
      console.log('Token age:', new Date(storeData.updated_at || storeData.created_at));

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
        try {
          await api.verifyConnection();
          console.log('Connection verification successful');
        } catch (verifyError: any) {
          console.error('Connection verification failed:', verifyError);
          
          // Handle auth errors specifically
          if (handleAuthError(verifyError.message)) {
            return; // Stop execution if it's an auth error that's being handled
          }
          
          throw verifyError;
        }
        
        // مزامنة النموذج مع شوبيفاي
        console.log('Setting up auto sync with Shopify');
        await api.setupAutoSync(formData);
        console.log('Auto-sync completed successfully');
      } catch (syncError: any) {
        console.error('Auto-sync error:', syncError);
        
        // Handle auth errors specifically
        if (handleAuthError(syncError.message)) {
          return; // Stop execution if it's an auth error that's being handled
        }
        
        throw new Error(syncError instanceof Error ? syncError.message : 'Failed to set up auto-sync with Shopify');
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
  }, [shop, shopifyConnected, handleAuthError]);

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

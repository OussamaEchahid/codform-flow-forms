
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
  const [isRedirecting, setIsRedirecting] = useState(false);

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
    
    // التحقق من أننا لسنا في حالة إعادة توجيه بالفعل لتجنب الحلقة
    if (isRedirecting) {
      console.log('Already redirecting, skipping additional redirect');
      return true;
    }
    
    // Check for specific authentication error patterns
    const isAuthError = 
      errorMessage.includes('authentication error') || 
      errorMessage.includes('token is invalid') || 
      errorMessage.includes('token has expired') || 
      errorMessage.includes('HTML instead of JSON');
    
    if (isAuthError) {
      setIsRedirecting(true);
      
      toast.error('Shopify connection needs to be refreshed. Redirecting to reconnect...', {
        duration: 5000,
        onDismiss: () => setIsRedirecting(false) // إعادة تعيين الحالة بعد إغلاق الإشعار
      });
      
      // مسح بيانات الاتصال المخزنة
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      
      // تحديث سياق المصادقة
      if (refreshShopifyConnection) {
        refreshShopifyConnection();
      }
      
      // إضافة تأخير قبل إعادة التوجيه
      setTimeout(() => {
        navigate('/shopify');
        // إعادة تعيين الحالة بعد التوجيه
        setTimeout(() => {
          setIsRedirecting(false);
        }, 1000);
      }, 2000);
      
      return true;
    }
    return false;
  }, [navigate, refreshShopifyConnection, isRedirecting]);

  const fetchProducts = useCallback(async () => {
    // منع جلب المنتجات إذا كنا في حالة إعادة توجيه
    if (isRedirecting) {
      console.log('Skipping fetchProducts due to ongoing redirect');
      return;
    }
    
    if (!shopifyConnected || !shop) {
      setError('Shopify connection not established');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log(`Fetching products for shop: ${shop}`);
      // Get store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .single();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        throw new Error('Could not retrieve store access token');
      }
      
      if (!storeData) {
        console.error('No store data found');
        throw new Error('No store data found');
      }
      
      // Make sure storeData has the access_token property
      const accessToken = storeData.access_token;
      if (!accessToken) {
        throw new Error('Access token not found in store data');
      }
      
      console.log('Access token retrieved successfully');
      // Get the update time with fallback to current time
      const updateTime = storeData.updated_at || new Date().toISOString();
      console.log('Token age:', new Date(updateTime));

      // Create API instance with token and store scope
      try {
        const api = createShopifyAPI(accessToken, shop);
        
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
  }, [shop, shopifyConnected, handleAuthError, isRedirecting]);

  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData) => {
    // منع المزامنة إذا كنا في حالة إعادة توجيه
    if (isRedirecting) {
      console.log('Skipping syncFormWithShopify due to ongoing redirect');
      toast.error('يرجى الانتظار حتى يتم إعادة الاتصال بـ Shopify');
      return;
    }
    
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
      
      // Get store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .single();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        throw new Error('Could not retrieve store access token');
      }
      
      if (!storeData) {
        console.error('No store data found');
        throw new Error('No store data found');
      }
      
      // Safely access properties
      const accessToken = storeData.access_token;
      if (!accessToken) {
        throw new Error('Access token not found in store data');
      }
      
      console.log('Retrieved store access token successfully');
      // Get the update time with fallback to current time
      const updateTime = storeData.updated_at || new Date().toISOString();
      console.log('Token age:', new Date(updateTime));

      // Save product settings to database first
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

      // Create API instance with token and store scope
      try {
        console.log(`Creating API instance for shop: ${shop}`);
        const api = createShopifyAPI(accessToken, shop);
        
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
        
        // Sync form with Shopify
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
      
      // Save form-shop association
      console.log('Updating form-shop association in database');
      const { error: formUpdateError } = await supabase
        .from('forms')
        .update({ shop_id: shop })
        .eq('id', formData.formId);
        
      if (formUpdateError) {
        console.error('Form update error:', formUpdateError);
        // Continue despite this error, as it's not critical
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
  }, [shop, shopifyConnected, handleAuthError, isRedirecting]);

  return {
    products,
    isLoading,
    error,
    syncFormWithShopify,
    fetchProducts,
    isConnected: !!shopifyConnected,
    isSyncing,
    isRedirecting
  };
};

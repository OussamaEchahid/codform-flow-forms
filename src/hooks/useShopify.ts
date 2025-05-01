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
  const [redirectionDisabled, setRedirectionDisabled] = useState(true); // CRITICAL: Default to disabled to prevent loops
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [lastRedirectTime, setLastRedirectTime] = useState(0);

  // Check redirect state on page change and completely disable auto-redirects
  useEffect(() => {
    // Reset redirect state when hook loads
    setIsRedirecting(false);
    
    // Permanently disable auto-redirects
    setRedirectionDisabled(true);
    console.log('Auto-redirects are now permanently disabled to prevent infinite loops');
    
    // Check for redirect throttling from localStorage
    const storedRedirectTime = localStorage.getItem('shopify_last_redirect_time');
    if (storedRedirectTime) {
      const timeSinceLastRedirect = Date.now() - parseInt(storedRedirectTime);
      setLastRedirectTime(parseInt(storedRedirectTime));
      console.log('Time since last redirect attempt:', timeSinceLastRedirect, 'ms');
    }
  }, []);

  // Fetch products when shop connection changes
  useEffect(() => {
    // Skip data fetching if we're redirecting
    if (!isRedirecting && shopifyConnected && shop) {
      fetchProducts();
    } else if (!shopifyConnected) {
      // Reset products when disconnected
      setProducts([]);
    }
  }, [shopifyConnected, shop, isRedirecting]);

  // Helper function to handle authentication errors - CRITICAL: NEVER auto-redirect
  const handleAuthError = useCallback((errorMessage: string) => {
    console.error('Shopify authentication error:', errorMessage);
    
    // Always log the error but NEVER automatically redirect
    if (errorMessage.includes('authentication error') || 
        errorMessage.includes('token is invalid') || 
        errorMessage.includes('token has expired') || 
        errorMessage.includes('HTML instead of JSON')) {
      
      console.log('Authentication error detected. NOT auto-redirecting due to potential redirect loops');
      toast.error('يجب تجديد اتصال Shopify. يرجى النقر على زر إعادة الاتصال يدويًا.', {
        duration: 7000,
      });
      
      // Return true to indicate this was handled as an auth error
      return true;
    }
    return false;
  }, []);

  // Product fetching function with improvements to avoid redirect loops
  const fetchProducts = useCallback(async () => {
    // Skip product fetching if redirecting
    if (isRedirecting) {
      console.log('Skipping fetchProducts due to ongoing redirect');
      return;
    }
    
    // Check shop connection status
    if (!shopifyConnected || !shop) {
      console.log('Shopify connection not established, skipping fetch');
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
          // Reset retry counter on successful connection
          setAuthRetryCount(0);
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

  // Form sync function with improvements
  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData) => {
    // Skip sync if redirecting
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
        // Use product ID from settings or default value
        const productId = formData.settings.products?.[0] || 'default-product';
        
        // Ensure form ID is valid before sending
        if (!formData.formId) {
          throw new Error('Form ID is missing or invalid');
        }
        
        // Prepare request data
        const requestData: ProductSettingsRequest = {
          productId: productId,
          formId: formData.formId,
          enabled: true,
          blockId: formData.settings.blockId
        };
        
        console.log('Saving product settings data:', requestData);
        
        // Call product settings save function
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
          // Reset retry counter on successful connection
          setAuthRetryCount(0);
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

  // Manual reconnect function - Use window.location for more reliable navigation
  const manualReconnect = useCallback(() => {
    // Clear stored connection data
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.setItem('shopify_last_redirect_time', Date.now().toString());
    
    // Update auth context if available
    if (refreshShopifyConnection) {
      refreshShopifyConnection();
    }
    
    // Use window.location for more reliable navigation and to break potential redirect loops
    setTimeout(() => {
      window.location.href = '/shopify';
    }, 1000);
    
    return true;
  }, [refreshShopifyConnection]);

  return {
    products,
    isLoading,
    error,
    syncFormWithShopify,
    fetchProducts,
    isConnected: !!shopifyConnected,
    isSyncing,
    isRedirecting,
    redirectionDisabled,
    manualReconnect,
    authRetryCount,
  };
};

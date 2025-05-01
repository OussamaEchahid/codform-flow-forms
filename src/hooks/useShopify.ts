
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
  const [connectionStatus, setConnectionStatus] = useState<'verifying' | 'connected' | 'disconnected'>('verifying');
  
  // CRITICAL: Prevent any auto-redirects to avoid loops
  const [redirectionDisabled] = useState(true);
  
  // Reset redirect state on page change
  useEffect(() => {
    // Reset redirect state when hook loads
    setIsRedirecting(false);
    console.log('useShopify hook initialized with shop:', shop);
    
    // Initial connection status check
    if (shopifyConnected && shop) {
      verifyShopifyConnection()
        .then(connected => {
          console.log('Initial connection check result:', connected);
          setConnectionStatus(connected ? 'connected' : 'disconnected');
        })
        .catch(() => {
          setConnectionStatus('disconnected');
        });
    } else {
      setConnectionStatus('disconnected');
    }
  }, [shop, shopifyConnected]);

  // Helper function to handle authentication errors - NEVER auto-redirect
  const handleAuthError = useCallback((errorMessage: string) => {
    console.error('Shopify authentication error:', errorMessage);
    setConnectionStatus('disconnected');
    
    // Always log the error but NEVER automatically redirect
    if (errorMessage.includes('authentication error') || 
        errorMessage.includes('token is invalid') || 
        errorMessage.includes('token has expired') || 
        errorMessage.includes('HTML instead of JSON')) {
      
      console.log('Authentication error detected. NOT auto-redirecting - manual reconnection required');
      toast.error('تم اكتشاف مشكلة في الاتصال بـ Shopify. يرجى استخدام زر إعادة الاتصال للحل.', {
        duration: 7000,
      });
      
      // Return true to indicate this was handled as an auth error
      return true;
    }
    return false;
  }, []);

  // New function to directly verify Shopify connection by testing API
  const verifyShopifyConnection = useCallback(async (): Promise<boolean> => {
    if (!shopifyConnected || !shop) {
      console.log('Cannot verify connection: shop not connected');
      return false;
    }

    try {
      console.log(`Verifying connection for shop: ${shop}`);
      // Get store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .single();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        return false;
      }
      
      if (!storeData || !storeData.access_token) {
        console.error('No store data or access token found');
        return false;
      }
      
      // Create API instance and verify connection
      const api = createShopifyAPI(storeData.access_token, shop);
      
      try {
        const result = await api.verifyConnection();
        console.log('Connection verification result:', result);
        return result;
      } catch (error) {
        console.error('Connection verification failed:', error);
        return false;
      }
    } catch (err) {
      console.error('Error verifying connection:', err);
      return false;
    }
  }, [shop, shopifyConnected]);

  // Manual reconnect function - Use window.location for more reliable navigation
  const manualReconnect = useCallback(() => {
    // Prevent rapid reconnection attempts
    if (isRedirecting) {
      console.log('Already attempting to redirect, ignoring duplicate request');
      return false;
    }
    
    setIsRedirecting(true);
    console.log('Manual reconnect initiated');
    
    // Clear ALL stored data to ensure a fresh start
    localStorage.clear();
    sessionStorage.clear();
    
    // Explicitly clear Shopify connection data
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_reconnect_attempts');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_last_redirect_time');
    localStorage.removeItem('shopify_temp_store');
    
    // Update auth context if available
    if (refreshShopifyConnection) {
      refreshShopifyConnection();
    }
    
    // Use window.location for more reliable navigation with timestamp and random values
    setTimeout(() => {
      console.log('Redirecting to /shopify with forced reconnect parameters');
      window.location.href = `/shopify?reconnect=manual&force=true&ts=${Date.now()}&r=${Math.random()}`;
      
      // Reset redirect state after some time in case navigation fails
      setTimeout(() => {
        setIsRedirecting(false);
      }, 5000);
    }, 500);
    
    return true;
  }, [refreshShopifyConnection, isRedirecting]);

  // Product fetching function with improved error handling
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
    // Validate connection first
    if (!shopifyConnected || !shop) {
      toast.error('Shopify connection not established');
      throw new Error('Shopify connection not established');
    }

    // Validate blockId
    if (!formData.settings.blockId || formData.settings.blockId.trim() === '') {
      toast.error('Block ID is required');
      throw new Error('Block ID is required');
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
  }, [shop, shopifyConnected, handleAuthError]);

  return {
    products,
    isLoading,
    error,
    syncFormWithShopify,
    fetchProducts,
    isConnected: connectionStatus === 'connected',
    isSyncing,
    isRedirecting,
    redirectionDisabled,
    manualReconnect,
    verifyShopifyConnection,
    connectionStatus
  };
};

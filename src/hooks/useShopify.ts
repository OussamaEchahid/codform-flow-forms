import { useState, useEffect, useCallback, useRef } from 'react';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { createClient } from '@supabase/supabase-js';
import { ShopifyStore, ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { useI18n } from '@/lib/i18n';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { LS_KEYS } from '@/lib/shopify/constants';

// Test store configuration for development
const DEV_TEST_STORE = 'astrem.myshopify.com';
const DEV_TEST_TOKEN = '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';

// Cache durations
const CACHE_DURATIONS = {
  STORE: 30 * 60 * 1000, // 30 minutes
  PRODUCTS: 15 * 60 * 1000, // 15 minutes
  CONNECTION: 5 * 60 * 1000 // 5 minutes
};

// We'll extend the imported ShopifyFormData type instead of redefining it
// This ensures TypeScript won't complain about duplicate declarations

export const useShopify = () => {
  const [shopifyStore, setShopifyStore] = useState<ShopifyStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [failSafeMode, setFailSafeMode] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [forceRealData, setForceRealData] = useState<boolean>(
    localStorage.getItem(LS_KEYS.FORCE_PROD_MODE) === 'true'
  );
  const { language } = useI18n();
  const { isDevMode, testConnection } = useShopifyConnection();
  
  // Use refs for tracking the last refresh time
  const lastStoreRefresh = useRef<number>(0);
  const lastProductsRefresh = useRef<number>(0);
  const lastConnectionTest = useRef<number>(0);
  
  // Generate stable instance ID
  const instanceId = useRef(`shopify-${Math.random().toString(36).substr(2, 6)}`);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get the store ID from localStorage or provide a default test value
  const getStoreId = useCallback(() => {
    if (isDevMode) {
      return DEV_TEST_STORE;
    }
    return localStorage.getItem('shopify_store') || DEV_TEST_STORE;
  }, [isDevMode]);

  // Get shop property for compatibility with multiple components
  const shop = shopifyStore?.shop || getStoreId();
  
  // Check if connected to Shopify
  const isConnected = !!shopifyStore || !!localStorage.getItem('shopify_store');

  // Toggle real data mode
  const toggleRealDataMode = useCallback((enable: boolean) => {
    setForceRealData(enable);
    
    // Update localStorage
    if (enable) {
      localStorage.setItem(LS_KEYS.FORCE_PROD_MODE, 'true');
      localStorage.removeItem(LS_KEYS.FORCE_DEV_MODE);
    } else {
      localStorage.removeItem(LS_KEYS.FORCE_PROD_MODE);
      localStorage.setItem(LS_KEYS.FORCE_DEV_MODE, 'true');
    }
    
    console.log(`[${instanceId.current}] Force real data mode ${enable ? 'enabled' : 'disabled'}`);
    
    // We'll use the stored reference for fetching products later
    setTimeout(() => {
      if (window.__fetchProductsRef) {
        window.__fetchProductsRef(true);
      }
    }, 100);
  }, []);

  // Enhanced Shopify store loading with better error recovery
  const loadShopifyStore = useCallback(async (force = false) => {
    // Skip reloading if recently loaded
    const now = Date.now();
    if (!force && now - lastStoreRefresh.current < CACHE_DURATIONS.STORE) {
      console.log(`[${instanceId.current}] Using cached store data, skipping reload`);
      return;
    }
    
    setIsLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) {
        setError(language === 'ar' ? 'لم يتم العثور على متجر' : 'No store found');
        setIsLoading(false);
        return;
      }

      console.log(`[${instanceId.current}] Loading Shopify store data for: ${storeId}`);

      // Try to get from dev mode first
      if (isDevMode && storeId === DEV_TEST_STORE) {
        console.log(`[${instanceId.current}] Using dev mode store data`);
        const mockStore: ShopifyStore = {
          id: 'test-id',
          shop: DEV_TEST_STORE,
          access_token: DEV_TEST_TOKEN,
          token_type: 'offline',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        if (isMounted.current) {
          setShopifyStore(mockStore);
          setIsLoading(false);
          lastStoreRefresh.current = now;
        }
        return;
      }

      // Get directly from Supabase instead of edge function
      const { data: store, error: storeError } = await supabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', storeId)
        .maybeSingle();

      if (storeError) {
        console.error(`[${instanceId.current}] Error fetching store:`, storeError);
        
        // Try fallback for test store
        if (storeId === DEV_TEST_STORE) {
          console.log(`[${instanceId.current}] Using fallback for test store after error`);
          const mockStore: ShopifyStore = {
            id: 'test-id',
            shop: DEV_TEST_STORE,
            access_token: DEV_TEST_TOKEN,
            token_type: 'offline',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          if (isMounted.current) {
            setShopifyStore(mockStore);
            setError(null);
            setIsLoading(false);
            lastStoreRefresh.current = now;
          }
          return;
        }
        
        throw new Error(storeError.message);
      }

      if (!store) {
        setError(language === 'ar' ? 'لم يتم العثور على بيانات المتجر' : 'No store data found');
        setIsLoading(false);
        return;
      }

      if (isMounted.current) {
        setShopifyStore(store);
        setError(null);
        setIsLoading(false);
        lastStoreRefresh.current = now;
      }
    } catch (e: any) {
      console.error(`[${instanceId.current}] Error loading store:`, e);
      
      if (isMounted.current) {
        setError(e.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المتجر' : 'Error loading store'));
        setIsLoading(false);
      }
    }
  }, [getStoreId, language, isDevMode]);

  // Improved products loading with better fallbacks and caching
  const loadProducts = useCallback(async (force = false) => {
    // Skip reloading if recently loaded
    const now = Date.now();
    if (!force && now - lastProductsRefresh.current < CACHE_DURATIONS.PRODUCTS && products.length > 0) {
      console.log(`[${instanceId.current}] Using cached products data, skipping reload`);
      return products;
    }
    
    setIsLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) {
        if (isMounted.current) {
          setError(language === 'ar' ? 'لم يتم العثور على متجر' : 'No store found');
          setIsLoading(false);
        }
        return [];
      }

      // Try to get cached products first
      const cachedProducts = localStorage.getItem('shopify_products');
      if (cachedProducts && !force) {
        try {
          const parsed = JSON.parse(cachedProducts);
          if (parsed && parsed.length > 0) {
            console.log(`[${instanceId.current}] Using ${parsed.length} cached products`);
            if (isMounted.current) {
              setProducts(parsed);
              // Still continue loading fresh data in the background
            }
          }
        } catch (e) {
          console.error(`[${instanceId.current}] Error parsing cached products:`, e);
        }
      }
      
      // For test store in dev mode, return mock data immediately
      if (isDevMode && storeId === DEV_TEST_STORE) {
        const mockProducts: ShopifyProduct[] = [
          { 
            id: 'gid://shopify/Product/1', 
            title: 'Test Product 1', 
            handle: 'test-product-1',
            price: '99.99',
            images: [],
            variants: [{ 
              id: 'gid://shopify/ProductVariant/1', 
              title: 'Default Variant',
              price: '99.99',
              available: true 
            }]
          },
          { 
            id: 'gid://shopify/Product/2', 
            title: 'Test Product 2', 
            handle: 'test-product-2',
            price: '149.99',
            images: [],
            variants: [{ 
              id: 'gid://shopify/ProductVariant/2', 
              title: 'Default Variant',
              price: '149.99',
              available: true 
            }]
          }
        ];
        
        if (isMounted.current) {
          setProducts(mockProducts);
          setIsLoading(false);
          lastProductsRefresh.current = now;
          
          // Cache products
          localStorage.setItem('shopify_products', JSON.stringify(mockProducts));
        }
        return mockProducts;
      }
      
      // Get store token directly from Supabase for better reliability
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', storeId)
        .maybeSingle();
        
      if (storeError) {
        console.error(`[${instanceId.current}] Error getting store token:`, storeError);
        throw new Error(storeError.message || 'Failed to get store token');
      }
      
      if (!storeData?.access_token) {
        console.error(`[${instanceId.current}] No access token found for shop:`, storeId);
        setTokenError(true);
        throw new Error('No access token found');
      }
      
      // Try direct GraphQL approach with the token
      console.log(`[${instanceId.current}] Using direct GraphQL approach`);
      
      const token = storeData.access_token;
      const shopDomain = storeId.includes('myshopify.com') ? storeId : `${storeId}.myshopify.com`;
      const graphqlEndpoint = `https://${shopDomain}/admin/api/2023-10/graphql.json`;
      
      const query = `
        query {
          products(first: 50) {
            edges {
              node {
                id
                title
                handle
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      price
                      availableForSale
                    }
                  }
                }
                images(first: 1) {
                  edges {
                    node {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      let retryCount = 0;
      const maxRetries = 3;
      let response;
      
      while (retryCount < maxRetries) {
        try {
          response = await fetch(graphqlEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': token
            },
            body: JSON.stringify({ query })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[${instanceId.current}] GraphQL request failed with status ${response.status}:`, errorText);
            
            if (response.status === 401) {
              setTokenError(true);
              setTokenExpired(true);
              throw new Error('Authentication failed - token may be expired');
            }
            
            throw new Error(`GraphQL request failed with status ${response.status}`);
          }
          
          const graphqlData = await response.json();
          
          if (graphqlData.errors) {
            console.error(`[${instanceId.current}] GraphQL errors:`, graphqlData.errors);
            throw new Error(graphqlData.errors[0]?.message || 'GraphQL error');
          }
          
          // Transform products
          const transformedProducts = graphqlData.data.products.edges.map(edge => {
            const node = edge.node;
            return {
              id: node.id,
              title: node.title,
              handle: node.handle,
              price: node.variants.edges[0]?.node.price || "0",
              images: node.images.edges.map(img => img.node.url),
              variants: node.variants.edges.map(v => ({
                id: v.node.id,
                title: v.node.title,
                price: v.node.price,
                available: v.node.availableForSale
              }))
            };
          });
          
          console.log(`[${instanceId.current}] Successfully loaded ${transformedProducts.length} products via direct GraphQL`);
          
          if (isMounted.current) {
            setProducts(transformedProducts);
            setIsLoading(false);
            lastProductsRefresh.current = now;
            
            // Cache products
            localStorage.setItem('shopify_products', JSON.stringify(transformedProducts));
            
            // Clear errors
            setTokenError(false);
            setTokenExpired(false);
          }
          
          return transformedProducts;
        } catch (error) {
          console.error(`[${instanceId.current}] Error in GraphQL attempt ${retryCount + 1}:`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * retryCount));
            continue;
          }
          
          throw error;
        }
      }
      
      // This line is only reached if all retries fail but no error is thrown
      throw new Error('Failed to fetch products after multiple attempts');
    } catch (e: any) {
      console.error(`[${instanceId.current}] Unhandled error loading products:`, e);
      
      if (isMounted.current) {
        setIsLoading(false);
        
        // Only show error toast if we don't have any products already
        if (products.length === 0) {
          setError(e.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المنتجات' : 'Error loading products'));
          // Enable failsafe mode automatically on severe errors
          setFailSafeMode(true);
        }
      }
      
      return [];
    }
  }, [getStoreId, language, isDevMode, products.length]);

  // Optimized syncForm function - fixed TypeScript error
  const syncForm = useCallback(async (formData: ShopifyFormData) => {
    if (isSyncing) {
      console.log(`[${instanceId.current}] Sync already in progress, skipping`);
      return { success: false, error: 'Sync already in progress' };
    }
    
    setIsSyncing(true);
    try {
      // For dev mode, mock the sync
      if (isDevMode && formData.shopDomain === DEV_TEST_STORE) {
        console.log(`[${instanceId.current}] DEV MODE: Mocking form sync`);
        // Wait a bit to simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isMounted.current) {
          setIsSyncing(false);
        }
        
        return { 
          success: true, 
          message: 'Form synced successfully (dev mode)',
          synced_at: new Date().toISOString(),
          form_id: formData.formId || 'mock-form-id'
        };
      }
      
      // Implementation for form sync
      console.log(`[${instanceId.current}] Syncing form:`, formData.formId);
      
      // Get store token directly from Supabase
      const storeId = formData.shopDomain || getStoreId();
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', storeId)
        .maybeSingle();
      
      if (storeError || !storeData?.access_token) {
        console.error(`[${instanceId.current}] Error getting store token:`, storeError || 'No token found');
        throw new Error(storeError?.message || 'Failed to get store token');
      }
      
      // Get form data
      const { data: formRecord, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formData.formId)
        .maybeSingle();
        
      if (formError || !formRecord) {
        console.error(`[${instanceId.current}] Error getting form data:`, formError || 'Form not found');
        throw new Error(formError?.message || 'Form not found');
      }
      
      // Record the sync in shopify_product_settings
      const { data: syncData, error: syncError } = await supabase
        .from('shopify_product_settings')
        .insert({
          form_id: formData.formId,
          shop_id: storeId,
          product_id: formData.productId || null,
          enabled: true,
          block_id: formData.blockId || null
        })
        .select();
        
      if (syncError) {
        console.error(`[${instanceId.current}] Error recording form sync:`, syncError);
      }

      if (isMounted.current) {
        setIsSyncing(false);
      }
      
      return {
        success: true,
        message: language === 'ar' 
          ? 'تم مزامنة النموذج بنجاح' 
          : 'Form synced successfully',
        synced_at: new Date().toISOString(),
        form_id: formData.formId,
        sync_id: syncData?.[0]?.id
      };
    } catch (e: any) {
      console.error(`[${instanceId.current}] Error syncing form:`, e);
      
      if (isMounted.current) {
        setError(e.message || (language === 'ar' ? 'حدث خطأ أثناء مزامنة النموذج' : 'Error syncing form'));
        toast.error(e.message || (language === 'ar' ? 'حدث خطأ أثناء مزامنة النموذج' : 'Error syncing form'));
        setIsSyncing(false);
      }
      throw e;
    }
  }, [language, isDevMode, isSyncing, getStoreId]);

  // Optimized refreshConnection function with caching
  const refreshConnection = useCallback(async (forceRefresh = false) => {
    // Skip if recently checked, unless forced
    const now = Date.now();
    if (!forceRefresh && now - lastConnectionTest.current < CACHE_DURATIONS.CONNECTION) {
      console.log(`[${instanceId.current}] Connection tested recently, skipping`);
      return true;
    }
    
    try {
      console.log(`[${instanceId.current}] Testing Shopify connection`);
      
      // For dev mode or failsafe, just return true
      if (isDevMode || failSafeMode) {
        console.log(`[${instanceId.current}] Dev mode or failsafe mode active, skipping connection test`);
        setIsNetworkError(false);
        lastConnectionTest.current = now;
        return true;
      }
      
      // Otherwise, test the connection
      const result = await testConnection(forceRefresh);
      
      if (isMounted.current) {
        setIsNetworkError(!result);
        lastConnectionTest.current = now;
      }
      
      return result;
    } catch (e) {
      console.error(`[${instanceId.current}] Error refreshing connection:`, e);
      
      if (isMounted.current) {
        setIsNetworkError(true);
      }
      return false;
    }
  }, [testConnection, isDevMode, failSafeMode]);

  // Add toggleFailSafeMode function
  const toggleFailSafeMode = useCallback((value?: boolean) => {
    const newValue = value !== undefined ? value : !failSafeMode;
    setFailSafeMode(newValue);
    return newValue;
  }, [failSafeMode]);

  // Add emergencyReset function
  const emergencyReset = useCallback(() => {
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_products');
    localStorage.removeItem('shopify_collections');
    localStorage.removeItem('shopify_shop');
    setShopifyStore(null);
    setProducts([]);
    setError(null);
    setTokenError(false);
    setTokenExpired(false);
    setFailSafeMode(false);
    toast.success(language === 'ar' ? 'تم إعادة تعيين بيانات Shopify' : 'Shopify data has been reset');
  }, [language]);

  // Initial load of shop data
  useEffect(() => {
    loadShopifyStore();
  }, [loadShopifyStore]);
  
  // Check connection on mount
  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  // Fix circular dependency in fetchProducts and toggleRealDataMode
  useEffect(() => {
    // Define this for typechecking
    interface WindowWithFetchProducts extends Window {
      __fetchProductsRef?: (forceRefresh: boolean) => Promise<any>;
    }
    
    // Type assertion for window
    const windowWithFetch = window as WindowWithFetchProducts;
    
    // Store a reference to the loadProducts function on window for toggleRealDataMode to use
    windowWithFetch.__fetchProductsRef = (forceRefresh: boolean = false) => {
      return loadProducts(forceRefresh);
    };
  }, [loadProducts]);

  return {
    shopifyStore,
    isLoading,
    error,
    loadShopifyStore,
    shop,
    isConnected,
    products,
    loadProducts,
    syncForm,
    tokenError,
    tokenExpired,
    refreshConnection,
    isSyncing,
    failSafeMode,
    toggleFailSafeMode,
    emergencyReset,
    isNetworkError,
    testConnection,
    forceRealData,
    toggleRealDataMode
  };
};

// Utility functions outside the hook
export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  return createClient(supabaseUrl, supabaseKey);
};

export const getShopifyAccessToken = async (shop: string) => {
  // Handle dev mode test store
  if (shop === DEV_TEST_STORE) {
    console.log(`Using dev mode token for ${DEV_TEST_STORE}`);
    return DEV_TEST_TOKEN;
  }
  
  // Get token directly from Supabase
  const { data, error } = await supabase
    .from('shopify_stores')
    .select('access_token')
    .eq('shop', shop)
    .maybeSingle();

  if (error) {
    console.error('Error fetching Shopify access token:', error);
    throw new Error(error.message);
  }

  return data?.access_token;
};

export const clearShopifyCache = () => {
  localStorage.removeItem('shopify_products');
  localStorage.removeItem('shopify_collections');
  localStorage.removeItem('shopify_shop');
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { createClient } from '@supabase/supabase-js';
import { ShopifyStore, ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { useI18n } from '@/lib/i18n';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';

// Test store configuration for development
const DEV_TEST_STORE = 'astrem.myshopify.com';
const DEV_TEST_TOKEN = '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';

// Cache durations
const CACHE_DURATIONS = {
  STORE: 30 * 60 * 1000, // 30 minutes
  PRODUCTS: 15 * 60 * 1000, // 15 minutes
  CONNECTION: 5 * 60 * 1000 // 5 minutes
};

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

  // Optimized loadShopifyStore with caching
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

      const { data: store, error: storeError } = await shopifySupabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', storeId)
        .single();

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
        toast.error(e.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المتجر' : 'Error loading store'));
        setIsLoading(false);
      }
    }
  }, [getStoreId, language, isDevMode]);

  // Renamed function to loadProducts for consistency with ShopifyIntegration component
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

      // Try multiple approaches to fetch products
      console.log(`[${instanceId.current}] Fetching products for shop:`, storeId);
      
      // Add a unique timestamp to prevent caching
      const cacheBuster = new Date().getTime();
      
      // First try: edge function
      let data, error;
      try {
        console.log(`[${instanceId.current}] Attempting to fetch products using edge function...`);
        const response = await shopifySupabase.functions.invoke('shopify-products', {
          body: { 
            shop: storeId,
            timestamp: cacheBuster 
          }
        });
        data = response.data;
        error = response.error;
        
        if (error) {
          throw new Error(`Edge function error: ${error.message || "Unknown error"}`);
        }
        
        if (!data?.products || data.products.length === 0) {
          throw new Error("No products returned from edge function");
        }
      } catch (edgeFuncError) {
        console.error(`[${instanceId.current}] Edge function error:`, edgeFuncError);
        error = edgeFuncError;
        
        // Second try: API route
        try {
          console.log(`[${instanceId.current}] Edge function failed, trying backup API route`);
          const apiUrl = `/api/shopify-products?shop=${encodeURIComponent(storeId)}&t=${cacheBuster}`;
          
          const apiResponse = await fetch(apiUrl, {
            headers: { 
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (!apiResponse.ok) {
            throw new Error(`API route returned status ${apiResponse.status}`);
          }
          
          const apiData = await apiResponse.json();
          if (apiData.error) {
            throw new Error(apiData.error.message || 'Unknown error from API route');
          }
          
          if (apiData.products) {
            data = { products: apiData.products };
            console.log(`[${instanceId.current}] Successfully loaded ${apiData.products.length} products from backup API`);
            error = null;
          }
        } catch (apiError) {
          console.error(`[${instanceId.current}] Backup API route also failed:`, apiError);
          
          // Third try: Direct GraphQL (only if we have a token)
          try {
            console.log(`[${instanceId.current}] Trying direct GraphQL approach`);
            
            // Get token either from store data or from localStorage
            const token = shopifyStore?.access_token || localStorage.getItem('shopify_access_token');
            
            if (!token) {
              throw new Error("No access token available for direct GraphQL");
            }
            
            const graphqlEndpoint = `https://${storeId}/admin/api/2023-10/graphql.json`;
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
            
            const graphqlResponse = await fetch(graphqlEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': token
              },
              body: JSON.stringify({ query })
            });
            
            if (!graphqlResponse.ok) {
              throw new Error(`GraphQL request failed with status ${graphqlResponse.status}`);
            }
            
            const graphqlData = await graphqlResponse.json();
            if (graphqlData.errors) {
              throw new Error(graphqlData.errors[0]?.message || "GraphQL error");
            }
            
            // Transform GraphQL response to match our format
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
            
            data = { products: transformedProducts };
            console.log(`[${instanceId.current}] Successfully loaded ${transformedProducts.length} products via direct GraphQL`);
            error = null;
          } catch (graphqlError) {
            console.error(`[${instanceId.current}] Direct GraphQL attempt also failed:`, graphqlError);
            // Keep the previous errors
          }
        }
      }

      // Process results
      if (error) {
        console.error(`[${instanceId.current}] Error fetching products after all attempts:`, error);
        
        // If we already have products from cache, don't show the error to the user
        if (products.length === 0) {
          if (isMounted.current) {
            setError(error.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المنتجات' : 'Error loading products'));
            // Toast only on initial load
            if (force) {
              toast.error(language === 'ar' ? 'حدث خطأ أثناء تحميل المنتجات' : 'Error loading products');
            }
          }
        }
      }

      if (data?.products && isMounted.current) {
        setProducts(data.products);
        console.log(`[${instanceId.current}] Loaded ${data.products.length} products successfully`);
        
        // Cache products
        localStorage.setItem('shopify_products', JSON.stringify(data.products));
        lastProductsRefresh.current = now;
        
        // Also set token in localStorage for potential direct access
        if (shopifyStore?.access_token) {
          localStorage.setItem('shopify_access_token', shopifyStore.access_token);
        }
      }

      if (isMounted.current) {
        setIsLoading(false);
      }
      
      return data?.products || [];
    } catch (e: any) {
      console.error(`[${instanceId.current}] Unhandled error loading products:`, e);
      
      if (isMounted.current) {
        setIsLoading(false);
        
        // Only show error toast if we don't have any products already
        if (products.length === 0) {
          setError(e.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المنتجات' : 'Error loading products'));
          toast.error(e.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المنتجات' : 'Error loading products'));
        }
      }
      
      return [];
    }
  }, [getStoreId, language, isDevMode, products.length, shopifyStore]);

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
      const { data, error } = await shopifySupabase.functions.invoke('shopify-sync-form', {
        body: formData
      });

      if (error) {
        console.error(`[${instanceId.current}] Error syncing form:`, error);
        throw new Error(error.message);
      }

      if (isMounted.current) {
        setIsSyncing(false);
      }
      return data;
    } catch (e: any) {
      console.error(`[${instanceId.current}] Error syncing form:`, e);
      
      if (isMounted.current) {
        setError(e.message || (language === 'ar' ? 'حدث خطأ أثناء مزامنة النموذج' : 'Error syncing form'));
        toast.error(e.message || (language === 'ar' ? 'حدث خطأ أثناء مزامنة النموذج' : 'Error syncing form'));
        setIsSyncing(false);
      }
      throw e;
    }
  }, [language, isDevMode, isSyncing]);

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
  }, [testConnection]);

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

  return {
    shopifyStore,
    isLoading,
    error,
    loadShopifyStore,
    shop,
    isConnected,
    products,
    loadProducts, // Renamed from getProducts to match the component usage
    syncForm,
    tokenError,
    tokenExpired,
    refreshConnection,
    isSyncing,
    failSafeMode,
    toggleFailSafeMode,
    emergencyReset,
    isNetworkError,
    testConnection
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
  
  const { data, error } = await shopifySupabase
    .from('shopify_stores')
    .select('access_token')
    .eq('shop', shop)
    .single();

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

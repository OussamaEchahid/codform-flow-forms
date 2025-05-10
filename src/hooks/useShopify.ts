
import { useState, useEffect, useCallback } from 'react';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { createClient } from '@supabase/supabase-js';
import { ShopifyStore, ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { useI18n } from '@/lib/i18n';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
// We don't import tokenValidationCache anymore since we access it through the provider
// import { tokenValidationCache } from '@/lib/shopify/ShopifyConnectionProvider';

// Test store configuration for development
const DEV_TEST_STORE = 'astrem.myshopify.com';
const DEV_TEST_TOKEN = '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';

export const useShopify = () => {
  const [shopifyStore, setShopifyStore] = useState<ShopifyStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [failSafeMode, setFailSafeMode] = useState(false);
  const { language } = useI18n();
  const { isDevMode, testConnection } = useShopifyConnection();

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

  const loadShopifyStore = useCallback(async () => {
    setIsLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) {
        setError(language === 'ar' ? 'لم يتم العثور على متجر' : 'No store found');
        setIsLoading(false);
        return;
      }

      const { data: store, error: storeError } = await shopifySupabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', storeId)
        .single();

      if (storeError) {
        throw new Error(storeError.message);
      }

      if (!store) {
        setError(language === 'ar' ? 'لم يتم العثور على بيانات المتجر' : 'No store data found');
        setIsLoading(false);
        return;
      }

      setShopifyStore(store);
      setIsLoading(false);
    } catch (e: any) {
      setError(e.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المتجر' : 'Error loading store'));
      toast.error(e.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المتجر' : 'Error loading store'));
      setIsLoading(false);
    }
  }, [getStoreId, language]);

  // Add loadProducts function
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) {
        setError(language === 'ar' ? 'لم يتم العثور على متجر' : 'No store found');
        setIsLoading(false);
        return;
      }

      // Try to get cached products first
      const cachedProducts = localStorage.getItem('shopify_products');
      if (cachedProducts) {
        try {
          const parsed = JSON.parse(cachedProducts);
          setProducts(parsed);
        } catch (e) {
          console.error('Error parsing cached products:', e);
        }
      }

      // Fetch fresh products from Supabase edge function
      const { data, error } = await shopifySupabase.functions.invoke('shopify-get-products', {
        body: { shop: storeId }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.products) {
        setProducts(data.products);
        // Cache products
        localStorage.setItem('shopify_products', JSON.stringify(data.products));
      }

      setIsLoading(false);
    } catch (e: any) {
      setError(e.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المنتجات' : 'Error loading products'));
      toast.error(e.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل المنتجات' : 'Error loading products'));
      setIsLoading(false);
    }
  }, [getStoreId, language]);

  // Add syncForm function
  const syncForm = useCallback(async (formData: ShopifyFormData) => {
    setIsSyncing(true);
    try {
      // Implementation for form sync
      const { data, error } = await shopifySupabase.functions.invoke('shopify-sync-form', {
        body: formData
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsSyncing(false);
      return data;
    } catch (e: any) {
      setError(e.message || (language === 'ar' ? 'حدث خطأ أثناء مزامنة النموذج' : 'Error syncing form'));
      toast.error(e.message || (language === 'ar' ? 'حدث خطأ أثناء مزامنة النموذج' : 'Error syncing form'));
      setIsSyncing(false);
      throw e;
    }
  }, [language]);

  // Add refreshConnection function
  const refreshConnection = useCallback(async (forceRefresh = false) => {
    try {
      const result = await testConnection(forceRefresh);
      return result;
    } catch (e) {
      console.error('Error refreshing connection:', e);
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

  useEffect(() => {
    loadShopifyStore();
  }, [loadShopifyStore]);

  return {
    shopifyStore,
    isLoading,
    error,
    loadShopifyStore,
    // Add all the missing properties
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
    emergencyReset
  };
};

// Utility functions outside the hook
export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  return createClient(supabaseUrl, supabaseKey);
};

export const getShopifyAccessToken = async (shop: string) => {
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

import { useState, useEffect, useCallback } from 'react';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { createClient } from '@supabase/supabase-js';
import { ShopifyStore } from '@/lib/shopify/types';
import { useI18n } from '@/lib/i18n';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
// Removed the import for tokenValidationCache since it was causing issues

// Test store configuration for development
const DEV_TEST_STORE = 'astrem.myshopify.com';
const DEV_TEST_TOKEN = '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';

export const useShopify = () => {
  const [shopifyStore, setShopifyStore] = useState<ShopifyStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useI18n();
  const { isDevMode } = useShopifyConnection();

  // Get the store ID from localStorage or provide a default test value
  const getStoreId = useCallback(() => {
    if (isDevMode) {
      return DEV_TEST_STORE;
    }
    return localStorage.getItem('shopify_store') || DEV_TEST_STORE;
  }, [isDevMode]);

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

  useEffect(() => {
    loadShopifyStore();
  }, [loadShopifyStore]);

  return {
    shopifyStore,
    isLoading,
    error,
    loadShopifyStore,
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

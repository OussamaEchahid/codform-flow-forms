
import { useState, useEffect, useCallback } from 'react';
import { loadShopifyProducts, testShopifyConnection, syncFormWithShopify } from '@/lib/shopify/api';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { ShopifyProduct } from '@/lib/shopify/types';
import { apiLogger } from '@/lib/shopify/debug-logger';

/**
 * Hook for Shopify integration
 */
export function useShopify() {
  const { 
    isConnected,
    shopDomain: shop,
    testConnection,
    isDevMode
  } = useShopifyConnection();
  
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Load products
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    if (!shop) return;
    
    setIsLoadingProducts(true);
    setIsNetworkError(false);
    
    try {
      apiLogger.info(`Fetching products for shop: ${shop}, forceRefresh: ${forceRefresh}`);
      const fetchedProducts = await loadShopifyProducts(shop, forceRefresh);
      setProducts(fetchedProducts);
      setLastRefreshed(new Date());
      apiLogger.info(`Successfully fetched ${fetchedProducts.length} products`);
    } catch (error) {
      apiLogger.error('Error fetching products:', error);
      setIsNetworkError(true);
      toast.error('فشل في تحميل المنتجات');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [shop]);
  
  // Load products on mount or when shop changes
  useEffect(() => {
    if (isConnected && shop) {
      fetchProducts();
    }
  }, [isConnected, shop, fetchProducts]);
  
  // Refresh connection with improved handling
  const refreshConnection = useCallback(async (forceRefresh = false) => {
    if (!shop) return false;
    
    try {
      apiLogger.info(`Refreshing connection for shop: ${shop}, forceRefresh: ${forceRefresh}`);
      const isConnected = await testShopifyConnection(shop);
      
      if (isConnected) {
        apiLogger.info('Connection successful, fetching products');
        fetchProducts(true);
        return true;
      } else {
        apiLogger.warn('Connection test failed');
        return false;
      }
    } catch (error) {
      apiLogger.error('Error refreshing connection:', error);
      setIsNetworkError(true);
      
      // Auto succeed in dev mode
      if (isDevMode) {
        apiLogger.info('Development mode detected, auto-succeeding despite error');
        fetchProducts(true);
        return true;
      }
      
      return false;
    }
  }, [shop, fetchProducts, isDevMode, testShopifyConnection]);
  
  // Sync form with Shopify
  const syncForm = useCallback(async (formId: string) => {
    if (!isConnected || !shop) {
      toast.error('غير متصل بمتجر Shopify');
      return { success: false };
    }
    
    try {
      apiLogger.info(`Syncing form ${formId} with shop ${shop}`);
      const result = await syncFormWithShopify({ formId, shopDomain: shop });
      
      if (result.success) {
        toast.success('تم مزامنة النموذج مع Shopify بنجاح');
        apiLogger.info('Form sync successful');
      } else {
        toast.error(`فشل المزامنة: ${result.error || result.message || 'خطأ غير معروف'}`);
        apiLogger.error('Form sync failed:', result);
      }
      
      return result;
    } catch (error) {
      apiLogger.error('Error syncing form:', error);
      toast.error('حدث خطأ أثناء مزامنة النموذج');
      return { success: false, error };
    }
  }, [isConnected, shop]);
  
  return {
    shop,
    isConnected,
    products,
    isLoadingProducts,
    isNetworkError,
    fetchProducts,
    syncForm,
    refreshConnection,
    lastRefreshed,
    failSafeMode: isDevMode,
    testConnection
  };
}

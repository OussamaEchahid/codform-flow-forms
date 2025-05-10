
import { useState, useEffect, useCallback } from 'react';
import { loadShopifyProducts, testShopifyConnection, ShopifyProduct, syncFormWithShopify } from '@/lib/shopify/api';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

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
      const fetchedProducts = await loadShopifyProducts(shop, forceRefresh);
      setProducts(fetchedProducts);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching products:', error);
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
      const isConnected = await testShopifyConnection(shop);
      if (isConnected) {
        fetchProducts(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing connection:', error);
      setIsNetworkError(true);
      return isDevMode; // Auto succeed in dev mode
    }
  }, [shop, fetchProducts, isDevMode]);
  
  // Sync form with Shopify
  const syncForm = useCallback(async (formId: string) => {
    if (!isConnected || !shop) {
      toast.error('غير متصل بمتجر Shopify');
      return { success: false };
    }
    
    try {
      const result = await syncFormWithShopify({ formId });
      
      if (result.success) {
        toast.success('تم مزامنة النموذج مع Shopify بنجاح');
      } else {
        toast.error(`فشل المزامنة: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error syncing form:', error);
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

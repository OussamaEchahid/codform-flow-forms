import { useState, useEffect, useCallback } from 'react';
import { ShopifyProduct } from '@/lib/shopify/types';
import { shopifyStores, shopifySupabase } from '@/lib/shopify/supabase-client';
import { simpleShopifyConnectionManager } from '@/lib/shopify/simple-connection-manager';
import { toast } from '@/hooks/use-toast';

// Hook مبسط لإدارة Shopify بدون تعقيدات
export const useSimpleShopify = () => {
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  // تحديد المتجر النشط عند بدء التطبيق
  useEffect(() => {
    const store = simpleShopifyConnectionManager.getActiveStore();
    const connected = simpleShopifyConnectionManager.isConnected();
    
    setActiveStore(store);
    setIsConnected(connected);
    
    console.log('Simple Shopify initialized:', { store, connected });
  }, []);

  // تبديل المتجر
  const switchToStore = useCallback((shopDomain: string) => {
    try {
      console.log(`🔄 Switching to store: ${shopDomain}`);
      
      // استخدام المدير المبسط
      simpleShopifyConnectionManager.setActiveStore(shopDomain);
      
      // تحديث الحالة المحلية
      setActiveStore(shopDomain);
      setIsConnected(true);
      setTokenError(false);
      
      // مسح المنتجات للإجبار على إعادة التحميل
      setProducts([]);
      
      toast({
        title: "تم التبديل",
        description: `تم التبديل إلى متجر ${shopDomain}`,
      });
      
      console.log(`✅ Successfully switched to: ${shopDomain}`);
      
      return true;
    } catch (error) {
      console.error('Error switching store:', error);
      toast({
        title: "خطأ في التبديل",
        description: "فشل في تبديل المتجر",
        variant: "destructive"
      });
      return false;
    }
  }, []);

  // قطع الاتصال
  const disconnect = useCallback(() => {
    try {
      console.log('🔌 Disconnecting...');
      
      simpleShopifyConnectionManager.disconnect();
      
      setActiveStore(null);
      setIsConnected(false);
      setProducts([]);
      setTokenError(false);
      
      toast({
        title: "تم قطع الاتصال",
        description: "تم قطع الاتصال من جميع المتاجر",
      });
      
      console.log('✅ Disconnected successfully');
      
      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
      return false;
    }
  }, []);

  // تحميل المنتجات
  const loadProducts = useCallback(async (): Promise<ShopifyProduct[]> => {
    if (!activeStore) {
      console.warn('No active store for loading products');
      return [];
    }

    if (loading) {
      console.log('Already loading products');
      return products;
    }

    setLoading(true);
    setTokenError(false);

    try {
      console.log(`📦 Loading products for: ${activeStore}`);
      
      // الحصول على token من قاعدة البيانات
      const { data: tokenData, error: tokenError } = await shopifyStores()
        .select('*')
        .eq('shop', activeStore)
        .eq('is_active', true)
        .limit(1);

      if (tokenError || !tokenData || tokenData.length === 0) {
        throw new Error(`No valid token found for store: ${activeStore}`);
      }

      const storeRecord = tokenData[0];
      if (!storeRecord.access_token || storeRecord.access_token === 'null') {
        throw new Error(`Invalid access token for store: ${activeStore}`);
      }

      // جلب المنتجات
      const { data, error } = await shopifySupabase.functions.invoke('shopify-products', {
        body: { 
          shop: activeStore, 
          accessToken: storeRecord.access_token,
          limit: 25
        }
      });

      if (error) {
        throw error;
      }

      const fetchedProducts = data?.products || [];
      setProducts(fetchedProducts);
      
      console.log(`✅ Loaded ${fetchedProducts.length} products`);
      
      return fetchedProducts;
    } catch (error) {
      console.error('Error loading products:', error);
      setTokenError(true);
      
      toast({
        title: "خطأ في تحميل المنتجات",
        description: `فشل في تحميل منتجات المتجر ${activeStore}`,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeStore, loading, products]);

  // التحقق من صحة الاتصال
  const verifyConnection = useCallback(async (): Promise<boolean> => {
    if (!activeStore) {
      return false;
    }

    try {
      console.log(`🔍 Verifying connection for: ${activeStore}`);
      
      const { data: tokenData, error } = await shopifyStores()
        .select('access_token')
        .eq('shop', activeStore)
        .eq('is_active', true)
        .limit(1);

      if (error || !tokenData || tokenData.length === 0) {
        setTokenError(true);
        setIsConnected(false);
        return false;
      }

      const hasValidToken = tokenData[0].access_token && tokenData[0].access_token !== 'null';
      
      setTokenError(!hasValidToken);
      setIsConnected(hasValidToken);
      
      console.log(`✅ Connection verification result: ${hasValidToken}`);
      
      return hasValidToken;
    } catch (error) {
      console.error('Error verifying connection:', error);
      setTokenError(true);
      setIsConnected(false);
      return false;
    }
  }, [activeStore]);

  // معلومات التصحيح
  const getDebugInfo = useCallback(() => {
    return {
      ...simpleShopifyConnectionManager.getDebugInfo(),
      hookState: {
        activeStore,
        isConnected,
        tokenError,
        productsCount: products.length,
        loading
      }
    };
  }, [activeStore, isConnected, tokenError, products.length, loading]);

  return {
    // الحالة
    activeStore,
    isConnected,
    products,
    loading,
    tokenError,
    
    // الوظائف
    switchToStore,
    disconnect,
    loadProducts,
    verifyConnection,
    getDebugInfo
  };
};
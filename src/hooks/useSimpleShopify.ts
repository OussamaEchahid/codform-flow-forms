import { useState, useEffect, useCallback } from 'react';
import { ShopifyProduct } from '@/lib/shopify/types';
import { shopifyStores, shopifySupabase } from '@/lib/shopify/supabase-client';
import UnifiedStoreManager from '@/utils/unified-store-manager';
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
    const store = UnifiedStoreManager.getActiveStore();
    const connected = UnifiedStoreManager.isConnected();
    
    setActiveStore(store);
    setIsConnected(connected);
    
    console.log('Simple Shopify initialized:', { store, connected });
  }, []);

  // تبديل المتجر
  const switchToStore = useCallback((shopDomain: string) => {
    try {
      console.log(`🔄 Switching to store: ${shopDomain}`);
      
      // استخدام المدير الموحد
      UnifiedStoreManager.setActiveStore(shopDomain);
      
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
      
      UnifiedStoreManager.clearActiveStore();
      
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
      
      // الحصول على token عبر دالة RPC آمنة
      const { data: token, error: tokenError } = await (shopifySupabase as any)
        .rpc('get_store_access_token', { p_shop: activeStore });

      if (tokenError || !token) {
        throw new Error(`No valid token found for store: ${activeStore}`);
      }

      const accessToken = token as string;

      // جلب المنتجات
      const { data, error } = await shopifySupabase.functions.invoke('shopify-products', {
        body: { 
          shop: activeStore, 
          accessToken,
          limit: 25
        }
      });

      if (error) {
        throw error;
      }

      // التأكد من أن كل معرفات المنتجات هي نصوص (لتسهيل المقارنة لاحقًا)
      const fetchedProducts = (data?.products || []).map((product: any) => ({
        ...product,
        id: String(product.id),
        variants: (product.variants || []).map((variant: any) => ({
          ...variant,
          id: String(variant.id)
        }))
      }));
      
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
      
      const { data: token, error } = await (shopifySupabase as any)
        .rpc('get_store_access_token', { p_shop: activeStore });

      if (error || !token) {
        setTokenError(true);
        setIsConnected(false);
        return false;
      }

      const hasValidToken = typeof token === 'string' && token.length > 0;
      
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
      ...UnifiedStoreManager.getDiagnosticInfo(),
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
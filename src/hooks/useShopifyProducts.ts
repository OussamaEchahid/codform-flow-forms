import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  image?: string;
  variants: any[];
}

export const useShopifyProducts = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  const loadProducts = async (shopDomain?: string, forceRefresh = false) => {
    // استخدام UnifiedStoreManager للحصول على المتجر النشط
    const currentStore = shopDomain || 
      localStorage.getItem('current_shopify_store') ||
      localStorage.getItem('simple_active_store') ||
      localStorage.getItem('shopify_store') ||
      localStorage.getItem('active_shop');
    
    if (!currentStore) {
      setError('No store connected');
      return [];
    }

    // Avoid frequent requests - only refresh if forced or after 10 seconds
    const now = Date.now();
    if (!forceRefresh && (now - lastRefresh) < 10000 && products.length > 0) {
      console.log('🚀 Using cached products');
      return products;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🛍️ Loading products for store:', currentStore, forceRefresh ? '(forced)' : '');
      
      // Try shopify-products first, fall back to shopify-products-fixed
      let data, supabaseError;
      
      try {
        const response = await supabase.functions.invoke('shopify-products', {
          body: { 
            shop: currentStore,
            refresh: forceRefresh
          }
        });
        data = response.data;
        supabaseError = response.error;
      } catch (primaryError) {
        console.log('Primary function failed, trying backup...', primaryError);
        const fallbackResponse = await supabase.functions.invoke('shopify-products-fixed', {
          body: { 
            shop: currentStore
          }
        });
        data = fallbackResponse.data;
        supabaseError = fallbackResponse.error;
      }

      if (supabaseError) {
        throw supabaseError;
      }

      if (data?.success && data?.products) {
        setProducts(data.products);
        setLastRefresh(now);
        console.log('✅ Products loaded:', data.products.length);
        return data.products;
      } else {
        throw new Error(data?.error || 'Failed to load products');
      }
    } catch (err: any) {
      console.error('❌ Error loading products:', err);
      setError(err.message || 'Failed to load products');
      
      // Keep existing products if reload fails
      if (products.length > 0 && !forceRefresh) {
        console.log('🔄 Keeping existing products after error');
        return products;
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getProductById = async (productId: string, shopDomain?: string) => {
    // استخدام نفس المنطق المستخدم في loadProducts للحصول على المتجر النشط
    const currentStore = shopDomain || 
      localStorage.getItem('current_shopify_store') ||
      localStorage.getItem('simple_active_store') ||
      localStorage.getItem('shopify_store') ||
      localStorage.getItem('active_shop');
    
    if (!currentStore) {
      throw new Error('No store connected');
    }

    try {
      const { data, error } = await supabase.functions.invoke('shopify-products-fixed', {
        body: { 
          shop: currentStore,
          productId
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.product) {
        return data.product;
      } else {
        throw new Error(data?.error || 'Product not found');
      }
    } catch (err: any) {
      console.error('❌ Error getting product:', err);
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    loadProducts,
    getProductById
  };
};
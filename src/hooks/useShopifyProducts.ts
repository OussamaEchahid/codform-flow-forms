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

  const loadProducts = async () => {
    const currentStore = localStorage.getItem('current_shopify_store');
    
    if (!currentStore) {
      setError('No store connected');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🛍️ Loading products for store:', currentStore);
      
      const { data, error: supabaseError } = await supabase.functions.invoke('shopify-products-fixed', {
        body: { 
          shop: currentStore
        }
      });

      if (supabaseError) {
        throw supabaseError;
      }

      if (data?.success && data?.products) {
        setProducts(data.products);
        console.log('✅ Products loaded:', data.products.length);
        return data.products;
      } else {
        throw new Error(data?.error || 'Failed to load products');
      }
    } catch (err: any) {
      console.error('❌ Error loading products:', err);
      setError(err.message || 'Failed to load products');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getProductById = async (productId: string) => {
    const currentStore = localStorage.getItem('current_shopify_store');
    
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

import { useState, useEffect } from 'react';
import { createShopifyAPI } from '@/lib/shopify/api';
import { ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export const useShopify = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { shop, shopifyConnected } = useAuth();

  // Fetch products when shop connection changes
  useEffect(() => {
    if (shopifyConnected && shop) {
      fetchProducts();
    } else {
      // Reset products when disconnected
      setProducts([]);
    }
  }, [shopifyConnected, shop]);

  const fetchProducts = async () => {
    if (!shopifyConnected || !shop) {
      setError('Shopify connection not established');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Get store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (storeError || !storeData) {
        throw new Error('Could not retrieve store access token');
      }

      // Create API instance with token and shop domain
      const api = createShopifyAPI(storeData.access_token, shop);
      const fetchedProducts = await api.getProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const syncFormWithShopify = async (formData: ShopifyFormData) => {
    if (!shopifyConnected || !shop) {
      throw new Error('Shopify connection not established');
    }

    setIsSyncing(true);
    setError(null);
    try {
      // Get store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (storeError || !storeData) {
        throw new Error('Could not retrieve store access token');
      }

      // Create API instance with token and shop domain
      const api = createShopifyAPI(storeData.access_token, shop);
      await api.setupAutoSync(formData);
      
      // Save the form-shop association
      await supabase
        .from('forms')
        .update({ shop_id: shop })
        .eq('id', formData.formId);

      toast.success('تم مزامنة النموذج مع Shopify بنجاح');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في مزامنة بيانات النموذج';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    products,
    isLoading,
    error,
    syncFormWithShopify,
    fetchProducts,
    isConnected: !!shopifyConnected,
    isSyncing
  };
};

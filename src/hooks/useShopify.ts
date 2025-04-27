
import { useState, useEffect } from 'react';
import { createShopifyAPI } from '@/lib/shopify/api';
import { ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

export const useShopify = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { shop, shopifyConnected } = useAuth();

  useEffect(() => {
    if (shopifyConnected && shop) {
      const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Fix: Pass both shop (accessToken) and shopDomain as required parameters
          const api = createShopifyAPI(shop, shop);
          const fetchedProducts = await api.getProducts();
          setProducts(fetchedProducts);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch products');
        } finally {
          setIsLoading(false);
        }
      };

      fetchProducts();
    }
  }, [shopifyConnected, shop]);

  const syncFormWithShopify = async (formData: ShopifyFormData) => {
    if (!shopifyConnected || !shop) {
      throw new Error('Shopify connection not established');
    }

    setIsSyncing(true);
    setError(null);
    try {
      // Fix: Pass both shop (accessToken) and shopDomain as required parameters
      const api = createShopifyAPI(shop, shop);
      await api.setupAutoSync(formData);
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
    isConnected: !!shopifyConnected,
    isSyncing
  };
};

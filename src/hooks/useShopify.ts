
import { useState, useEffect } from 'react';
import { createShopifyAPI } from '@/lib/shopify/api';
import { ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';

export const useShopify = (accessToken?: string, shopDomain?: string) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken && shopDomain) {
      const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const api = createShopifyAPI(accessToken, shopDomain);
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
  }, [accessToken, shopDomain]);

  const syncFormWithShopify = async (formData: ShopifyFormData) => {
    if (!accessToken || !shopDomain) {
      throw new Error('Shopify credentials not provided');
    }

    setIsLoading(true);
    setError(null);
    try {
      const api = createShopifyAPI(accessToken, shopDomain);
      await api.syncFormData(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync form data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    isLoading,
    error,
    syncFormWithShopify,
  };
};

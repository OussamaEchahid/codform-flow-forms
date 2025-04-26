
import { useState, useEffect } from 'react';
import { createShopifyAPI } from '@/lib/shopify/api';
import { ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { toast } from 'sonner';

export const useShopify = (accessToken?: string, shopDomain?: string) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (accessToken && shopDomain) {
      const verifyConnection = async () => {
        try {
          const api = createShopifyAPI(accessToken, shopDomain);
          const isVerified = await api.verifyConnection();
          setIsConnected(isVerified);
        } catch (err) {
          setIsConnected(false);
          setError('Failed to verify Shopify connection');
        }
      };

      verifyConnection();
    }
  }, [accessToken, shopDomain]);

  useEffect(() => {
    if (accessToken && shopDomain && isConnected) {
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
  }, [accessToken, shopDomain, isConnected]);

  const syncFormWithShopify = async (formData: ShopifyFormData) => {
    if (!accessToken || !shopDomain) {
      throw new Error('Shopify credentials not provided');
    }

    setIsSyncing(true);
    setError(null);
    try {
      const api = createShopifyAPI(accessToken, shopDomain);
      await api.setupAutoSync(formData);
      toast.success('Form synced with Shopify successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync form data';
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
    isConnected,
    isSyncing
  };
};

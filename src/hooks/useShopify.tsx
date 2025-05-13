
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { cleanShopifyDomain, ShopifyStoreConnection, ProductSettingsRequest } from '@/lib/shopify/types';
import { ShopifyConnectionManager } from '@/lib/shopify/types';
import { shopifySupabase, shopifyStores, shopifyProductSettings } from '@/lib/shopify/supabase-client';
import { getFormIdForProduct } from '@/pages/api/shopify/product-settings'; // Import the function

// Local storage keys
const SHOPIFY_STORES_KEY = 'shopify_stores';
const ACTIVE_STORE_KEY = 'shopify_store';
const SHOPIFY_LAST_URL_SHOP = 'shopify_last_url_shop';

// Implementation of ShopifyConnectionManager
class LocalShopifyConnectionManager implements ShopifyConnectionManager {
  stores: ShopifyStoreConnection[] = [];
  
  constructor() {
    this.loadStores();
  }
  
  private loadStores() {
    try {
      const storesJson = localStorage.getItem(SHOPIFY_STORES_KEY);
      if (storesJson) {
        this.stores = JSON.parse(storesJson);
      }
    } catch (e) {
      console.error('Error loading Shopify stores from localStorage:', e);
      this.stores = [];
    }
  }
  
  private saveStores() {
    try {
      localStorage.setItem(SHOPIFY_STORES_KEY, JSON.stringify(this.stores));
    } catch (e) {
      console.error('Error saving Shopify stores to localStorage:', e);
    }
  }
  
  addOrUpdateStore(shopDomain: string, isActive: boolean = true, forceUpdate: boolean = false): void {
    const cleanDomain = cleanShopifyDomain(shopDomain);
    if (!cleanDomain) return;
    
    const existingStoreIndex = this.stores.findIndex(store => cleanShopifyDomain(store.domain) === cleanDomain);
    
    if (existingStoreIndex >= 0) {
      if (forceUpdate || isActive) {
        this.stores[existingStoreIndex] = {
          ...this.stores[existingStoreIndex],
          lastConnected: new Date().toISOString(),
          isActive: isActive
        };
      }
    } else {
      this.stores.push({
        domain: cleanDomain,
        lastConnected: new Date().toISOString(),
        isActive: isActive,
        shop: cleanDomain
      });
    }
    
    this.saveStores();
    
    if (isActive) {
      this.setActiveStore(cleanDomain);
    }
  }
  
  getActiveStore(): string | null {
    try {
      return localStorage.getItem(ACTIVE_STORE_KEY);
    } catch (e) {
      console.error('Error getting active Shopify store from localStorage:', e);
      return null;
    }
  }
  
  setActiveStore(shopDomain: string): void {
    const cleanDomain = cleanShopifyDomain(shopDomain);
    if (!cleanDomain) return;
    
    try {
      localStorage.setItem(ACTIVE_STORE_KEY, cleanDomain);
      
      // Update isActive flag on all stores
      this.stores = this.stores.map(store => ({
        ...store,
        isActive: cleanShopifyDomain(store.domain) === cleanDomain
      }));
      
      this.saveStores();
    } catch (e) {
      console.error('Error setting active Shopify store in localStorage:', e);
    }
  }
  
  getAllStores(): ShopifyStoreConnection[] {
    return [...this.stores];
  }
  
  removeStore(domain: string): void {
    const cleanDomain = cleanShopifyDomain(domain);
    if (!cleanDomain) return;
    
    this.stores = this.stores.filter(store => cleanShopifyDomain(store.domain) !== cleanDomain);
    this.saveStores();
    
    // If we removed the active store, clear it
    if (this.getActiveStore() === cleanDomain) {
      localStorage.removeItem(ACTIVE_STORE_KEY);
    }
  }
  
  clearAllStores(): void {
    this.stores = [];
    this.saveStores();
    localStorage.removeItem(ACTIVE_STORE_KEY);
  }
  
  clearAllStoresExcept(shopDomain: string): void {
    const cleanDomain = cleanShopifyDomain(shopDomain);
    if (!cleanDomain) {
      this.clearAllStores();
      return;
    }
    
    const storeToKeep = this.stores.find(store => cleanShopifyDomain(store.domain) === cleanDomain);
    
    if (storeToKeep) {
      this.stores = [{ ...storeToKeep, isActive: true }];
      this.saveStores();
      this.setActiveStore(cleanDomain);
    } else {
      this.clearAllStores();
    }
  }
  
  saveLastUrlShop(shopDomain: string): void {
    try {
      const cleanDomain = cleanShopifyDomain(shopDomain);
      if (cleanDomain) {
        localStorage.setItem(SHOPIFY_LAST_URL_SHOP, cleanDomain);
      }
    } catch (e) {
      console.error('Error saving last URL shop to localStorage:', e);
    }
  }
  
  getLastUrlShop(): string | null {
    try {
      return localStorage.getItem(SHOPIFY_LAST_URL_SHOP);
    } catch (e) {
      console.error('Error getting last URL shop from localStorage:', e);
      return null;
    }
  }
}

const connectionManager = new LocalShopifyConnectionManager();

export function useShopify() {
  const { user, shopifyConnected, setShopifyConnected, shop, setShop } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<boolean>(false);
  const [failSafeMode, setFailSafeMode] = useState<boolean>(
    localStorage.getItem('shopify_failsafe_mode') === 'true'
  );
  
  // Toggle fail-safe mode
  const toggleFailSafeMode = useCallback((enabled: boolean) => {
    setFailSafeMode(enabled);
    localStorage.setItem('shopify_failsafe_mode', enabled ? 'true' : 'false');
  }, []);
  
  // Function to get products from Shopify
  const getProducts = useCallback(async (forceRefresh = false) => {
    try {
      const activeShop = connectionManager.getActiveStore();
      if (!activeShop) {
        setError('No active Shopify store');
        return [];
      }
      
      // In development or fail-safe mode, return mock data
      if (process.env.NODE_ENV === 'development' || failSafeMode) {
        return MOCK_PRODUCTS;
      }
      
      // Make API call to get products
      const endpoint = `/api/shopify/products?shop=${encodeURIComponent(activeShop)}&forceRefresh=${forceRefresh}`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      
      const data = await response.json();
      return data.products || [];
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to fetch products');
      setTokenError(true);
      toggleFailSafeMode(true);
      return MOCK_PRODUCTS; // Return mock data as fallback
    }
  }, [failSafeMode, toggleFailSafeMode]);
  
  // Function to get orders from Shopify
  const getOrders = useCallback(async (status = 'any') => {
    try {
      const activeShop = connectionManager.getActiveStore();
      if (!activeShop) {
        setError('No active Shopify store');
        return [];
      }
      
      // In development or fail-safe mode, return mock data
      if (process.env.NODE_ENV === 'development' || failSafeMode) {
        return MOCK_ORDERS;
      }
      
      // Make API call to get orders
      const endpoint = `/api/shopify/orders?shop=${encodeURIComponent(activeShop)}&status=${status}`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }
      
      const data = await response.json();
      return data.orders || [];
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
      setTokenError(true);
      toggleFailSafeMode(true);
      return MOCK_ORDERS; // Return mock data as fallback
    }
  }, [failSafeMode, toggleFailSafeMode]);
  
  // Function to save product settings
  const saveProductSettings = useCallback(async (settings: ProductSettingsRequest) => {
    try {
      const activeShop = connectionManager.getActiveStore();
      if (!activeShop) {
        throw new Error('No active Shopify store');
      }
      
      // For development or fail-safe mode, use local Supabase client
      if (process.env.NODE_ENV === 'development' || failSafeMode) {
        // Save settings to Supabase directly
        const { data, error } = await shopifyProductSettings().upsert({
          shop_id: activeShop,
          product_id: settings.productId,
          form_id: settings.formId,
          block_id: settings.blockId || `codform-${Math.random().toString(36).substring(2, 10)}`,
          enabled: settings.enabled ?? true
        }, {
          onConflict: 'shop_id,product_id',
          ignoreDuplicates: false
        });
        
        if (error) throw error;
        
        // Update the form with the productId
        const formUpdate = await shopifySupabase
          .from('forms')
          .update({ productId: settings.productId })
          .eq('id', settings.formId);
        
        if (formUpdate.error) console.warn('Warning: Could not update form with product ID');
        
        return { success: true };
      } else {
        // Make API call to save settings
        const response = await fetch('/api/shopify/product-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopId: activeShop,
            ...settings
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save product settings');
        }
        
        return await response.json();
      }
    } catch (error: any) {
      console.error('Error saving product settings:', error);
      setError(error.message || 'Failed to save product settings');
      return { error: error.message || 'Failed to save product settings' };
    }
  }, [failSafeMode]);
  
  // Function to get the form ID for a specific product
  const fetchFormIdForProduct = useCallback(async (productId: string): Promise<string | null> => {
    try {
      const activeShop = connectionManager.getActiveStore();
      if (!activeShop || !productId) {
        return null;
      }
      
      // For development or fail-safe mode, use local Supabase client
      if (process.env.NODE_ENV === 'development' || failSafeMode) {
        const { data, error } = await shopifyProductSettings()
          .select('form_id')
          .eq('shop_id', activeShop)
          .eq('product_id', productId)
          .eq('enabled', true)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching form ID:', error);
          return null;
        }
        
        return data?.form_id || null;
      } else {
        // Use the API function
        return await getFormIdForProduct(activeShop, productId);
      }
    } catch (error) {
      console.error('Error fetching form ID for product:', error);
      return null;
    }
  }, [failSafeMode]);
  
  // Initialize
  useEffect(() => {
    if (initialized) return;
    
    const initializeShopify = async () => {
      setLoading(true);
      
      // Check if we have an active store in the connection manager
      const activeStore = connectionManager.getActiveStore();
      
      if (activeStore) {
        // If we have an active store, set it in the auth context
        setShopifyConnected(true);
        setShop(activeStore);
        localStorage.setItem('shopify_connected', 'true');
      } else {
        // If we don't have an active store, check if we have one from the URL
        const lastUrlShop = connectionManager.getLastUrlShop();
        if (lastUrlShop) {
          connectionManager.addOrUpdateStore(lastUrlShop, true);
          setShopifyConnected(true);
          setShop(lastUrlShop);
          localStorage.setItem('shopify_connected', 'true');
        }
      }
      
      setInitialized(true);
      setLoading(false);
    };
    
    initializeShopify();
  }, [initialized, setShopifyConnected, setShop]);
  
  return {
    connectionManager,
    loading,
    error,
    tokenError,
    failSafeMode,
    toggleFailSafeMode,
    getProducts,
    getOrders,
    saveProductSettings,
    fetchFormIdForProduct,
  };
}

// Mock data for development / fail-safe mode
const MOCK_PRODUCTS = [
  {
    id: 'gid://shopify/Product/1',
    title: 'منتج تجريبي 1',
    handle: 'sample-product-1',
    price: '99.99',
    images: ['https://placehold.co/600x400'],
    variants: [{ id: 'gid://shopify/ProductVariant/1', title: 'Default', price: '99.99', available: true }]
  },
  {
    id: 'gid://shopify/Product/2',
    title: 'منتج تجريبي 2',
    handle: 'sample-product-2',
    price: '49.99',
    images: ['https://placehold.co/600x400'],
    variants: [{ id: 'gid://shopify/ProductVariant/2', title: 'Default', price: '49.99', available: true }]
  },
  {
    id: 'gid://shopify/Product/3',
    title: 'منتج تجريبي 3',
    handle: 'sample-product-3',
    price: '149.99',
    images: ['https://placehold.co/600x400'],
    variants: [{ id: 'gid://shopify/ProductVariant/3', title: 'Default', price: '149.99', available: true }]
  }
];

const MOCK_ORDERS = [
  {
    id: 'gid://shopify/Order/1001',
    orderNumber: '1001',
    totalPrice: '99.99',
    createdAt: new Date().toISOString(),
    customer: { firstName: 'أحمد', lastName: 'محمد', email: 'ahmed@example.com' },
    lineItems: [{ title: 'منتج تجريبي 1', quantity: 1, price: '99.99' }]
  },
  {
    id: 'gid://shopify/Order/1002',
    orderNumber: '1002',
    totalPrice: '149.98',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    customer: { firstName: 'محمد', lastName: 'علي', email: 'mohamed@example.com' },
    lineItems: [{ title: 'منتج تجريبي 2', quantity: 3, price: '49.99' }]
  }
];

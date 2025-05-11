/**
 * Type definitions for Shopify integration
 */

// Product related types
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  images?: string[];
  price?: string;
  variants?: ShopifyVariant[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  available: boolean;
}

// Store connection types
export interface ShopifyStoreConnection {
  domain: string;
  shop: string;
  isActive: boolean;
  lastConnected?: string;
}

export interface ShopifyStore {
  id: string;
  shop: string;
  access_token: string;
  token_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form settings types
export interface ShopifyFormData {
  formId: string;
  shopDomain?: string;
  productId?: string;
  blockId?: string;
  settings?: {
    position?: string;
    style?: any;
  };
}

// API response types
export interface ShopifyApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
  shopName?: string;
}

// Product settings request/response
export interface ProductSettingsRequest {
  formId: string;
  shopId?: string;
  productId?: string;
  enabled?: boolean;
  blockId?: string;
}

export interface ProductSettingsResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  blockId?: string;
}

/**
 * Clean and normalize a Shopify store domain
 * @param shop The shop domain to clean
 * @returns The cleaned and normalized shop domain
 */
export function cleanShopifyDomain(shop: string): string {
  if (!shop) return "";
  
  let cleanedShop = shop.trim();
  
  // Remove protocol if present
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // Ensure it ends with myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

// Add this to the global Window interface
declare global {
  interface Window {
    __fetchProductsRef?: (forceRefresh: boolean) => Promise<any>;
  }
}

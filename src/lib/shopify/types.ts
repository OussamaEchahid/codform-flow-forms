
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

// Form settings types
export interface ShopifyFormData {
  formId: string;
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

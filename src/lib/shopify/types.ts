
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  product_type?: string;
  price?: string;
  image?: {
    src: string;
    alt?: string;
  };
  images?: Array<{
    src: string;
    alt?: string;
  }>;
  variants?: Array<{
    id: string;
    title: string;
    price: string;
    compare_at_price?: string;
    inventory_quantity?: number;
    available?: boolean;
  }>;
}

export interface ShopifyStoreConnection {
  domain: string;
  shop: string;
  isActive: boolean;
  lastConnected?: string;
}

export interface ProductSettingsRequest {
  productId: string;
  formId: string;
  blockId?: string;
  enabled?: boolean;
}

export interface ProductSettingsResponse {
  success?: boolean;
  error?: string;
  productId?: string;
  formId?: string;
  blockId?: string;
}

export interface ShopifyStore {
  id: string;
  shop: string;
  access_token: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopifyOrder {
  id: string;
  order_number: number;
  total_price: string;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ShopifyFormData {
  formId: string;
  shopDomain: string;
  settings?: Record<string, any>;
}

// Function to clean Shopify domain (remove https://, trailing slashes, etc)
export function cleanShopifyDomain(domain: string): string {
  if (!domain) return '';
  
  // Remove protocol
  let clean = domain.replace(/^https?:\/\//, '');
  
  // Remove trailing slashes
  clean = clean.replace(/\/+$/, '');
  
  // Remove path if any
  clean = clean.split('/')[0];
  
  return clean;
}

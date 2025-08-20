export interface ShopifyStore {
  id: string;
  shop: string;
  access_token: string | null;
  token_type: string | null;
  scope: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  connectionStatus?: 'connected' | 'error' | 'disconnected';
}

export interface ShopifyStoreConnection {
  domain: string;
  shop: string;
  isActive: boolean;
  lastConnected: string;
}

export interface ShopifyProductSettings {
  id: string;
  form_id: string;
  product_id: string;
  shop_id: string;
  block_id: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopifyFormInsertion {
  id: string;
  form_id: string;
  shop_id: string;
  position: string;
  block_id: string | null;
  theme_type: string;
  insertion_method: string;
  created_at: string;
  updated_at: string;
}

export interface BlockedIP {
  id: string;
  shop_id: string;
  ip_address: string;
  reason: string;
  redirect_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedCountry {
  id: string;
  shop_id: string;
  country_code: string;
  country_name: string;
  reason: string;
  redirect_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductSettingsRequest {
  productId: string;
  formId: string; // This is used as a string in requests but will be converted to UUID
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

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description?: string;
  price?: string;
  compareAtPrice?: string;
  image?: {
    src: string;
    alt?: string;
  } | string;
  images?: Array<string>;
  featuredImage?: string;
  status: 'active' | 'draft' | 'archived';
  variants?: Array<{
    id: string;
    title: string;
    price: string;
    available: boolean;
    inventory_quantity?: number;
  }>;
  currency?: string;
  money_format?: string;
  money_with_currency_format?: string;
}

export interface ShopifyOrder {
  id: string;
  order_number: string;
  created_at: string;
  total_price: string;
  line_items: any[];
  customer: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface ShopifyFormData {
  id: string;
  title: string;
  fields: any[];
  settings: any;
  formId?: string;
}

export interface ShopifyUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

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

export interface ProductAssociation {
  productId: string;
  productTitle: string;
  formId: string;
  formTitle: string;
  productImage?: string;
  status?: 'active' | 'draft' | 'archived';
  lastUpdated?: string;
}

export interface ProductFormConflict {
  productId: string;
  productTitle: string;
  existingFormId: string;
  existingFormTitle: string;
  newFormId: string;
  newFormTitle: string;
  productImage?: string;
}

export function ensureUUID(id: string | undefined): string | undefined {
  if (!id) return undefined;
  
  // If it's already a valid UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  
  // Only log warnings in development environment
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Invalid UUID format detected: ${id}`);
  }
  
  return id;
}

export function isValidUUID(id: string | undefined): boolean {
  if (!id) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

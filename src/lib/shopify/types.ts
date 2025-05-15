
export interface ShopifyStore {
  id: string;
  shop: string;
  access_token: string | null;
  token_type: string | null;
  scope: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  images?: Array<{
    src: string;
    alt?: string;
  } | string>;
  status: 'active' | 'draft' | 'archived';
  variants?: Array<{
    id: string;
    title: string;
    price: string;
    available: boolean;
    inventory_quantity?: number;
  }>;
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

// Export the function directly
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

// Add a new interface for product associations
export interface ProductAssociation {
  productId: string;
  productTitle: string;
  formId: string;
  formTitle: string;
}

// Add a type for product conflict detection
export interface ProductFormConflict {
  productId: string;
  productTitle: string;
  existingFormId: string;
  existingFormTitle: string;
  newFormId: string;
  newFormTitle: string;
}

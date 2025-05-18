
// ShopifyProduct interface
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  price: string;
  images: string[];
  tags?: string[] | string;
  variants: Array<{
    id: string;
    title: string;
    price?: string;
    available?: boolean;
  }>;
}

// Order interface
export interface ShopifyOrder {
  id: string;
  order_number: string;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  total_price: string;
  line_items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: string;
  }>;
}

// Form data for Shopify integration
export interface ShopifyFormData {
  formId: string;
  shopDomain?: string;
  settings: {
    position?: 'product-page' | 'cart-page' | 'checkout';
    blockId?: string;
    products?: string[];
    themeType?: 'os2' | 'traditional' | 'auto-detect';
    insertionMethod?: 'auto' | 'manual';
  };
}

// Store connection interface
export interface ShopifyStoreConnection {
  domain: string;
  shop: string;
  isActive: boolean;
  lastConnected?: string;
}

// Helper function to clean Shopify domain
export function cleanShopifyDomain(domain: string): string {
  if (!domain) return '';
  
  // Remove protocol if present
  let cleanDomain = domain.replace(/^https?:\/\//, '');
  
  // Remove trailing slash if present
  cleanDomain = cleanDomain.replace(/\/$/, '');
  
  // Ensure domain includes myshopify.com
  if (!cleanDomain.includes('myshopify.com')) {
    cleanDomain = `${cleanDomain}.myshopify.com`;
  }
  
  return cleanDomain;
}

// Product settings request/response types
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

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  product_type?: string;
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
  }>;
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

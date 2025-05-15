
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
  };
  images?: Array<{
    src: string;
    alt?: string;
  }>;
  status: 'active' | 'draft' | 'archived';
}

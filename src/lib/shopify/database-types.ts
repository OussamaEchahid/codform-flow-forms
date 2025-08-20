
// These types represent the Shopify tables in our Supabase database

export interface ShopifyStore {
  id: string;
  shop: string;
  access_token: string | null;
  token_type: string | null;
  scope: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  currency?: string | null;
  money_format?: string | null;
  money_with_currency_format?: string | null;
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

export interface QuantityOffer {
  id: string;
  shop_id: string;
  product_id: string;
  form_id: string;
  offers: Array<{
    id: string;
    text: string;
    tag: string;
    quantity: number;
    discountType: 'none' | 'fixed' | 'percentage';
    discountValue?: number;
  }>;
  styling: {
    backgroundColor: string;
    textColor: string;
    tagColor: string;
    priceColor: string;
  };
  position: 'before_form' | 'inside_form' | 'after_form';
  enabled: boolean;
  custom_selector?: string | null;
  created_at: string;
  updated_at: string;
}

// Custom Database type that includes our tables
export interface Database {
  public: {
    Tables: {
      shopify_stores: {
        Row: ShopifyStore;
        Insert: Omit<ShopifyStore, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ShopifyStore, 'id' | 'created_at' | 'updated_at'>>;
      };
      shopify_product_settings: {
        Row: ShopifyProductSettings;
        Insert: Omit<ShopifyProductSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ShopifyProductSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      shopify_form_insertion: {
        Row: ShopifyFormInsertion;
        Insert: Omit<ShopifyFormInsertion, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ShopifyFormInsertion, 'id' | 'created_at' | 'updated_at'>>;
      };
      quantity_offers: {
        Row: QuantityOffer;
        Insert: Omit<QuantityOffer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<QuantityOffer, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

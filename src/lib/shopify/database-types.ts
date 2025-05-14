
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
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

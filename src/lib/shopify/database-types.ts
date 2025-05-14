
// These types represent the Shopify tables in our Supabase database

export interface ShopifyStore {
  id: string;
  shop: string;
  access_token: string | null;
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

export interface ShopifyCachedProducts {
  id: string;
  shop: string;
  products: any[];
  updated_at: string;
}

// Custom Database type that includes our tables
export interface Database {
  public: {
    Tables: {
      shopify_shops: {
        Row: ShopifyStore;
        Insert: Omit<ShopifyStore, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ShopifyStore, 'id' | 'created_at' | 'updated_at'>>;
      };
      shopify_product_settings: {
        Row: ShopifyProductSettings;
        Insert: Omit<ShopifyProductSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ShopifyProductSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      shopify_cached_products: {
        Row: ShopifyCachedProducts;
        Insert: Omit<ShopifyCachedProducts, 'id' | 'updated_at'>;
        Update: Partial<Omit<ShopifyCachedProducts, 'id' | 'updated_at'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

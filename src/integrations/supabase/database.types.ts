
import { Database as ShopifyDatabase } from '@/lib/shopify/database-types';
import { Json } from './types';

// Extend the shopify database types with additional tables
export interface Database extends ShopifyDatabase {
  public: {
    Tables: {
      shopify_shops: ShopifyDatabase['public']['Tables']['shopify_shops'];
      shopify_product_settings: ShopifyDatabase['public']['Tables']['shopify_product_settings'];
      shopify_cached_products: ShopifyDatabase['public']['Tables']['shopify_cached_products'];
      
      // Add other tables used in the main application
      forms: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          data: Json;
          is_published: boolean;
          created_at: string;
          user_id: string;
          shop_id?: string | null;
          style?: Json | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          data: Json;
          is_published?: boolean;
          created_at?: string;
          user_id: string;
          shop_id?: string | null;
          style?: Json | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          data?: Json;
          is_published?: boolean;
          created_at?: string;
          user_id?: string;
          shop_id?: string | null;
          style?: Json | null;
        };
        Relationships: [];
      };
      
      form_submissions: {
        Row: {
          id: string;
          form_id: string;
          data: Json;
          created_at: string;
          user_id?: string | null;
        };
        Insert: {
          id?: string;
          form_id: string;
          data: Json;
          created_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          form_id?: string;
          data?: Json;
          created_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

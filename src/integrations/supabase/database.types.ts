
import { Json } from './types';

// Database types that match the actual Supabase schema
export interface Database {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          data: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
          shop_id: string | null;
          style: Json | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          data: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
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
          updated_at?: string;
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
          user_id: string | null;
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

      shopify_stores: {
        Row: {
          id: string;
          shop: string;
          access_token: string | null;
          token_type: string | null;
          scope: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop: string;
          access_token?: string | null;
          token_type?: string | null;
          scope?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop?: string;
          access_token?: string | null;
          token_type?: string | null;
          scope?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      shopify_product_settings: {
        Row: {
          id: string;
          form_id: string;
          product_id: string;
          shop_id: string;
          block_id: string | null;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          product_id: string;
          shop_id: string;
          block_id?: string | null;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          product_id?: string;
          shop_id?: string;
          block_id?: string | null;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      shopify_form_insertion: {
        Row: {
          id: string;
          form_id: string;
          shop_id: string;
          position: string;
          block_id: string | null;
          theme_type: string;
          insertion_method: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          shop_id: string;
          position: string;
          block_id?: string | null;
          theme_type: string;
          insertion_method: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          shop_id?: string;
          position?: string;
          block_id?: string | null;
          theme_type?: string;
          insertion_method?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      quantity_offers: {
        Row: {
          id: string;
          form_id: string;
          product_id: string;
          shop_id: string;
          offers: Json;
          styling: Json;
          position: string;
          enabled: boolean;
          custom_selector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          product_id: string;
          shop_id: string;
          offers: Json;
          styling: Json;
          position?: string;
          enabled?: boolean;
          custom_selector?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          product_id?: string;
          shop_id?: string;
          offers?: Json;
          styling?: Json;
          position?: string;
          enabled?: boolean;
          custom_selector?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      associate_product_with_form: {
        Args: {
          p_shop_id: string;
          p_product_id: string;
          p_form_id: string;
          p_block_id?: string;
          p_enabled?: boolean;
        };
        Returns: string;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}

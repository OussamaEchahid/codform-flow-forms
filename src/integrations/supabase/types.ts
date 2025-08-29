export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_items: Json | null
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          form_data: Json | null
          form_id: string | null
          id: string
          last_activity: string | null
          recovery_attempts: number | null
          shop_id: string | null
          total_value: number | null
          updated_at: string
        }
        Insert: {
          cart_items?: Json | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          form_data?: Json | null
          form_id?: string | null
          id?: string
          last_activity?: string | null
          recovery_attempts?: number | null
          shop_id?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          cart_items?: Json | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          form_data?: Json | null
          form_id?: string | null
          id?: string
          last_activity?: string | null
          recovery_attempts?: number | null
          shop_id?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      advertising_pixels: {
        Row: {
          access_token: string | null
          conversion_api_enabled: boolean | null
          created_at: string
          enabled: boolean | null
          event_type: string
          id: string
          name: string
          pixel_id: string
          platform: string
          shop_id: string
          target_id: string | null
          target_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          conversion_api_enabled?: boolean | null
          created_at?: string
          enabled?: boolean | null
          event_type?: string
          id?: string
          name: string
          pixel_id: string
          platform: string
          shop_id: string
          target_id?: string | null
          target_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          conversion_api_enabled?: boolean | null
          created_at?: string
          enabled?: boolean | null
          event_type?: string
          id?: string
          name?: string
          pixel_id?: string
          platform?: string
          shop_id?: string
          target_id?: string | null
          target_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_countries: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          reason: string | null
          redirect_url: string | null
          shop_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          redirect_url?: string | null
          shop_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          redirect_url?: string | null
          shop_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          reason: string | null
          redirect_url: string | null
          shop_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
          reason?: string | null
          redirect_url?: string | null
          shop_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
          reason?: string | null
          redirect_url?: string | null
          shop_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      currency_display_settings: {
        Row: {
          created_at: string
          decimal_places: number
          shop_id: string
          show_symbol: boolean
          symbol_position: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          decimal_places?: number
          shop_id: string
          show_symbol?: boolean
          symbol_position?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          decimal_places?: number
          shop_id?: string
          show_symbol?: boolean
          symbol_position?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      currency_settings: {
        Row: {
          created_at: string | null
          custom_symbols: Json | null
          display_settings: Json
          id: string
          shop_domain: string
          shop_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_symbols?: Json | null
          display_settings?: Json
          id?: string
          shop_domain: string
          shop_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_symbols?: Json | null
          display_settings?: Json
          id?: string
          shop_domain?: string
          shop_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_currency_rates: {
        Row: {
          created_at: string
          currency_code: string
          exchange_rate: number
          id: string
          shop_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          exchange_rate: number
          id?: string
          shop_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          exchange_rate?: number
          id?: string
          shop_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_currency_symbols: {
        Row: {
          created_at: string
          currency_code: string
          custom_symbol: string
          id: string
          shop_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency_code: string
          custom_symbol: string
          id?: string
          shop_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency_code?: string
          custom_symbol?: string
          id?: string
          shop_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          created_at: string
          data: Json
          form_id: string
          id: string
          shop_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          form_id: string
          id?: string
          shop_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
          shop_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      forms: {
        Row: {
          country: string | null
          created_at: string
          currency: string | null
          data: Json
          description: string | null
          id: string
          is_published: boolean
          owner_user_id: string | null
          phone_prefix: string | null
          shop_id: string | null
          style: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string | null
          data?: Json
          description?: string | null
          id?: string
          is_published?: boolean
          owner_user_id?: string | null
          phone_prefix?: string | null
          shop_id?: string | null
          style?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string | null
          data?: Json
          description?: string | null
          id?: string
          is_published?: boolean
          owner_user_id?: string | null
          phone_prefix?: string | null
          shop_id?: string | null
          style?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          email: string | null
          expiry: string | null
          id: string
          refresh_token: string | null
          scope: string | null
          shop_id: string | null
          token_type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          email?: string | null
          expiry?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          shop_id?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string | null
          expiry?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          shop_id?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      google_sheets_configs: {
        Row: {
          columns_mapping: Json | null
          created_at: string
          enabled: boolean | null
          id: string
          sheet_id: string
          sheet_name: string | null
          sheet_title: string | null
          shop_id: string | null
          spreadsheet_id: string | null
          spreadsheet_name: string | null
          sync_orders: boolean | null
          sync_submissions: boolean | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          columns_mapping?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          sheet_id: string
          sheet_name?: string | null
          sheet_title?: string | null
          shop_id?: string | null
          spreadsheet_id?: string | null
          spreadsheet_name?: string | null
          sync_orders?: boolean | null
          sync_submissions?: boolean | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          columns_mapping?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          sheet_id?: string
          sheet_name?: string | null
          sheet_title?: string | null
          shop_id?: string | null
          spreadsheet_id?: string | null
          spreadsheet_name?: string | null
          sync_orders?: boolean | null
          sync_submissions?: boolean | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      google_sheets_form_mappings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          form_id: string
          id: string
          sheet_id: string | null
          sheet_title: string
          shop_id: string
          spreadsheet_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          form_id: string
          id?: string
          sheet_id?: string | null
          sheet_title: string
          shop_id: string
          spreadsheet_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          form_id?: string
          id?: string
          sheet_id?: string | null
          sheet_title?: string
          shop_id?: string
          spreadsheet_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_settings: {
        Row: {
          created_at: string
          daily_order_limit: number | null
          daily_order_limit_enabled: boolean | null
          id: string
          out_of_stock_message: string | null
          out_of_stock_message_enabled: boolean | null
          payment_status: string | null
          payment_status_enabled: boolean | null
          popup_message: string | null
          popup_title: string | null
          post_order_action: string
          redirect_enabled: boolean
          shop_id: string
          thank_you_page_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          daily_order_limit?: number | null
          daily_order_limit_enabled?: boolean | null
          id?: string
          out_of_stock_message?: string | null
          out_of_stock_message_enabled?: boolean | null
          payment_status?: string | null
          payment_status_enabled?: boolean | null
          popup_message?: string | null
          popup_title?: string | null
          post_order_action?: string
          redirect_enabled?: boolean
          shop_id: string
          thank_you_page_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          daily_order_limit?: number | null
          daily_order_limit_enabled?: boolean | null
          id?: string
          out_of_stock_message?: string | null
          out_of_stock_message_enabled?: boolean | null
          payment_status?: string | null
          payment_status_enabled?: boolean | null
          popup_message?: string | null
          popup_title?: string | null
          post_order_action?: string
          redirect_enabled?: boolean
          shop_id?: string
          thank_you_page_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          currency: string | null
          customer_address: string | null
          customer_city: string | null
          customer_country: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          extras: number | null
          form_id: string | null
          id: string
          ip_address: string | null
          items: Json | null
          notes: string | null
          order_number: string
          shipping_address: Json | null
          shipping_cost: number | null
          shop_id: string | null
          shopify_order_id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          currency?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_country?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          extras?: number | null
          form_id?: string | null
          id?: string
          ip_address?: string | null
          items?: Json | null
          notes?: string | null
          order_number: string
          shipping_address?: Json | null
          shipping_cost?: number | null
          shop_id?: string | null
          shopify_order_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          currency?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_country?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          extras?: number | null
          form_id?: string | null
          id?: string
          ip_address?: string | null
          items?: Json | null
          notes?: string | null
          order_number?: string
          shipping_address?: Json | null
          shipping_cost?: number | null
          shop_id?: string | null
          shopify_order_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      quantity_offers: {
        Row: {
          created_at: string
          custom_selector: string | null
          enabled: boolean
          form_id: string
          id: string
          offers: Json
          position: string
          product_id: string
          shop_id: string
          styling: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custom_selector?: string | null
          enabled?: boolean
          form_id: string
          id?: string
          offers?: Json
          position?: string
          product_id: string
          shop_id: string
          styling?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custom_selector?: string | null
          enabled?: boolean
          form_id?: string
          id?: string
          offers?: Json
          position?: string
          product_id?: string
          shop_id?: string
          styling?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quantity_offers_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          blocked_at: string | null
          blocked_type: string
          blocked_value: string
          id: string
          referer: string | null
          shop_id: string
          user_agent: string | null
          visitor_country: string | null
          visitor_ip: unknown
        }
        Insert: {
          blocked_at?: string | null
          blocked_type: string
          blocked_value: string
          id?: string
          referer?: string | null
          shop_id: string
          user_agent?: string | null
          visitor_country?: string | null
          visitor_ip: unknown
        }
        Update: {
          blocked_at?: string | null
          blocked_type?: string
          blocked_value?: string
          id?: string
          referer?: string | null
          shop_id?: string
          user_agent?: string | null
          visitor_country?: string | null
          visitor_ip?: unknown
        }
        Relationships: []
      }
      shop_subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string
          currency: string | null
          id: string
          next_billing_date: string | null
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          price_amount: number | null
          shop_domain: string
          shopify_charge_id: string | null
          status: string
          subscription_started_at: string | null
          trial_days_remaining: number | null
          trial_started_at: string | null
          updated_at: string
          user_id: string | null
          requested_plan_type?: Database["public"]["Enums"]["subscription_plan"] | null
          requested_at?: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          next_billing_date?: string | null
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          price_amount?: number | null
          shop_domain: string
          shopify_charge_id?: string | null
          status?: string
          subscription_started_at?: string | null
          trial_days_remaining?: number | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string | null
          requested_plan_type?: Database["public"]["Enums"]["subscription_plan"] | null
          requested_at?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          next_billing_date?: string | null
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          price_amount?: number | null
          shop_domain?: string
          shopify_charge_id?: string | null
          status?: string
          subscription_started_at?: string | null
          trial_days_remaining?: number | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string | null
          requested_plan_type?: Database["public"]["Enums"]["subscription_plan"] | null
          requested_at?: string | null
        }
        Relationships: []
      }
      shopify_form_insertion: {
        Row: {
          block_id: string | null
          created_at: string
          form_id: string
          id: string
          insertion_method: string
          position: string
          shop_id: string
          theme_type: string
          updated_at: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          form_id: string
          id?: string
          insertion_method: string
          position: string
          shop_id: string
          theme_type: string
          updated_at?: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          form_id?: string
          id?: string
          insertion_method?: string
          position?: string
          shop_id?: string
          theme_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_form_insertion_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_product_settings: {
        Row: {
          block_id: string | null
          created_at: string
          enabled: boolean
          form_id: string
          id: string
          product_id: string
          shop_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          enabled?: boolean
          form_id: string
          id?: string
          product_id: string
          shop_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          block_id?: string | null
          created_at?: string
          enabled?: boolean
          form_id?: string
          id?: string
          product_id?: string
          shop_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_product_settings_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_stores: {
        Row: {
          access_token: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          is_active: boolean
          money_format: string | null
          money_with_currency_format: string | null
          province: string | null
          scope: string | null
          shop: string
          timezone: string | null
          token_type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          money_format?: string | null
          money_with_currency_format?: string | null
          province?: string | null
          scope?: string | null
          shop: string
          timezone?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          money_format?: string | null
          money_with_currency_format?: string | null
          province?: string | null
          scope?: string | null
          shop?: string
          timezone?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_blocked_country: {
        Args: {
          p_country_code: string
          p_country_name: string
          p_reason?: string
          p_redirect_url?: string
          p_shop_id: string
        }
        Returns: string
      }
      add_blocked_ip: {
        Args: {
          p_ip_address: string
          p_reason?: string
          p_redirect_url?: string
          p_shop_id: string
        }
        Returns: string
      }
      associate_product_with_form: {
        Args: {
          p_block_id?: string
          p_enabled?: boolean
          p_form_id: string
          p_product_id: string
          p_shop_id: string
        }
        Returns: string
      }
      auto_link_store_to_current_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      confirm_subscription_payment: {
        Args: { p_shop_domain: string; p_shopify_charge_id: string }
        Returns: Json
      }
      confirm_subscription_upgrade: {
        Args: {
          p_plan_type: Database["public"]["Enums"]["subscription_plan"]
          p_shop_domain: string
          p_shopify_charge_id: string
        }
        Returns: Json
      }
      create_abandoned_cart: {
        Args: {
          p_cart_items?: Json
          p_currency?: string
          p_customer_email: string
          p_customer_name?: string
          p_customer_phone?: string
          p_form_data?: Json
          p_form_id: string
          p_shop_id: string
          p_total_value?: number
        }
        Returns: Json
      }
      create_form_for_shop: {
        Args: {
          p_country?: string
          p_currency?: string
          p_data?: Json
          p_description?: string
          p_is_published?: boolean
          p_phone_prefix?: string
          p_shop_id: string
          p_style?: Json
          p_title: string
        }
        Returns: string
      }
      delete_abandoned_carts_admin: {
        Args: { cart_ids: string[] }
        Returns: Json
      }
      delete_form_full: {
        Args: { p_form_id: string; p_shop_id: string }
        Returns: boolean
      }
      delete_orders: {
        Args: { order_ids: string[] }
        Returns: Json
      }
      delete_orders_admin: {
        Args: { order_ids: string[] }
        Returns: Json
      }
      delete_quantity_offer: {
        Args: { p_offer_id: string; p_shop_id: string }
        Returns: boolean
      }
      fix_form_store_links: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_orders_prices: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      fix_user_ownership: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_blocked_countries: {
        Args: { p_shop_id: string }
        Returns: {
          country_code: string
          country_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          reason: string | null
          redirect_url: string | null
          shop_id: string
          updated_at: string | null
          user_id: string
        }[]
      }
      get_blocked_ips: {
        Args: { p_shop_id: string }
        Returns: {
          created_at: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          reason: string | null
          redirect_url: string | null
          shop_id: string
          updated_at: string | null
          user_id: string | null
        }[]
      }
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_form_quantity_offers: {
        Args: { p_form_id?: string; p_shop_id: string }
        Returns: {
          created_at: string
          custom_selector: string | null
          enabled: boolean
          form_id: string
          id: string
          offers: Json
          position: string
          product_id: string
          shop_id: string
          styling: Json
          updated_at: string
          user_id: string | null
        }[]
      }
      get_monthly_usage_stats: {
        Args: { p_shop_id: string }
        Returns: Json
      }
      get_order_settings: {
        Args: { p_shop_id: string }
        Returns: {
          created_at: string
          id: string
          popup_message: string
          popup_title: string
          post_order_action: string
          redirect_enabled: boolean
          shop_id: string
          thank_you_page_url: string
          updated_at: string
          user_id: string
        }[]
      }
      get_product_form_and_offers: {
        Args: { product_id: string; shop_id: string }
        Returns: Json
      }
      get_product_form_association: {
        Args: { p_product_id: string; p_shop_id: string }
        Returns: {
          enabled: boolean
          form_id: string
        }[]
      }
      get_public_form_data: {
        Args: { p_form_id: string }
        Returns: {
          country: string
          currency: string
          data: Json
          description: string
          id: string
          phone_prefix: string
          style: Json
          title: string
        }[]
      }
      get_shop_auto_form: {
        Args: { p_shop_id: string }
        Returns: {
          enabled: boolean
          form_id: string
        }[]
      }
      get_shop_currency_settings: {
        Args: { p_shop_id: string }
        Returns: Json
      }
      get_shop_limits: {
        Args: { p_shop: string }
        Returns: {
          abandoned_limit: number
          orders_limit: number
        }[]
      }
      get_shop_subscription: {
        Args: { p_shop_domain: string }
        Returns: {
          next_billing_date: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          status: string
          trial_days_remaining: number
        }[]
      }
      get_store_access_token: {
        Args: { p_shop: string }
        Returns: string
      }
      get_store_products_public: {
        Args: { p_shop: string }
        Returns: Json
      }
      get_stores_by_email: {
        Args: { p_email: string }
        Returns: {
          access_token: string
          email: string
          is_active: boolean
          shop: string
          updated_at: string
        }[]
      }
      get_user_stores: {
        Args: { p_user_id: string }
        Returns: {
          access_token: string
          is_active: boolean
          shop: string
          updated_at: string
        }[]
      }
      get_user_stores_by_email: {
        Args: { p_email?: string }
        Returns: {
          access_token: string
          created_at: string
          email: string
          is_active: boolean
          plan_type: string
          shop: string
          subscription_status: string
          updated_at: string
          user_id: string
        }[]
      }
      is_country_blocked: {
        Args: { p_country_code: string; p_shop_id: string }
        Returns: {
          is_blocked: boolean
          reason: string
          redirect_url: string
        }[]
      }
      is_ip_blocked: {
        Args:
          | { p_ip_address: string; p_shop_id: string }
          | { p_ip_address: unknown; p_shop_id?: string }
        Returns: {
          is_blocked: boolean
          reason: string
          redirect_url: string
        }[]
      }
      is_session_valid: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      link_active_store_to_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      link_orphan_stores_to_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      link_store_by_email: {
        Args: { p_email: string; p_shop: string }
        Returns: boolean
      }
      link_store_to_user: {
        Args: { p_email?: string; p_shop: string; p_user_id?: string }
        Returns: boolean
      }
      load_form_with_fallback: {
        Args: { form_id: string }
        Returns: Json
      }
      log_security_block: {
        Args: {
          p_blocked_type: string
          p_blocked_value: string
          p_referer?: string
          p_shop_id: string
          p_user_agent?: string
          p_visitor_country?: string
          p_visitor_ip: string
        }
        Returns: string
      }
      recover_abandoned_cart: {
        Args: { cart_id: string; shop_id_param: string }
        Returns: Json
      }
      remove_blocked_country: {
        Args: { p_blocked_id: string }
        Returns: boolean
      }
      remove_blocked_ip: {
        Args: { p_blocked_id: string }
        Returns: boolean
      }
      save_order_settings: {
        Args: {
          p_popup_message?: string
          p_popup_title?: string
          p_post_order_action?: string
          p_redirect_enabled?: boolean
          p_shop_id: string
          p_thank_you_page_url?: string
        }
        Returns: string
      }
      set_form_publication: {
        Args: { p_form_id: string; p_publish: boolean; p_shop_id: string }
        Returns: boolean
      }
      store_is_active: {
        Args: { p_shop: string }
        Returns: boolean
      }
      update_default_store_connection: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_form_secure: {
        Args: { p_changes: Json; p_form_id: string; p_shop_id: string }
        Returns: Json
      }
      update_order_details: {
        Args: { p_notes?: string; p_order_id: string; p_status?: string }
        Returns: undefined
      }
      upgrade_shop_plan: {
        Args: {
          p_new_plan: Database["public"]["Enums"]["subscription_plan"]
          p_shop_domain: string
          p_shopify_charge_id?: string
        }
        Returns: boolean
      }
      upsert_quantity_offer: {
        Args: {
          p_custom_selector?: string
          p_enabled?: boolean
          p_form_id: string
          p_id?: string
          p_offers: Json
          p_position?: string
          p_product_id: string
          p_shop_id: string
          p_styling: Json
        }
        Returns: string
      }
      user_can_access_shop: {
        Args: { p_shop_id: string }
        Returns: boolean
      }
      user_owns_store: {
        Args: { p_shop_id: string }
        Returns: boolean
      }
    }
    Enums: {
      subscription_plan: "free" | "basic" | "premium" | "unlimited"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_plan: ["free", "basic", "premium", "unlimited"],
    },
  },
} as const

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
    PostgrestVersion: "14.4"
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
          id: string
          shop_id: string
          show_symbol: boolean
          symbol_position: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          decimal_places?: number
          id?: string
          shop_id: string
          show_symbol?: boolean
          symbol_position?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          decimal_places?: number
          id?: string
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
          customer_email: string | null
          customer_phone: string | null
          data: Json
          form_id: string
          id: string
          product_id: string | null
          quantity: number | null
          shop_id: string | null
          shopify_order_id: string | null
          shopify_order_name: string | null
          status: string | null
          total_price: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          data?: Json
          form_id: string
          id?: string
          product_id?: string | null
          quantity?: number | null
          shop_id?: string | null
          shopify_order_id?: string | null
          shopify_order_name?: string | null
          status?: string | null
          total_price?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          data?: Json
          form_id?: string
          id?: string
          product_id?: string | null
          quantity?: number | null
          shop_id?: string | null
          shopify_order_id?: string | null
          shopify_order_name?: string | null
          status?: string | null
          total_price?: string | null
          user_id?: string | null
          variant_id?: string | null
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
        Relationships: []
      }
      security_logs: {
        Row: {
          blocked_at: string
          blocked_type: string
          blocked_value: string
          id: string
          referer: string | null
          shop_id: string
          user_agent: string | null
          visitor_country: string | null
          visitor_ip: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_type: string
          blocked_value: string
          id?: string
          referer?: string | null
          shop_id: string
          user_agent?: string | null
          visitor_country?: string | null
          visitor_ip?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_type?: string
          blocked_value?: string
          id?: string
          referer?: string | null
          shop_id?: string
          user_agent?: string | null
          visitor_country?: string | null
          visitor_ip?: string | null
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          created_at: string | null
          id: string
          notification_settings: Json | null
          shop_domain: string
          updated_at: string | null
          webhook_settings: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_settings?: Json | null
          shop_domain: string
          updated_at?: string | null
          webhook_settings?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_settings?: Json | null
          shop_domain?: string
          updated_at?: string | null
          webhook_settings?: Json | null
        }
        Relationships: []
      }
      shop_subscriptions: {
        Row: {
          billing_cycle: string | null
          charge_type: string | null
          created_at: string
          currency: string | null
          id: string
          next_billing_date: string | null
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          price_amount: number | null
          requested_at: string | null
          requested_plan_type:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          shop_domain: string
          shopify_charge_id: string | null
          status: string
          subscription_started_at: string | null
          trial_days_remaining: number | null
          trial_started_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_cycle?: string | null
          charge_type?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          next_billing_date?: string | null
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          price_amount?: number | null
          requested_at?: string | null
          requested_plan_type?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          shop_domain: string
          shopify_charge_id?: string | null
          status?: string
          subscription_started_at?: string | null
          trial_days_remaining?: number | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_cycle?: string | null
          charge_type?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          next_billing_date?: string | null
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          price_amount?: number | null
          requested_at?: string | null
          requested_plan_type?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          shop_domain?: string
          shopify_charge_id?: string | null
          status?: string
          subscription_started_at?: string | null
          trial_days_remaining?: number | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string | null
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
        Relationships: []
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
        Relationships: []
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
      unified_default_rates: {
        Row: {
          created_at: string
          currency_code: string
          currency_name: string
          currency_symbol: string
          exchange_rate: number
          id: string
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          currency_name: string
          currency_symbol: string
          exchange_rate: number
          id?: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          currency_name?: string
          currency_symbol?: string
          exchange_rate?: number
          id?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
        SetofOptions: {
          from: "*"
          to: "blocked_countries"
          isOneToOne: false
          isSetofReturn: true
        }
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
        SetofOptions: {
          from: "*"
          to: "blocked_ips"
          isOneToOne: false
          isSetofReturn: true
        }
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
        SetofOptions: {
          from: "*"
          to: "quantity_offers"
          isOneToOne: false
          isSetofReturn: true
        }
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          customer_phone: string | null
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
          customer_phone?: string | null
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
          customer_phone?: string | null
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
      google_sheets_configs: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          sheet_id: string
          sheet_name: string | null
          shop_id: string | null
          sync_orders: boolean | null
          sync_submissions: boolean | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          sheet_id: string
          sheet_name?: string | null
          shop_id?: string | null
          sync_orders?: boolean | null
          sync_submissions?: boolean | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          sheet_id?: string
          sheet_name?: string | null
          shop_id?: string | null
          sync_orders?: boolean | null
          sync_submissions?: boolean | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      order_settings: {
        Row: {
          created_at: string
          id: string
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
          id?: string
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
          id?: string
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
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          form_id: string | null
          id: string
          items: Json | null
          order_number: string
          shipping_address: Json | null
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
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          form_id?: string | null
          id?: string
          items?: Json | null
          order_number: string
          shipping_address?: Json | null
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
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          form_id?: string | null
          id?: string
          items?: Json | null
          order_number?: string
          shipping_address?: Json | null
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
          created_at: string
          currency: string | null
          email: string | null
          id: string
          is_active: boolean
          money_format: string | null
          money_with_currency_format: string | null
          scope: string | null
          shop: string
          token_type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          money_format?: string | null
          money_with_currency_format?: string | null
          scope?: string | null
          shop: string
          token_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          money_format?: string | null
          money_with_currency_format?: string | null
          scope?: string | null
          shop?: string
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
      associate_product_with_form: {
        Args: {
          p_shop_id: string
          p_product_id: string
          p_form_id: string
          p_block_id?: string
          p_enabled?: boolean
        }
        Returns: string
      }
      auto_link_store_to_current_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_form_for_shop: {
        Args: {
          p_shop_id: string
          p_title: string
          p_description?: string
          p_data?: Json
          p_style?: Json
          p_is_published?: boolean
        }
        Returns: string
      }
      fix_form_store_links: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_user_ownership: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_order_settings: {
        Args: { p_shop_id: string }
        Returns: {
          id: string
          shop_id: string
          user_id: string
          post_order_action: string
          redirect_enabled: boolean
          thank_you_page_url: string
          popup_title: string
          popup_message: string
          created_at: string
          updated_at: string
        }[]
      }
      get_product_form_and_offers: {
        Args: { shop_id: string; product_id: string }
        Returns: Json
      }
      get_shop_currency_settings: {
        Args: { p_shop_id: string }
        Returns: Json
      }
      get_shop_limits: {
        Args: { p_shop: string }
        Returns: {
          orders_limit: number
          abandoned_limit: number
        }[]
      }
      get_shop_subscription: {
        Args: { p_shop_domain: string }
        Returns: {
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          status: string
          trial_days_remaining: number
          next_billing_date: string
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
          shop: string
          email: string
          is_active: boolean
          updated_at: string
          access_token: string
        }[]
      }
      get_user_stores: {
        Args: { p_user_id: string }
        Returns: {
          shop: string
          is_active: boolean
          updated_at: string
          access_token: string
        }[]
      }
      get_user_stores_by_email: {
        Args: { p_email?: string }
        Returns: {
          shop: string
          email: string
          user_id: string
          access_token: string
          is_active: boolean
          created_at: string
          updated_at: string
          plan_type: string
          subscription_status: string
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
        Args: { p_shop: string; p_email: string }
        Returns: boolean
      }
      link_store_to_user: {
        Args: { p_shop: string; p_user_id?: string; p_email?: string }
        Returns: boolean
      }
      load_form_with_fallback: {
        Args: { form_id: string }
        Returns: Json
      }
      save_order_settings: {
        Args: {
          p_shop_id: string
          p_post_order_action?: string
          p_redirect_enabled?: boolean
          p_thank_you_page_url?: string
          p_popup_title?: string
          p_popup_message?: string
        }
        Returns: string
      }
      update_default_store_connection: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      upgrade_shop_plan: {
        Args: {
          p_shop_domain: string
          p_new_plan: Database["public"]["Enums"]["subscription_plan"]
          p_shopify_charge_id?: string
        }
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

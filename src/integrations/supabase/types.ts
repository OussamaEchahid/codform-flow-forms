export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      form_submissions: {
        Row: {
          created_at: string
          data: Json
          form_id: string
          id: string
          order_id: string | null
          shop_id: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          form_id: string
          id?: string
          order_id?: string | null
          shop_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
          order_id?: string | null
          shop_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          borderRadius: string | null
          buttonStyle: string | null
          created_at: string
          data: Json
          description: string | null
          fontSize: string | null
          id: string
          is_published: boolean
          primaryColor: string | null
          shop_id: string | null
          style: Json | null
          submitbuttontext: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          borderRadius?: string | null
          buttonStyle?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          fontSize?: string | null
          id?: string
          is_published?: boolean
          primaryColor?: string | null
          shop_id?: string | null
          style?: Json | null
          submitbuttontext?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          borderRadius?: string | null
          buttonStyle?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          fontSize?: string | null
          id?: string
          is_published?: boolean
          primaryColor?: string | null
          shop_id?: string | null
          style?: Json | null
          submitbuttontext?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      landing_page_templates: {
        Row: {
          content: Json
          created_at: string
          id: string
          page_id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          page_id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          page_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_templates_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          product_id: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          product_id?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          product_id?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      shopify_auth: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          shop: string
          state: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          shop: string
          state: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          shop?: string
          state?: string
        }
        Relationships: []
      }
      shopify_page_syncs: {
        Row: {
          created_at: string
          id: string
          page_id: string
          shop_id: string
          synced_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          shop_id: string
          synced_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          shop_id?: string
          synced_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_page_syncs_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_product_settings: {
        Row: {
          block_id: string | null
          created_at: string | null
          enabled: boolean | null
          form_id: string
          id: string
          product_id: string
          shop_id: string
          updated_at: string | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          form_id: string
          id?: string
          product_id: string
          shop_id: string
          updated_at?: string | null
        }
        Update: {
          block_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          form_id?: string
          id?: string
          product_id?: string
          shop_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shopify_stores: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          scope: string | null
          shop: string
          token_type: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          scope?: string | null
          shop: string
          token_type?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          scope?: string | null
          shop?: string
          token_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_column_if_not_exists: {
        Args: {
          p_table: string
          p_column: string
          p_type: string
          p_default?: string
        }
        Returns: undefined
      }
      check_column_exists: {
        Args: { p_table: string; p_column: string }
        Returns: boolean
      }
      check_trigger_exists: {
        Args: { trigger_name: string }
        Returns: boolean
      }
      cleanup_expired_shopify_auth: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_form_with_shop: {
        Args: {
          p_title: string
          p_description: string
          p_data: Json
          p_shop_id: string
          p_user_id: string
        }
        Returns: string
      }
      create_table_if_not_exists: {
        Args: { p_table_name: string; p_table_definition: string }
        Returns: undefined
      }
      create_timestamp_trigger: {
        Args: { table_name: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

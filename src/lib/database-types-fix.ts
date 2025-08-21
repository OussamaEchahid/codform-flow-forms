// Temporary fix for duplicate type definitions in auto-generated types.ts
// This will override the conflicting types until the database schema is properly synchronized

export interface BlockedIP {
  id: string;
  shop_id: string;
  ip_address: string;
  reason: string;
  redirect_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
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
  user_id?: string;
}

// Re-export all other types from the main database types
export * from '@/integrations/supabase/database.types';

// Override the conflicting database interface
import type { Database as OriginalDatabase } from '@/integrations/supabase/database.types';

export interface Database extends Omit<OriginalDatabase, 'public'> {
  public: Omit<OriginalDatabase['public'], 'Tables'> & {
    Tables: Omit<OriginalDatabase['public']['Tables'], 'blocked_ips' | 'blocked_countries'> & {
      blocked_ips: {
        Row: BlockedIP;
        Insert: Omit<BlockedIP, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BlockedIP, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      blocked_countries: {
        Row: BlockedCountry;
        Insert: Omit<BlockedCountry, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BlockedCountry, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
    };
  };
}
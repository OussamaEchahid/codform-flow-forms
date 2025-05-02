
import { Database } from '@/integrations/supabase/types';

// Define FormData type that's compatible with Supabase database
export interface FormData {
  id: string;
  title: string;
  description?: string | null;
  data: any; // Using any instead of any[] to solve compatibility issues with Supabase Json
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  is_published?: boolean;
  shop_id?: string | null;
}

// Type for form creation payload
export interface FormCreatePayload {
  title: string;
  description?: string | null;
  data: any;
  user_id?: string;
  is_published?: boolean;
  shop_id?: string | null;
}

// Type for form update payload
export interface FormUpdatePayload {
  title?: string;
  description?: string | null;
  data?: any;
  is_published?: boolean;
  shop_id?: string | null;
}

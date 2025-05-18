

import { createClient } from '@supabase/supabase-js';
import { Database } from './database-types';

// Use import.meta.env instead of process.env for client-side code
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mtyfuwdsshlzqwjujavp.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg";

// إنشاء عميل Supabase
export const shopifySupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

// تصدير وظائف مساعدة للتعامل مع جداول Shopify
export const shopifyStores = () => shopifySupabase.from('shopify_stores');
export const shopifyProductSettings = () => shopifySupabase.from('shopify_product_settings');
export const shopifyFormInsertion = () => shopifySupabase.from('shopify_form_insertion');
export const shopifyAuth = shopifySupabase.auth;

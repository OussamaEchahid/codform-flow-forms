
import { createClient } from '@supabase/supabase-js';
import { Database } from './database-types';

// Constants for Supabase connection - using consistent values
const SUPABASE_URL = "https://mtyfuwdsshlzqwjujavp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg";

// Create a typed client specifically for Shopify-related tables
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

// Export a helper function to interact with Shopify store tables
export const shopifyStores = () => shopifySupabase.from('shopify_stores');

// Export a helper function to interact with Shopify product settings
export const shopifyProductSettings = () => shopifySupabase.from('shopify_product_settings');

// Export auth for completeness
export const shopifyAuth = shopifySupabase.auth;

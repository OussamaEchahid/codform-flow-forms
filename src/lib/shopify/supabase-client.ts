
/**
 * Dedicated Supabase client for Shopify integration
 * This prevents issues with multiple GoTrueClient instances
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mtyfuwdsshlzqwjujavp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';

// Create dedicated client for Shopify integration
export const shopifySupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,  // Don't persist auth state for this client
    autoRefreshToken: false // Disable auto-refresh to minimize client instances
  }
});

// Helper function to access the shopify_stores table
export const shopifyStores = () => {
  return shopifySupabase.from('shopify_stores');
};


import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/database.types';

// Use the same variables as the main client
const SUPABASE_URL = "https://mtyfuwdsshlzqwjujavp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg";

// Export the Supabase client
export const shopifySupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Add the missing shopifyStores function
export const shopifyStores = () => {
  return shopifySupabase.from('shopify_stores');
};


import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/database.types';

// Use the same variables as the main client
const SUPABASE_URL = "https://mtyfuwdsshlzqwjujavp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg";

// Export the Supabase client
export const shopifySupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Add the missing shopifyStores function with caching for better performance
let storesCache: ReturnType<typeof shopifySupabase.from> | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 60000; // 60 seconds cache

// Export the shopifyStores function with caching
export const shopifyStores = () => {
  const now = Date.now();
  
  // Return the cached instance if it's still valid
  if (storesCache && (now - lastCacheTime) < CACHE_TTL) {
    return storesCache;
  }
  
  // Create a new instance and update the cache
  storesCache = shopifySupabase.from('shopify_stores');
  lastCacheTime = now;
  
  return storesCache;
};

// Helper function to clear cache when needed (eg. after updates)
export const clearStoresCache = () => {
  storesCache = null;
  lastCacheTime = 0;
  console.log('Shopify stores cache cleared');
};

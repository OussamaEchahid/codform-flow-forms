// Re-export supabase client for compatibility
import { supabase } from '@/integrations/supabase/client';

// Re-export the main client
export const shopifySupabase = supabase;

// Helper functions
export const shopifyStores = () => supabase.from('shopify_stores');
export const shopifyProductSettings = () => supabase.from('shopify_product_settings');
export const shopifyFormInsertion = () => supabase.from('shopify_form_insertion');
export const shopifyAuth = supabase.auth;
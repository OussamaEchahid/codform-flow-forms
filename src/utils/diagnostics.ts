
// If this file doesn't exist yet, we'll create it with the necessary functions

import { supabase } from '@/integrations/supabase/client';

// Log Shopify diagnostic information
export const logShopifyDiagnostics = () => {
  console.log('Shopify diagnostic information:', {
    localStorageData: {
      shopify_store: localStorage.getItem('shopify_store'),
      shopify_connected: localStorage.getItem('shopify_connected'),
      shopify_recovery_mode: localStorage.getItem('shopify_recovery_mode'),
      shopify_sync_attempts: localStorage.getItem('shopify_sync_attempts'),
      forms_last_reload: localStorage.getItem('forms_last_reload')
    },
    environment: {
      isDev: process.env.NODE_ENV === 'development' || import.meta.env.DEV === true,
      currentUrl: window.location.href
    },
    timestamp: new Date().toISOString()
  });
};

// Log form diagnostic information
export const logFormDiagnostics = async (supabaseClient: any, shopId?: string) => {
  console.log('Form diagnostic information:', {
    shopId,
    timestamp: new Date().toISOString()
  });

  if (shopId) {
    try {
      // Check if the shop has forms
      const { data: forms, error } = await supabaseClient
        .from('forms')
        .select('count')
        .eq('shop_id', shopId);

      if (error) {
        console.error('Error checking forms:', error);
      } else {
        console.log(`Found ${forms.length} forms for shop ${shopId}`);
      }
    } catch (error) {
      console.error('Error in form diagnostics:', error);
    }
  }
};

// Complete reset of Shopify connection
export const resetShopifyConnection = () => {
  console.log('Performing complete Shopify connection reset');
  
  // Clear all Shopify-related items from localStorage
  localStorage.removeItem('shopify_store');
  localStorage.removeItem('shopify_connected');
  localStorage.removeItem('shopify_token');
  localStorage.removeItem('shopify_recovery_mode');
  localStorage.removeItem('shopify_sync_attempts');
  localStorage.removeItem('shopify_last_url_shop');
  localStorage.removeItem('forms_cache');
  localStorage.removeItem('shopify_forms');
  
  // Additional items that might be causing issues
  localStorage.removeItem('form_data');
  localStorage.removeItem('token_cache');
  
  console.log('Shopify connection reset complete');
  
  return true;
};

export default {
  logShopifyDiagnostics,
  logFormDiagnostics,
  resetShopifyConnection
};

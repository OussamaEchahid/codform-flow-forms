
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

/**
 * Service to manage Shopify connections in a simplified way
 */
export const shopifyConnectionService = {
  /**
   * Force activate a specific store in the database
   * @param shopDomain The domain of the shop to activate
   * @returns True if successful, false if failed
   */
  async forceActivateStore(shopDomain: string): Promise<boolean> {
    if (!shopDomain) return false;
    
    try {
      console.log(`Forcing activation of store: ${shopDomain}`);
      
      // First deactivate all stores
      const { error: deactivateError } = await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .not('shop', 'eq', shopDomain);
      
      if (deactivateError) {
        console.warn("Error deactivating other stores:", deactivateError);
        // Continue anyway since this is not critical
      }
      
      // Activate the specified store
      const { error: activateError } = await supabase
        .from('shopify_stores')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString() 
        })
        .eq('shop', shopDomain);
      
      if (activateError) {
        console.error("Error activating store:", activateError);
        return false;
      }
      
      // Update local state as well
      shopifyConnectionManager.addOrUpdateStore(shopDomain, true);
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      return true;
    } catch (error) {
      console.error("Unexpected error in forceActivateStore:", error);
      return false;
    }
  },
  
  /**
   * Complete reset of connection state - both client and server
   */
  completeConnectionReset(): void {
    // Clear client state
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('shopify_recovery_mode');
    localStorage.removeItem('shopify_failsafe');
    localStorage.removeItem('bypass_auth');
    
    // Reset connection manager
    shopifyConnectionManager.clearAllStores();
    shopifyConnectionManager.resetLoopDetection();
    
    console.log("Complete connection reset performed");
  },
  
  /**
   * Verify connection to Shopify store
   * @param shopDomain The domain of the shop to verify
   * @param forceRefresh Whether to force a refresh from database
   * @returns True if connected, false if not
   */
  async verifyConnection(shopDomain: string, forceRefresh: boolean = false): Promise<boolean> {
    if (!shopDomain) return false;
    
    try {
      // Check if the store exists in database and has a valid token
      const { data, error } = await supabase.rpc(
        'get_shopify_store_data',
        { store_domain: shopDomain }
      );
      
      if (error || !data || !data.access_token) {
        console.error("Error verifying connection:", error || "No access token found");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in verifyConnection:", error);
      return false;
    }
  },
  
  /**
   * Reset connection state
   */
  resetConnectionState(): void {
    this.completeConnectionReset();
  },
  
  /**
   * Sync form with Shopify
   * @param formId The ID of the form to sync
   * @param shop The shop to sync with
   * @returns True if successful, false if failed
   */
  async syncFormWithShopify(formId: string, shop: string): Promise<boolean> {
    if (!formId || !shop) return false;
    
    try {
      // Implement a simplified sync function
      console.log(`Syncing form ${formId} with shop ${shop}`);
      
      // Simply update the form's shop_id in the database
      const { error } = await supabase
        .from('forms')
        .update({ 
          shop_id: shop,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId);
      
      if (error) {
        console.error("Error syncing form with Shopify:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in syncFormWithShopify:", error);
      return false;
    }
  },
  
  /**
   * Re-sync all pending forms
   * @param shop The shop to sync with
   */
  async resyncPendingForms(shop: string): Promise<void> {
    if (!shop) return;
    
    try {
      // Get list of pending form syncs from localStorage
      const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
      
      // Sync each pending form
      for (const formId of pendingSyncs) {
        await this.syncFormWithShopify(formId, shop);
      }
      
      // Clear the pending syncs list
      localStorage.setItem('pending_form_syncs', '[]');
    } catch (error) {
      console.error("Error in resyncPendingForms:", error);
    }
  },
  
  /**
   * Get current connection state
   * @returns Connection state information
   */
  getConnectionState(): {
    isConnected: boolean;
    shop: string | null;
    localStorageConnected: boolean;
    connectionManagerConnected: boolean;
  } {
    const shop = localStorage.getItem('shopify_store');
    const connected = localStorage.getItem('shopify_connected') === 'true';
    const activeStore = shopifyConnectionManager.getActiveStore();
    
    return {
      isConnected: connected || !!activeStore,
      shop: activeStore || shop,
      localStorageConnected: connected,
      connectionManagerConnected: !!activeStore
    };
  }
};

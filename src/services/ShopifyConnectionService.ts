
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

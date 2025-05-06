
import { shopifyStores, shopifySupabase } from '@/lib/shopify/supabase-client';

/**
 * Service for managing Shopify store connections
 */
class ShopifyConnectionService {
  // Keys for localStorage
  private CONNECTED_KEY = 'shopify_connected';
  private STORE_KEY = 'shopify_store';
  private TEMP_STORE_KEY = 'shopify_temp_store';
  private LAST_URL_SHOP_KEY = 'shopify_last_url_shop';
  private EMERGENCY_MODE_KEY = 'shopify_emergency_mode';
  
  /**
   * Get the active store from localStorage
   */
  getActiveStore(): string | null {
    return localStorage.getItem(this.STORE_KEY);
  }
  
  /**
   * Check if connected to Shopify
   */
  isConnected(): boolean {
    return localStorage.getItem(this.CONNECTED_KEY) === 'true';
  }
  
  /**
   * Get the last shop domain from URL
   */
  getLastUrlShop(): string | null {
    return localStorage.getItem(this.LAST_URL_SHOP_KEY);
  }
  
  /**
   * Save the shop from URL for potential recovery
   */
  saveLastUrlShop(shop: string): void {
    localStorage.setItem(this.LAST_URL_SHOP_KEY, shop);
  }
  
  /**
   * Add or update a store and optionally set it as active
   */
  addOrUpdateStore(shop: string, setActive: boolean = false): void {
    console.log(`Adding/updating store in local storage: ${shop}, setting active: ${setActive}`);
    
    if (setActive) {
      localStorage.setItem(this.STORE_KEY, shop);
      localStorage.setItem(this.CONNECTED_KEY, 'true');
      console.log(`Set ${shop} as active store in localStorage`);
    }
    
    // Also sync with database
    this.syncStoreToDatabase(shop)
      .then(() => console.log(`Synced store ${shop} with database`))
      .catch(err => console.error(`Error syncing store to database:`, err));
  }
  
  /**
   * Force activate a store in the database
   */
  async forceActivateStore(shop: string): Promise<boolean> {
    try {
      // First check if the store exists
      const { data: existingStores, error: checkError } = await shopifyStores()
        .select('*')
        .eq('shop', shop)
        .limit(1);
        
      if (checkError) {
        console.error('Error checking store existence:', checkError);
        return false;
      }
      
      if (!existingStores || existingStores.length === 0) {
        console.error('Store not found in database:', shop);
        return false;
      }
      
      // Update the store to be active
      const { error: updateError } = await shopifyStores()
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('shop', shop);
        
      if (updateError) {
        console.error('Error updating store activity:', updateError);
        return false;
      }
      
      console.log(`Successfully activated store ${shop} in database`);
      return true;
    } catch (error) {
      console.error('Error in forceActivateStore:', error);
      return false;
    }
  }
  
  /**
   * Sync store to database to ensure consistency
   */
  async syncStoreToDatabase(shop: string): Promise<void> {
    try {
      // Check if the store exists in the database
      const { data, error } = await shopifyStores()
        .select('*')
        .eq('shop', shop)
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      // If store doesn't exist or we have an issue, we'll try to insert it
      // This is just a placeholder until we get the actual token during OAuth
      if (!data || data.length === 0) {
        await shopifyStores().insert({
          shop: shop,
          is_active: true,
          token_type: 'placeholder',
          scope: 'read_products,write_products',
          access_token: 'placeholder_token', // Will be updated during OAuth process
        });
        
        console.log(`Created placeholder record for ${shop} in database`);
      } else {
        // Update the store to be active
        await shopifyStores()
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('shop', shop);
          
        console.log(`Updated ${shop} to active in database`);
      }
    } catch (error) {
      console.error('Error syncing store to database:', error);
      throw error;
    }
  }
  
  /**
   * Get the access token for a shop
   */
  async getAccessToken(shop: string): Promise<string> {
    try {
      const { data, error } = await shopifyStores()
        .select('access_token')
        .eq('shop', shop)
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0 || !data[0].access_token) {
        throw new Error('Access token not found');
      }
      
      return data[0].access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }
  
  /**
   * Validate if token is valid for a shop
   */
  async isTokenValid(shop: string): Promise<boolean> {
    try {
      // Get the access token from database
      const { data, error } = await shopifyStores()
        .select('access_token')
        .eq('shop', shop)
        .limit(1);
        
      if (error || !data || data.length === 0 || !data[0].access_token) {
        return false;
      }
      
      const accessToken = data[0].access_token;
      
      // Use the test connection function to check if token is valid
      const response = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: { shop, accessToken }
      });
      
      return response?.data?.success === true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }
  
  /**
   * Force sync local store state with database
   */
  async forceSyncWithDatabase(): Promise<boolean> {
    try {
      // Get active store from database
      const { data, error } = await shopifyStores()
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error fetching active store:', error);
        return false;
      }
      
      if (data && data.length > 0) {
        const activeStore = data[0];
        
        // Update localStorage
        localStorage.setItem(this.STORE_KEY, activeStore.shop);
        localStorage.setItem(this.CONNECTED_KEY, 'true');
        
        console.log(`Synced active store from database: ${activeStore.shop}`);
        return true;
      } else {
        // No active store found, clear localStorage
        this.clearStoreState();
        return false;
      }
    } catch (error) {
      console.error('Error in forceSyncWithDatabase:', error);
      return false;
    }
  }
  
  /**
   * Complete reset of connection state
   */
  completeConnectionReset(): void {
    // Clear all localStorage values
    localStorage.removeItem(this.CONNECTED_KEY);
    localStorage.removeItem(this.STORE_KEY);
    localStorage.removeItem(this.TEMP_STORE_KEY);
    console.log('Reset connection state in localStorage');
    
    // We don't reset database state here as that should be done separately
  }
  
  /**
   * Clear store state from localStorage
   */
  clearStoreState(): void {
    localStorage.removeItem(this.CONNECTED_KEY);
    localStorage.removeItem(this.STORE_KEY);
    console.log('Cleared store state from localStorage');
  }
  
  /**
   * Set emergency mode
   */
  setEmergencyMode(enabled: boolean): void {
    if (enabled) {
      localStorage.setItem(this.EMERGENCY_MODE_KEY, 'true');
    } else {
      localStorage.removeItem(this.EMERGENCY_MODE_KEY);
    }
  }
  
  /**
   * Check if in emergency mode
   */
  isEmergencyMode(): boolean {
    return localStorage.getItem(this.EMERGENCY_MODE_KEY) === 'true';
  }
}

export const shopifyConnectionService = new ShopifyConnectionService();

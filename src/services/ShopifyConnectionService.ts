import { shopifySupabase, shopifyStores } from '@/lib/shopify/supabase-client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

class ShopifyConnectionService {
  /**
   * Gets an access token for a shop
   * @param shop The shop domain
   * @returns Access token or null
   */
  async getAccessToken(shop: string): Promise<string | null> {
    try {
      // المتجر مطلوب
      if (!shop) {
        console.error('No shop provided for getAccessToken');
        return null;
      }
      
      console.log(`Getting access token for shop: ${shop}`);
      
      // First try to get from database
      const { data, error } = await shopifyStores()
        .select('access_token')
        .eq('shop', shop)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error getting access token from database:', error);
        return null;
      }
      
      // Verify that the token isn't the placeholder
      if (data && data.length > 0 && data[0].access_token && data[0].access_token !== 'placeholder_token') {
        console.log(`Found valid token for shop: ${shop}`);
        return data[0].access_token;
      }

      // إذا كان الرمز غير موجود أو هو placeholder_token، قم برفض الاتصال
      if (data && data.length > 0 && data[0].access_token === 'placeholder_token') {
        console.error('Found placeholder token for shop:', shop);
        
        // تنظيف الرمز placeholder
        try {
          await this.cleanupPlaceholderTokens();
          console.log('Cleaned placeholder token for shop:', shop);
        } catch (cleanupError) {
          console.error('Error cleaning placeholder token:', cleanupError);
        }
      }

      console.error('No valid access token found for shop:', shop);
      return null;
    } catch (error) {
      console.error('Error in getAccessToken:', error);
      return null;
    }
  }
  
  /**
   * Checks if a token is valid for a shop
   * @param shop The shop domain
   * @returns Boolean indicating if token is valid
   */
  async isTokenValid(shop: string): Promise<boolean> {
    try {
      // Get token
      const token = await this.getAccessToken(shop);
      
      if (!token) {
        return false;
      }
      
      // Test token with test connection edge function
      const { data, error } = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: { shop, accessToken: token }
      });
      
      if (error || !data?.success) {
        console.log('Token validation failed:', error || data?.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  /**
   * Forces a store to be active in the database
   * @param shop The shop domain
   */
  async forceActivateStore(shop: string): Promise<void> {
    try {
      // First, make all stores inactive
      await shopifyStores()
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Then, find and update the target store
      const { data, error } = await shopifyStores()
        .select('id')
        .eq('shop', shop)
        .limit(1);
      
      if (error || !data || data.length === 0) {
        console.error('Store not found for activation:', shop);
        return;
      }
      
      // Set this store as active
      await shopifyStores()
        .update({ is_active: true })
        .eq('id', data[0].id);
      
      console.log('Store activated:', shop);
    } catch (error) {
      console.error('Error in forceActivateStore:', error);
    }
  }
  
  /**
   * Syncs a store to the database
   * @param shop The shop domain
   * @param token Optional token to use
   * @param isActive Whether the store should be active
   */
  async syncStoreToDatabase(shop: string, token?: string, isActive: boolean = true): Promise<void> {
    try {
      if (!shop) {
        throw new Error('Shop domain is required');
      }
      
      // تنظيف الرمز إذا كان placeholder_token
      if (token === 'placeholder_token') {
        console.warn('Attempted to sync with placeholder_token - ignoring token');
        token = undefined;
      }
      
      // Check if store exists
      const { data, error } = await shopifyStores()
        .select('*')
        .eq('shop', shop)
        .limit(1);
      
      if (error) {
        console.error('Error checking if store exists:', error);
        throw error;
      }
      
      const updateData: any = { 
        updated_at: new Date().toISOString(),
        is_active: isActive
      };
      
      // Update token only if provided and not placeholder
      if (token && token !== 'placeholder_token') {
        updateData.access_token = token;
      }
      
      if (data && data.length > 0) {
        // تنظيف placeholder_token إذا وُجد في قاعدة البيانات
        if (data[0].access_token === 'placeholder_token' && !token) {
          updateData.access_token = null;
        }
        
        // Update existing store
        await shopifyStores()
          .update(updateData)
          .eq('id', data[0].id);
          
        console.log(`Updated store: ${shop}`);
      } else {
        // Create new store only if token is provided and not placeholder
        if (token && token !== 'placeholder_token') {
          await shopifyStores().insert({
            shop,
            access_token: token,
            is_active: isActive,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          console.log(`Created new store: ${shop}`);
        } else {
          console.warn(`Not creating store record without token: ${shop}`);
        }
      }
      
      // Update connection manager
      shopifyConnectionManager.addOrUpdateStore(shop, isActive);
      
      // Update localStorage for consistency
      localStorage.setItem('shopify_store', shop);
      localStorage.setItem('shopify_connected', isActive ? 'true' : 'false');
    } catch (error) {
      console.error('Error syncing store to database:', error);
      throw error;
    }
  }
  
  /**
   * Saves the last shop domain from the URL
   * @param shop Shop domain
   */
  saveLastUrlShop(shop: string): void {
    localStorage.setItem('shopify_last_url_shop', shop);
    shopifyConnectionManager.saveLastUrlShop(shop);
  }
  
  /**
   * Gets the last shop domain from the URL
   * @returns Shop domain
   */
  getLastUrlShop(): string | null {
    return localStorage.getItem('shopify_last_url_shop') || shopifyConnectionManager.getLastUrlShop();
  }
  
  /**
   * Resets all connection data
   */
  completeConnectionReset(): void {
    // Clear localStorage
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('shopify_last_url_shop');
    localStorage.removeItem('bypass_auth');
    
    // Reset connection manager
    shopifyConnectionManager.clearAllStores();
    shopifyConnectionManager.resetLoopDetection();
    
    // Clean database placeholder tokens
    this.cleanupPlaceholderTokens()
      .then(() => console.log('Placeholder tokens cleaned up during reset'))
      .catch(error => console.error('Error cleaning placeholder tokens during reset:', error));
  }
  
  /**
   * تنظيف رموز placeholder_token من قاعدة البيانات
   */
  async cleanupPlaceholderTokens(): Promise<void> {
    try {
      console.log('Cleaning up placeholder tokens from database...');
      
      // تحديث جميع المتاجر التي لديها placeholder_token
      const { data, error } = await shopifyStores()
        .update({ access_token: null })
        .eq('access_token', 'placeholder_token')
        .select();

      if (error) {
        console.error('Error cleaning placeholder tokens:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`Cleaned ${data.length} placeholder tokens from database`);
      } else {
        console.log('No placeholder tokens found to clean');
      }
      
      // Also clean up any records with access_token = ''
      const { data: emptyData, error: emptyError } = await shopifyStores()
        .update({ access_token: null })
        .eq('access_token', '')
        .select();
        
      if (emptyError) {
        console.error('Error cleaning empty tokens:', emptyError);
      } else if (emptyData && emptyData.length > 0) {
        console.log(`Cleaned ${emptyData.length} empty tokens from database`);
      }
    } catch (error) {
      console.error('Error in cleanupPlaceholderTokens:', error);
    }
  }
  
  /**
   * Adds or updates a store in local storage
   * @param shop Shop domain
   * @param isConnected Whether the store is connected
   */
  addOrUpdateStore(shop: string, isConnected: boolean = true): void {
    // Update local storage
    localStorage.setItem('shopify_store', shop);
    localStorage.setItem('shopify_connected', isConnected ? 'true' : 'false');
    
    // Update connection manager
    shopifyConnectionManager.addOrUpdateStore(shop, isConnected);
  }
  
  /**
   * Tests if a connection is valid
   * @param shop Shop domain
   * @param accessToken Access token
   */
  async testConnection(shop: string, accessToken?: string): Promise<boolean> {
    try {
      // Use provided token or get from database
      const token = accessToken || await this.getAccessToken(shop);
      
      if (!token) {
        return false;
      }
      
      const { data, error } = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: { shop, accessToken: token }
      });
      
      if (error) {
        throw error;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }
  
  /**
   * Forces cleanup of invalid tokens and resets connection state
   */
  async forceResetConnection(): Promise<boolean> {
    try {
      // First clean database
      await this.cleanupPlaceholderTokens();
      
      // Reset local storage
      this.completeConnectionReset();
      
      return true;
    } catch (error) {
      console.error('Error in forceResetConnection:', error);
      return false;
    }
  }
}

export const shopifyConnectionService = new ShopifyConnectionService();


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
      
      if (data && data.length > 0 && data[0].access_token) {
        // Check if the token is a placeholder
        if (data[0].access_token === 'placeholder_token') {
          console.error('Found placeholder token for shop:', shop);
          return 'placeholder_token'; // إعادة الرمز المؤقت ليتم التعامل معه بشكل مخصص
        }
        
        return data[0].access_token;
      }

      console.error('No access token found for shop:', shop);
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
      
      // Check if it's a placeholder token
      if (token === 'placeholder_token') {
        console.log('Placeholder token detected - considered invalid');
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
   * Syncs a store to the database with enhanced token validation
   * @param shop The shop domain
   * @param token Optional token to use
   * @param isActive Whether the store should be active
   */
  async syncStoreToDatabase(shop: string, token?: string, isActive: boolean = true): Promise<void> {
    try {
      if (!shop) {
        throw new Error('Shop domain is required');
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
      
      // نتحقق من الرمز لتجنب استبدال رمز حقيقي برمز مؤقت
      const skipTokenUpdate = !token || token === 'placeholder_token';
      
      // تحقق ما إذا كان هناك رمز حقيقي موجود بالفعل وإذا كان الرمز الجديد هو مؤقت
      let useExistingToken = false;
      if (data && data.length > 0 && skipTokenUpdate && data[0].access_token !== 'placeholder_token') {
        useExistingToken = true;
        console.log('Keeping existing valid token instead of using placeholder or null');
      }
      
      const updateData: any = { 
        updated_at: new Date().toISOString(),
        is_active: isActive
      };
      
      // تحديث الرمز فقط إذا تم توفيره وكان صالحًا (ليس مؤقتًا)
      if (!skipTokenUpdate) {
        updateData.access_token = token;
      }
      
      if (data && data.length > 0) {
        // Update existing store
        await shopifyStores()
          .update(updateData)
          .eq('id', data[0].id);
          
        console.log(`Updated store: ${shop}, updated token: ${!skipTokenUpdate}`);
      } else {
        // إنشاء متجر جديد - فقط إذا كان لدينا رمز حقيقي أو نستخدم مؤقتًا بشكل متعمد
        if (!skipTokenUpdate || token === 'placeholder_token') {
          await shopifyStores().insert({
            shop,
            access_token: token,
            is_active: isActive,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          console.log(`Created new store: ${shop} with token: ${token === 'placeholder_token' ? 'placeholder' : 'valid'}`);
        } else {
          console.warn(`Not creating store record with null token: ${shop}`);
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
    
    // Reset connection manager
    shopifyConnectionManager.clearAllStores();
    shopifyConnectionManager.resetLoopDetection();
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
      
      // Check if it's a placeholder token
      if (token === 'placeholder_token') {
        console.log('Placeholder token detected during test - considered invalid');
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
   * Manual token update with validation
   * @param shop Shop domain
   * @param token Access token
   */
  async updateToken(shop: string, token: string): Promise<boolean> {
    try {
      if (!shop || !token) {
        throw new Error("Shop and token are required");
      }
      
      // Check if token is valid
      const isValid = await this.testConnection(shop, token);
      
      if (!isValid) {
        throw new Error("Token validation failed. Please check your token and try again.");
      }
      
      // Update the token
      await this.syncStoreToDatabase(shop, token, true);
      
      return true;
    } catch (error) {
      console.error("Error updating token:", error);
      throw error;
    }
  }
}

export const shopifyConnectionService = new ShopifyConnectionService();

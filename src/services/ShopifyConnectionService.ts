
import { supabase } from '@/integrations/supabase/client';

export class ShopifyConnectionService {
  private static instance: ShopifyConnectionService;
  private tokenCache: Map<string, { token: string; timestamp: number }> = new Map();
  private cacheExpiration = 15 * 60 * 1000; // 15 minutes in milliseconds

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ShopifyConnectionService {
    if (!ShopifyConnectionService.instance) {
      ShopifyConnectionService.instance = new ShopifyConnectionService();
    }
    return ShopifyConnectionService.instance;
  }

  /**
   * Get access token for a Shopify store
   */
  public async getAccessToken(shop: string): Promise<string> {
    // Check cache first
    const cachedToken = this.tokenCache.get(shop);
    if (cachedToken && Date.now() - cachedToken.timestamp < this.cacheExpiration) {
      return cachedToken.token;
    }

    try {
      // Fetch from database
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', shop)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching token:', error);
        throw new Error(`Failed to get access token for ${shop}: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(`No access token found for ${shop}`);
      }

      // Get the token field (handle potential property name differences)
      const token = data[0].access_token || '';
      
      if (!token) {
        throw new Error(`Invalid access token for ${shop}`);
      }

      // Update cache
      this.tokenCache.set(shop, { token, timestamp: Date.now() });
      
      return token;
    } catch (error) {
      console.error('Error in getAccessToken:', error);
      throw error;
    }
  }

  /**
   * Test if a token is valid
   */
  public async isTokenValid(shop: string, token?: string): Promise<boolean> {
    try {
      // Use token provided or get from service
      const accessToken = token || await this.getAccessToken(shop);
      
      // Call Shopify API to test token
      const { data, error } = await supabase.functions.invoke('shopify-test-connection', {
        body: { shop, accessToken }
      });

      if (error) {
        console.error('Token validation error:', error);
        return false;
      }

      return data?.success === true;
    } catch (error) {
      console.error('Error testing token validity:', error);
      return false;
    }
  }

  /**
   * Store a new access token
   */
  public async storeAccessToken(shop: string, accessToken: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shopify_stores')
        .insert([
          { shop, access_token: accessToken }
        ]);

      if (error) {
        console.error('Error storing token:', error);
        return false;
      }

      // Update cache
      this.tokenCache.set(shop, { token: accessToken, timestamp: Date.now() });
      
      return true;
    } catch (error) {
      console.error('Error in storeAccessToken:', error);
      return false;
    }
  }

  /**
   * Force activate a store (set it as the active store)
   */
  public async forceActivateStore(shop: string): Promise<boolean> {
    try {
      // First, set all stores to inactive
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .neq('id', 0); // Update all records

      if (updateError) {
        console.error('Error deactivating stores:', updateError);
        // Continue anyway, we'll try to activate the target store
      }

      // Then, set the target store to active
      const { error } = await supabase
        .from('shopify_stores')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('shop', shop);

      if (error) {
        console.error('Error activating store:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in forceActivateStore:', error);
      return false;
    }
  }

  /**
   * Complete connection reset - clear all data and caches
   */
  public completeConnectionReset(): boolean {
    try {
      // Clear token cache
      this.clearTokenCache();
      
      // Clear localStorage items related to Shopify
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_url_shop');
      localStorage.removeItem('shopify_last_error');
      localStorage.removeItem('shopify_recovery_attempt');
      localStorage.removeItem('shopify_failsafe');
      localStorage.removeItem('pending_form_syncs');
      localStorage.removeItem('bypass_auth');
      
      console.log('Completed Shopify connection reset');
      return true;
    } catch (error) {
      console.error('Error in completeConnectionReset:', error);
      return false;
    }
  }

  /**
   * Clear cached token for a shop
   */
  public clearTokenCache(shop?: string): void {
    if (shop) {
      this.tokenCache.delete(shop);
    } else {
      this.tokenCache.clear();
    }
  }
}

// Export a singleton instance
export const shopifyConnectionService = ShopifyConnectionService.getInstance();

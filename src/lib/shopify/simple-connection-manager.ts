
import { cleanShopifyDomain } from './types';
import { setActiveShop, getActiveShopId, getActiveShopInfo } from '@/utils/shop-utils';

class SimpleShopifyConnectionManager {
  /**
   * Set the active store using centralized utility
   */
  public setActiveStore(domain: string): void {
    try {
      const cleanedDomain = cleanShopifyDomain(domain);
      if (!cleanedDomain) {
        console.error('Invalid domain provided');
        return;
      }
      
      console.log(`🔄 SimpleShopifyConnectionManager: Setting active store: ${cleanedDomain}`);
      setActiveShop(cleanedDomain);
      
    } catch (error) {
      console.error('Error setting active store:', error);
    }
  }
  
  /**
   * Get the active store using centralized utility
   */
  public getActiveStore(): string | null {
    try {
      return getActiveShopId();
    } catch (error) {
      console.error('Error getting active store:', error);
      return null;
    }
  }
  
  /**
   * Check if connected using centralized utility
   */
  public isConnected(): boolean {
    const activeStore = this.getActiveStore();
    const connected = localStorage.getItem('shopify_connected') === 'true';
    return !!(activeStore && connected);
  }
  
  /**
   * Disconnect completely
   */
  public disconnect(): void {
    try {
      console.log('🔌 SimpleShopifyConnectionManager: Disconnecting from all stores...');
      this.clearAllData();
      console.log('✅ Disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }
  
  /**
   * Clear all data
   */
  private clearAllData(): void {
    try {
      // List of all Shopify keys
      const shopifyKeys = [
        'simple_active_store',
        'shopify_store',
        'shopify_connected',
        'active_shop',
        'shopify_active_store',
        'shopify_stores',
        'shopify_connected_stores',
        'shopify_last_url_shop',
        'shopify_failsafe',
        'shopify_token_error',
        'shopify_temp_store',
        'shopify_connecting',
        'shopify_connection_success',
        'shopify_connection_timestamp',
        'shopify_last_error',
        'shopify_recovery_attempt'
      ];
      
      // Clear specified keys
      shopifyKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear any other keys that start with shopify_
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('shopify_') && 
            !key.includes('user') && 
            !key.includes('settings')) {
          localStorage.removeItem(key);
        }
      });
      
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    const shopInfo = getActiveShopInfo();
    return {
      activeStore: shopInfo.shopId,
      source: shopInfo.source,
      isConnected: this.isConnected(),
      localStorageData: {
        simple_active_store: localStorage.getItem('simple_active_store'),
        shopify_store: localStorage.getItem('shopify_store'),
        active_shop: localStorage.getItem('active_shop'),
        shopify_connected: localStorage.getItem('shopify_connected')
      }
    };
  }
}

export const simpleShopifyConnectionManager = new SimpleShopifyConnectionManager();

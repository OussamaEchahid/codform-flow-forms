import { cleanShopifyDomain, ShopifyStoreConnection } from './types';
import { connectionLogger } from './debug-logger';

class ShopifyConnectionManager {
  private readonly ACTIVE_STORE_KEY = 'shopify_active_store';
  private readonly STORES_KEY = 'shopify_connected_stores';
  private readonly URL_SHOP_KEY = 'shopify_last_url_shop';
  private readonly LOOP_DETECTION_KEY = 'shopify_loop_detection';
  private readonly LOOP_THRESHOLD = 5; // Number of attempts within timeframe to detect a loop
  private readonly LOOP_TIMEFRAME = 10000; // 10 seconds
  
  /**
   * Adds or updates a store in the connection manager
   * @param domain The store domain
   * @param isActive Whether the store is active
   * @param forceUpdate Whether to clear all other stores
   */
  public addOrUpdateStore(domain: string, isActive = false, forceUpdate = false): void {
    try {
      // Clean the domain first
      const cleanedDomain = cleanShopifyDomain(domain);
      
      if (!cleanedDomain) {
        connectionLogger.error('Invalid domain provided to addOrUpdateStore');
        return;
      }
      
      connectionLogger.info(`Adding/updating store: ${cleanedDomain}, isActive: ${isActive}, forceUpdate: ${forceUpdate}`);
      
      // If we're clearing others, just set this as the only store
      if (forceUpdate) {
        this.clearAllStores();
        
        // Set as the only and active store
        const currentTimestamp = new Date().toISOString();
        const stores: ShopifyStoreConnection[] = [{ 
          domain: cleanedDomain, 
          shop: cleanedDomain, 
          isActive: true,
          lastConnected: currentTimestamp
        }];
        
        // Set consistent local storage items
        localStorage.setItem(this.STORES_KEY, JSON.stringify(stores));
        localStorage.setItem(this.ACTIVE_STORE_KEY, cleanedDomain);
        localStorage.setItem('shopify_store', cleanedDomain);
        localStorage.setItem('shopify_connected', isActive ? 'true' : 'false');
        
        return;
      }
      
      // Get existing stores
      const existingStores = this.getAllStores();
      
      // Find if this store already exists
      const existingIndex = existingStores.findIndex(s => s.domain === cleanedDomain);
      const currentTimestamp = new Date().toISOString();
      
      if (existingIndex >= 0) {
        // Update existing store
        existingStores[existingIndex].isActive = isActive;
        existingStores[existingIndex].lastConnected = currentTimestamp;
      } else {
        // Add new store
        existingStores.push({ 
          domain: cleanedDomain, 
          shop: cleanedDomain, 
          isActive,
          lastConnected: currentTimestamp
        });
      }
      
      // If this store is active, make all others inactive
      if (isActive) {
        for (let i = 0; i < existingStores.length; i++) {
          if (existingStores[i].domain !== cleanedDomain) {
            existingStores[i].isActive = false;
          }
        }
        
        // Update all local storage keys for consistency
        localStorage.setItem(this.ACTIVE_STORE_KEY, cleanedDomain);
        localStorage.setItem('shopify_store', cleanedDomain);
        localStorage.setItem('shopify_connected', 'true');
      }
      
      // Save stores
      localStorage.setItem(this.STORES_KEY, JSON.stringify(existingStores));
    } catch (error) {
      connectionLogger.error('Error in addOrUpdateStore:', error);
    }
  }
  
  /**
   * Gets the active store domain
   * @returns The active store domain or null if none
   */
  public getActiveStore(): string | null {
    try {
      // First check the dedicated active store key
      const activeStore = localStorage.getItem(this.ACTIVE_STORE_KEY);
      if (activeStore) {
        connectionLogger.info('Retrieved active store from ACTIVE_STORE_KEY:', activeStore);
        return activeStore;
      }
      
      // Fall back to checking store list
      const stores = this.getAllStores();
      const activeFromList = stores.find(s => s.isActive);
      
      if (activeFromList) {
        // Update the active store key for next time
        localStorage.setItem(this.ACTIVE_STORE_KEY, activeFromList.domain);
        return activeFromList.domain;
      }
      
      // If there's at least one store, return the first one
      if (stores.length > 0) {
        return stores[0].domain;
      }
      
      // Check legacy storage
      const legacyStore = localStorage.getItem('shopify_store');
      if (legacyStore) {
        // Update consistent state by saving to the new format
        this.addOrUpdateStore(legacyStore, true);
        return legacyStore;
      }
      
      return null;
    } catch (error) {
      connectionLogger.error('Error in getActiveStore:', error);
      return null;
    }
  }
  
  /**
   * Sets the active store
   * @param domain The store domain to set active
   */
  public setActiveStore(domain: string): void {
    try {
      const cleanedDomain = cleanShopifyDomain(domain);
      if (!cleanedDomain) return;
      
      this.addOrUpdateStore(cleanedDomain, true);
    } catch (error) {
      connectionLogger.error('Error in setActiveStore:', error);
    }
  }
  
  /**
   * Gets all stored stores
   * @returns Array of store objects
   */
  public getAllStores(): ShopifyStoreConnection[] {
    try {
      const storesJson = localStorage.getItem(this.STORES_KEY);
      
      if (storesJson) {
        return JSON.parse(storesJson) as ShopifyStoreConnection[];
      }
      
      // Check for legacy store
      const legacyStore = localStorage.getItem('shopify_store');
      if (legacyStore) {
        // Convert legacy store to new format
        const isConnected = localStorage.getItem('shopify_connected') === 'true';
        return [{ 
          domain: legacyStore, 
          shop: legacyStore, 
          isActive: isConnected,
          lastConnected: new Date().toISOString()
        }];
      }
      
      return [];
    } catch (error) {
      connectionLogger.error('Error in getAllStores:', error);
      return [];
    }
  }
  
  /**
   * Removes a store from the connection manager
   * @param domain The store domain to remove
   */
  public removeStore(domain: string): void {
    try {
      const cleanedDomain = cleanShopifyDomain(domain);
      
      if (!cleanedDomain) return;
      
      const stores = this.getAllStores().filter(s => s.domain !== cleanedDomain);
      
      // Update the active store if needed
      const activeStore = this.getActiveStore();
      if (activeStore === cleanedDomain) {
        // Set a new active store or clear it
        if (stores.length > 0) {
          stores[0].isActive = true;
          localStorage.setItem(this.ACTIVE_STORE_KEY, stores[0].domain);
          localStorage.setItem('shopify_store', stores[0].domain);
          localStorage.setItem('shopify_connected', 'true');
        } else {
          localStorage.removeItem(this.ACTIVE_STORE_KEY);
          localStorage.removeItem('shopify_store');
          localStorage.removeItem('shopify_connected');
        }
      }
      
      localStorage.setItem(this.STORES_KEY, JSON.stringify(stores));
    } catch (error) {
      connectionLogger.error('Error in removeStore:', error);
    }
  }
  
  /**
   * Clears all stores except the one specified
   * @param exceptDomain The domain to keep
   */
  public clearAllStoresExcept(exceptDomain: string): void {
    try {
      const cleanedDomain = cleanShopifyDomain(exceptDomain);
      
      if (!cleanedDomain) {
        this.clearAllStores();
        return;
      }
      
      // Get existing stores
      const existingStores = this.getAllStores();
      
      // Find the store to keep
      const storeToKeep = existingStores.find(s => s.domain === cleanedDomain);
      
      if (storeToKeep) {
        // Keep only this store and make it active
        storeToKeep.isActive = true;
        localStorage.setItem(this.STORES_KEY, JSON.stringify([storeToKeep]));
        localStorage.setItem(this.ACTIVE_STORE_KEY, cleanedDomain);
        localStorage.setItem('shopify_store', cleanedDomain);
        localStorage.setItem('shopify_connected', 'true');
      } else {
        // If the store to keep doesn't exist, just clear all stores
        this.clearAllStores();
      }
    } catch (error) {
      connectionLogger.error('Error in clearAllStoresExcept:', error);
    }
  }
  
  /**
   * Clears all stores
   */
  public clearAllStores(): void {
    try {
      localStorage.removeItem(this.STORES_KEY);
      localStorage.removeItem(this.ACTIVE_STORE_KEY);
      localStorage.removeItem(this.URL_SHOP_KEY);
      
      // Also clear legacy storage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
    } catch (error) {
      connectionLogger.error('Error in clearAllStores:', error);
    }
  }
  
  /**
   * Saves the last shop from URL params
   * @param shopDomain The shop domain from URL
   */
  public saveLastUrlShop(shopDomain: string): void {
    try {
      if (!shopDomain) return;
      
      const cleanedDomain = cleanShopifyDomain(shopDomain);
      
      if (cleanedDomain) {
        localStorage.setItem(this.URL_SHOP_KEY, cleanedDomain);
      }
    } catch (error) {
      connectionLogger.error('Error in saveLastUrlShop:', error);
    }
  }
  
  /**
   * Gets the last shop from URL params
   * @returns The last shop domain from URL or null
   */
  public getLastUrlShop(): string | null {
    try {
      return localStorage.getItem(this.URL_SHOP_KEY);
    } catch (error) {
      connectionLogger.error('Error in getLastUrlShop:', error);
      return null;
    }
  }
  
  /**
   * Validates connection state consistency
   * @returns True if state is consistent
   */
  public validateConnectionState(): boolean {
    try {
      const activeStore = this.getActiveStore();
      const legacyStore = localStorage.getItem('shopify_store');
      const isConnected = localStorage.getItem('shopify_connected') === 'true';
      
      // No store means nothing to validate
      if (!activeStore && !legacyStore) {
        return false;
      }
      
      // Ensure localStorage is in sync
      if (activeStore) {
        localStorage.setItem('shopify_store', activeStore);
        localStorage.setItem('shopify_connected', 'true');
        return true;
      }
      
      // If there's a legacy store but no active store
      if (legacyStore && !activeStore) {
        this.setActiveStore(legacyStore);
        return isConnected;
      }
      
      return isConnected && !!activeStore;
    } catch (error) {
      connectionLogger.error('Error in validateConnectionState:', error);
      return false;
    }
  }
  
  /**
   * Detects if we're in a connection loop
   * @returns True if a loop is detected
   */
  public isInConnectionLoop(): boolean {
    try {
      const now = Date.now();
      let loopData = localStorage.getItem(this.LOOP_DETECTION_KEY);
      let attempts: number[] = [];
      
      if (loopData) {
        attempts = JSON.parse(loopData);
      }
      
      // Add the current timestamp
      attempts.push(now);
      
      // Keep only attempts within the timeframe
      attempts = attempts.filter(timestamp => (now - timestamp) < this.LOOP_TIMEFRAME);
      
      // Save updated attempts
      localStorage.setItem(this.LOOP_DETECTION_KEY, JSON.stringify(attempts));
      
      // Check if we've exceeded the threshold
      return attempts.length >= this.LOOP_THRESHOLD;
    } catch (error) {
      connectionLogger.error('Error in isInConnectionLoop:', error);
      return false;
    }
  }
  
  /**
   * Resets loop detection
   */
  public resetLoopDetection(): void {
    try {
      localStorage.removeItem(this.LOOP_DETECTION_KEY);
    } catch (error) {
      connectionLogger.error('Error in resetLoopDetection:', error);
    }
  }
}

export const shopifyConnectionManager = new ShopifyConnectionManager();


// Correct implementation of the ShopifyConnectionManager class
// We're removing the force_update field from database operations and
// correctly implementing the methods

import { cleanShopifyDomain } from './types';

interface Store {
  domain: string;
  isActive: boolean;
}

class ShopifyConnectionManager {
  private readonly ACTIVE_STORE_KEY = 'shopify_active_store';
  private readonly STORES_KEY = 'shopify_connected_stores';
  private readonly URL_SHOP_KEY = 'shopify_last_url_shop';
  
  /**
   * Adds or updates a store in the connection manager
   * @param domain The store domain
   * @param isActive Whether the store is active
   * @param clearOthers Whether to clear all other stores
   */
  public addOrUpdateStore(domain: string, isActive = false, clearOthers = false): void {
    try {
      // Clean the domain first
      const cleanedDomain = cleanShopifyDomain(domain);
      
      if (!cleanedDomain) {
        console.error('Invalid domain provided to addOrUpdateStore');
        return;
      }
      
      console.log(`Adding/updating store: ${cleanedDomain}, isActive: ${isActive}, forceUpdate: ${clearOthers}`);
      
      // If we're clearing others, just set this as the only store
      if (clearOthers) {
        this.clearAllStores();
        
        // Set as the only and active store
        const stores: Store[] = [{ domain: cleanedDomain, isActive: true }];
        localStorage.setItem(this.STORES_KEY, JSON.stringify(stores));
        localStorage.setItem(this.ACTIVE_STORE_KEY, cleanedDomain);
        
        return;
      }
      
      // Get existing stores
      const existingStores = this.getAllStores();
      
      // Find if this store already exists
      const existingIndex = existingStores.findIndex(s => s.domain === cleanedDomain);
      
      if (existingIndex >= 0) {
        // Update existing store
        existingStores[existingIndex].isActive = isActive;
      } else {
        // Add new store
        existingStores.push({ domain: cleanedDomain, isActive });
      }
      
      // If this store is active, make all others inactive
      if (isActive) {
        for (let i = 0; i < existingStores.length; i++) {
          if (existingStores[i].domain !== cleanedDomain) {
            existingStores[i].isActive = false;
          }
        }
        
        // Update the active store key
        localStorage.setItem(this.ACTIVE_STORE_KEY, cleanedDomain);
      }
      
      // Save stores
      localStorage.setItem(this.STORES_KEY, JSON.stringify(existingStores));
    } catch (error) {
      console.error('Error in addOrUpdateStore:', error);
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
        console.log('Retrieved active store from ACTIVE_STORE_KEY:', activeStore);
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
        return legacyStore;
      }
      
      return null;
    } catch (error) {
      console.error('Error in getActiveStore:', error);
      return null;
    }
  }
  
  /**
   * Gets all stored stores
   * @returns Array of store objects
   */
  public getAllStores(): Store[] {
    try {
      const storesJson = localStorage.getItem(this.STORES_KEY);
      
      if (storesJson) {
        return JSON.parse(storesJson) as Store[];
      }
      
      // Check for legacy store
      const legacyStore = localStorage.getItem('shopify_store');
      if (legacyStore) {
        // Convert legacy store to new format
        const isConnected = localStorage.getItem('shopify_connected') === 'true';
        return [{ domain: legacyStore, isActive: isConnected }];
      }
      
      return [];
    } catch (error) {
      console.error('Error in getAllStores:', error);
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
        } else {
          localStorage.removeItem(this.ACTIVE_STORE_KEY);
        }
      }
      
      localStorage.setItem(this.STORES_KEY, JSON.stringify(stores));
      
      // Also clean up legacy storage if needed
      if (localStorage.getItem('shopify_store') === cleanedDomain) {
        localStorage.removeItem('shopify_store');
        localStorage.removeItem('shopify_connected');
      }
    } catch (error) {
      console.error('Error in removeStore:', error);
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
      console.error('Error in clearAllStores:', error);
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
      console.error('Error in saveLastUrlShop:', error);
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
      console.error('Error in getLastUrlShop:', error);
      return null;
    }
  }
}

// Singleton instance
export const shopifyConnectionManager = new ShopifyConnectionManager();

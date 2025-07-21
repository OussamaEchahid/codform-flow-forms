
// Enhanced implementation of the ShopifyConnectionManager class
// We're adding more robust error handling and cleaning up session state

import { cleanShopifyDomain, ShopifyStoreConnection } from './types';

class ShopifyConnectionManager {
  private readonly ACTIVE_STORE_KEY = 'shopify_active_store';
  private readonly STORES_KEY = 'shopify_connected_stores';
  private readonly URL_SHOP_KEY = 'shopify_last_url_shop';
  private readonly LAST_ERROR_KEY = 'shopify_last_error';
  private readonly RECOVERY_ATTEMPT_KEY = 'shopify_recovery_attempt';
  private readonly CONNECTION_TIMESTAMP_KEY = 'shopify_connection_timestamp';
  
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
        console.error('Invalid domain provided to addOrUpdateStore');
        return;
      }
      
      console.log(`Adding/updating store: ${cleanedDomain}, isActive: ${isActive}, forceUpdate: ${forceUpdate}`);
      
      // Record connection timestamp
      localStorage.setItem(this.CONNECTION_TIMESTAMP_KEY, Date.now().toString());
      
      // Clear any error state
      localStorage.removeItem(this.LAST_ERROR_KEY);
      localStorage.removeItem(this.RECOVERY_ATTEMPT_KEY);
      
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
        localStorage.setItem('shopify_connected', 'true');
        
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
      console.error('Error in addOrUpdateStore:', error);
      this.recordError('addOrUpdateStore', error);
    }
  }
  
  // Cache للمتجر النشط
  private storeCache: string | null = null;
  private storeCacheTime = 0;
  private readonly STORE_CACHE_DURATION = 2 * 60 * 1000; // 2 دقيقة

  /**
   * Gets the active store domain with caching
   * @returns The active store domain or null if none
   */
  public getActiveStore(): string | null {
    try {
      // تحقق من الـ cache أولاً
      const now = Date.now();
      if (this.storeCache && (now - this.storeCacheTime) < this.STORE_CACHE_DURATION) {
        console.log('Retrieved active store from cache:', this.storeCache);
        return this.storeCache;
      }

      // First check the dedicated active store key
      const activeStore = localStorage.getItem(this.ACTIVE_STORE_KEY);
      if (activeStore) {
        console.log('Retrieved active store from ACTIVE_STORE_KEY:', activeStore);
        // حفظ في الـ cache
        this.storeCache = activeStore;
        this.storeCacheTime = now;
        return activeStore;
      } else {
        console.log('No active store found in ACTIVE_STORE_KEY, checking stores list...');
      }
      
      // Fall back to checking store list
      const stores = this.getAllStores();
      console.log('All stores in localStorage:', stores);
      const activeFromList = stores.find(s => s.isActive);
      
      if (activeFromList) {
        console.log('Found active store from list:', activeFromList.domain);
        // Update the active store key for next time
        localStorage.setItem(this.ACTIVE_STORE_KEY, activeFromList.domain);
        // حفظ في الـ cache
        this.storeCache = activeFromList.domain;
        this.storeCacheTime = now;
        return activeFromList.domain;
      } else {
        console.log('No active store found in stores list');
      }
      
      // If there's at least one store, return the first one
      if (stores.length > 0) {
        this.storeCache = stores[0].domain;
        this.storeCacheTime = now;
        return stores[0].domain;
      }
      
      // Check legacy storage
      const legacyStore = localStorage.getItem('shopify_store');
      if (legacyStore) {
        // Update consistent state by saving to the new format
        this.addOrUpdateStore(legacyStore, true);
        this.storeCache = legacyStore;
        this.storeCacheTime = now;
        return legacyStore;
      }
      
      return null;
    } catch (error) {
      console.error('Error in getActiveStore:', error);
      this.recordError('getActiveStore', error);
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
      console.error('Error in setActiveStore:', error);
      this.recordError('setActiveStore', error);
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
      console.error('Error in getAllStores:', error);
      this.recordError('getAllStores', error);
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
      console.error('Error in removeStore:', error);
      this.recordError('removeStore', error);
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
      
      // Clear any error state
      localStorage.removeItem(this.LAST_ERROR_KEY);
      localStorage.removeItem(this.RECOVERY_ATTEMPT_KEY);
    } catch (error) {
      console.error('Error in clearAllStores:', error);
      this.recordError('clearAllStores', error);
    }
  }
  
  /**
   * Clears all stores except the specified one
   * @param shopDomain The shop domain to keep
   */
  public clearAllStoresExcept(shopDomain: string): void {
    try {
      const cleanedDomain = cleanShopifyDomain(shopDomain);
      if (!cleanedDomain) return;
      
      const allStores = this.getAllStores();
      const storeToKeep = allStores.find(s => s.domain === cleanedDomain);
      
      if (storeToKeep) {
        // Keep only this store and make it active
        const currentTimestamp = new Date().toISOString();
        const stores: ShopifyStoreConnection[] = [{ 
          ...storeToKeep, 
          isActive: true,
          lastConnected: currentTimestamp
        }];
        
        localStorage.setItem(this.STORES_KEY, JSON.stringify(stores));
        localStorage.setItem(this.ACTIVE_STORE_KEY, cleanedDomain);
        localStorage.setItem('shopify_store', cleanedDomain);
        localStorage.setItem('shopify_connected', 'true');
      } else {
        // If the store doesn't exist in our list, clear everything
        this.clearAllStores();
      }
    } catch (error) {
      console.error('Error in clearAllStoresExcept:', error);
      this.recordError('clearAllStoresExcept', error);
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
      this.recordError('saveLastUrlShop', error);
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
      this.recordError('getLastUrlShop', error);
      return null;
    }
  }
  
  /**
   * Records connection errors for debugging
   * @param source Source of error
   * @param error Error object
   */
  private recordError(source: string, error: any): void {
    try {
      const errorData = {
        source,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        recoveryAttempts: parseInt(localStorage.getItem(this.RECOVERY_ATTEMPT_KEY) || '0') + 1
      };
      
      localStorage.setItem(this.LAST_ERROR_KEY, JSON.stringify(errorData));
      localStorage.setItem(this.RECOVERY_ATTEMPT_KEY, errorData.recoveryAttempts.toString());
    } catch (e) {
      console.error('Error recording error state:', e);
    }
  }
  
  /**
   * Detects if we're stuck in a connection loop
   * @returns Boolean indicating if we're in a connection loop
   */
  public isInConnectionLoop(): boolean {
    try {
      const attempts = parseInt(localStorage.getItem(this.RECOVERY_ATTEMPT_KEY) || '0');
      const lastConnectionTimestamp = parseInt(localStorage.getItem(this.CONNECTION_TIMESTAMP_KEY) || '0');
      const now = Date.now();
      
      // If we've had too many attempts in a short time, we're in a loop
      if (attempts > 2 && (now - lastConnectionTimestamp < 120000)) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in isInConnectionLoop:', error);
      return false;
    }
  }
  
  /**
   * Resets connection loop detection
   */
  public resetLoopDetection(): void {
    try {
      localStorage.removeItem(this.RECOVERY_ATTEMPT_KEY);
      localStorage.setItem(this.CONNECTION_TIMESTAMP_KEY, Date.now().toString());
      localStorage.removeItem(this.LAST_ERROR_KEY);
    } catch (error) {
      console.error('Error in resetLoopDetection:', error);
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
      
      if (activeStore && (!legacyStore || activeStore !== legacyStore)) {
        localStorage.setItem('shopify_store', activeStore);
        localStorage.setItem('shopify_connected', 'true');
        return true;
      }
      
      if (legacyStore && !activeStore) {
        this.addOrUpdateStore(legacyStore, isConnected);
        return true;
      }
      
      return !!(activeStore && legacyStore && isConnected);
    } catch (error) {
      console.error('Error in validateConnectionState:', error);
      return false;
    }
  }
}

// Singleton instance
export const shopifyConnectionManager = new ShopifyConnectionManager();

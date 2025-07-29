// Simplified Shopify Connection Manager - Direct and Simple
// Only one localStorage key, direct connection to the active store

export class SimpleShopifyConnectionManager {
  private static instance: SimpleShopifyConnectionManager;
  private activeStore: string | null = null;

  // Use only one key for simplicity
  private readonly storageKey = 'current_shopify_store';
  private readonly connectionStatusKey = 'shopify_connected';

  public static getInstance(): SimpleShopifyConnectionManager {
    if (!SimpleShopifyConnectionManager.instance) {
      SimpleShopifyConnectionManager.instance = new SimpleShopifyConnectionManager();
    }
    return SimpleShopifyConnectionManager.instance;
  }

  constructor() {
    this.loadState();
  }

  private loadState() {
    this.activeStore = localStorage.getItem(this.storageKey);
    console.log('📋 Connection state loaded:', { activeStore: this.activeStore });
  }

  private saveState() {
    if (this.activeStore) {
      localStorage.setItem(this.storageKey, this.activeStore);
      localStorage.setItem(this.connectionStatusKey, 'true');
    } else {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.connectionStatusKey);
    }
    console.log('💾 Connection state saved:', { activeStore: this.activeStore });
  }

  getActiveStore(): string | null {
    // Always return the latest from localStorage
    return localStorage.getItem(this.storageKey);
  }

  setActiveStore(storeName: string): boolean {
    try {
      const cleanStoreName = storeName.replace('.myshopify.com', '') + '.myshopify.com';
      console.log(`🔄 Setting active store: ${cleanStoreName}`);
      
      this.activeStore = cleanStoreName;
      this.saveState();
      
      console.log(`✅ Active store set: ${cleanStoreName}`);
      return true;
    } catch (error) {
      console.error('❌ Error setting active store:', error);
      return false;
    }
  }

  isConnected(): boolean {
    const store = this.getActiveStore();
    const connected = localStorage.getItem(this.connectionStatusKey) === 'true';
    return !!(store && connected);
  }

  disconnect(): void {
    console.log('🚪 Disconnecting from store...');
    
    this.activeStore = null;
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.connectionStatusKey);
    
    console.log('✅ Disconnected successfully');
  }

  getDebugInfo(): any {
    return {
      activeStore: this.getActiveStore(),
      isConnected: this.isConnected(),
      storageKeys: {
        [this.storageKey]: localStorage.getItem(this.storageKey),
        [this.connectionStatusKey]: localStorage.getItem(this.connectionStatusKey)
      }
    };
  }
}

// Export single instance
export const simpleShopifyConnectionManager = SimpleShopifyConnectionManager.getInstance();
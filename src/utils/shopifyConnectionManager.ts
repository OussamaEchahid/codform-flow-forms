/**
 * Utility for managing Shopify connection state and throttling attempts
 */
export const ShopifyConnectionManager = {
  /**
   * Get the last connection attempt timestamp
   */
  getLastAttemptTime(): number {
    return parseInt(localStorage.getItem('shopify_last_connect_attempt') || '0', 10);
  },
  
  /**
   * Record a connection attempt
   */
  recordAttempt(): void {
    // Check if emergency disable is active
    if (this.isEmergencyDisabled()) {
      console.log('[ShopifyConnectionManager] Emergency disable active, not recording attempt');
      return;
    }
    
    const now = Date.now();
    localStorage.setItem('shopify_last_connect_attempt', now.toString());
    
    const attempts = this.getAttemptCount() + 1;
    localStorage.setItem('shopify_connect_attempts', attempts.toString());
    
    // If we've made too many attempts, increase the throttle time
    if (attempts > 5) {
      // Throttle more aggressively
      localStorage.setItem('shopify_throttle_until', (now + 300000).toString()); // 5 minutes
    } else if (attempts > 3) {
      localStorage.setItem('shopify_throttle_until', (now + 120000).toString()); // 2 minutes
    }
  },
  
  /**
   * Get the number of connection attempts
   */
  getAttemptCount(): number {
    return parseInt(localStorage.getItem('shopify_connect_attempts') || '0', 10);
  },
  
  /**
   * Reset connection attempts
   */
  resetAttempts(): void {
    localStorage.setItem('shopify_connect_attempts', '0');
    localStorage.removeItem('shopify_throttle_until');
  },
  
  /**
   * Check if we should throttle connection attempts
   */
  shouldThrottle(): boolean {
    // Check if emergency disable is active
    if (this.isEmergencyDisabled()) {
      return true; // Always throttle/block if emergency disable is active
    }
    
    const now = Date.now();
    const lastAttempt = this.getLastAttemptTime();
    const attemptCount = this.getAttemptCount();
    const throttleUntil = parseInt(localStorage.getItem('shopify_throttle_until') || '0', 10);
    
    // If we're in a throttle period
    if (throttleUntil > now) {
      return true;
    }
    
    // If it's been less than 30 seconds since the last attempt (increased from 10s)
    if ((now - lastAttempt) < 30000 && lastAttempt > 0) {
      return true;
    }
    
    // If we've made too many attempts in succession
    if (attemptCount > 3 && (now - lastAttempt) < 120000) { // 2 minutes (increased from 1 minute)
      return true;
    }
    
    return false;
  },
  
  /**
   * Clear all connection data
   */
  clearConnectionData(): void {
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_shop');
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_last_check_time');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('shopify_session_id');
    sessionStorage.removeItem('shopify_session_id');
    sessionStorage.removeItem('shopify_redirect_attempts');
    localStorage.removeItem('shopify_connection_verified');
    localStorage.removeItem('shopify_connection_status');
    localStorage.removeItem('shopify_connection_status_check');
    // Keep the attempt data for throttling
  },
  
  /**
   * Get time to wait before next attempt (in ms)
   */
  getTimeToWait(): number {
    // If emergency disabled, return a large number
    if (this.isEmergencyDisabled()) {
      return 3600000; // 1 hour - effectively blocking all attempts
    }
    
    const now = Date.now();
    const lastAttempt = this.getLastAttemptTime();
    const attemptCount = this.getAttemptCount();
    const throttleUntil = parseInt(localStorage.getItem('shopify_throttle_until') || '0', 10);
    
    // If we're in a throttle period
    if (throttleUntil > now) {
      return throttleUntil - now;
    }
    
    if (lastAttempt === 0) return 0;
    
    if (attemptCount > 3) {
      return Math.max(0, 120000 - (now - lastAttempt)); // 2 minutes (increased from 1 minute)
    }
    
    return Math.max(0, 30000 - (now - lastAttempt)); // 30 seconds (increased from 10 seconds)
  },
  
  /**
   * Check if we've been trying to connect too frequently
   * If so, we might need to reset some state
   */
  detectConnectionStorm(): boolean {
    const attempts = this.getAttemptCount();
    const lastAttempt = this.getLastAttemptTime();
    const now = Date.now();
    
    // If we've tried more than 10 times in the last 5 minutes
    if (attempts > 10 && (now - lastAttempt) < 300000) {
      // This might be a connection storm, reset state
      console.warn('Detected possible connection storm, resetting state');
      this.resetAttempts();
      this.clearConnectionData();
      return true;
    }
    
    return false;
  },
  
  /**
   * Get the current store we're trying to connect to
   * Allows storing a temporary store before we have a successful connection
   */
  getCurrentStoreTarget(): string | null {
    // First check for a successfully connected store
    const connectedStore = localStorage.getItem('shopify_store');
    if (connectedStore) {
      return connectedStore;
    }
    
    // Then check for a temporary store we're trying to connect to
    return localStorage.getItem('shopify_temp_store') || null;
  },
  
  /**
   * Set a temporary store we want to connect to
   * This will be used during the auth flow
   */
  setTempStore(storeName: string): void {
    if (!storeName) return;
    
    // Clean up the store name
    let store = storeName.trim();
    
    // If it doesn't end with myshopify.com, add it
    if (!store.endsWith('myshopify.com') && !store.includes('.')) {
      store = `${store}.myshopify.com`;
    }
    
    console.log(`[ShopifyConnectionManager] Setting temporary store to: ${store}`);
    localStorage.setItem('shopify_temp_store', store);
  },
  
  /**
   * Clear the temporary store
   */
  clearTempStore(): void {
    localStorage.removeItem('shopify_temp_store');
  },
  
  /**
   * EMERGENCY DISABLE - Completely disable automatic connection checks
   */
  isEmergencyDisabled(): boolean {
    return localStorage.getItem('emergency_disable_shopify_checks') === 'true';
  },
  
  /**
   * Toggle emergency disable mode
   */
  toggleEmergencyDisable(value?: boolean): boolean {
    const newValue = value !== undefined ? value : !this.isEmergencyDisabled();
    localStorage.setItem('emergency_disable_shopify_checks', newValue.toString());
    console.log(`[ShopifyConnectionManager] Emergency mode ${newValue ? 'ENABLED' : 'DISABLED'}`);
    return newValue;
  },
  
  /**
   * Set an initial disabled state if connection storm is detected
   */
  initializeEmergencyModeIfNeeded(): void {
    // If we've had a connection storm, enable emergency mode automatically
    if (this.getAttemptCount() > 7) {
      console.warn('[ShopifyConnectionManager] Too many connection attempts detected, enabling emergency mode');
      this.toggleEmergencyDisable(true);
    }
  },
  
  /**
   * Get all connection state for debugging
   */
  getDebugState(): Record<string, any> {
    return {
      connected: localStorage.getItem('shopify_connected') === 'true',
      store: localStorage.getItem('shopify_store'),
      tempStore: localStorage.getItem('shopify_temp_store'),
      lastCheckTime: localStorage.getItem('shopify_last_check_time'),
      lastConnectTime: localStorage.getItem('shopify_last_connect_time'),
      attempts: this.getAttemptCount(),
      lastAttempt: this.getLastAttemptTime(),
      throttleUntil: localStorage.getItem('shopify_throttle_until'),
      emergencyDisabled: this.isEmergencyDisabled(),
      sessionId: sessionStorage.getItem('shopify_session_id')
    };
  }
};

// Auto-initialize on script load
ShopifyConnectionManager.initializeEmergencyModeIfNeeded();

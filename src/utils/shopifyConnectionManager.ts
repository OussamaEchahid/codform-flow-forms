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
    const now = Date.now();
    localStorage.setItem('shopify_last_connect_attempt', now.toString());
    
    const attempts = this.getAttemptCount() + 1;
    localStorage.setItem('shopify_connect_attempts', attempts.toString());
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
  },
  
  /**
   * Check if we should throttle connection attempts
   */
  shouldThrottle(): boolean {
    const now = Date.now();
    const lastAttempt = this.getLastAttemptTime();
    const attemptCount = this.getAttemptCount();
    
    // If it's been less than 10 seconds since the last attempt
    if ((now - lastAttempt) < 10000 && lastAttempt > 0) {
      return true;
    }
    
    // If we've made too many attempts in succession
    if (attemptCount > 3 && (now - lastAttempt) < 60000) {
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
    // Keep the attempt data for throttling
  },
  
  /**
   * Get time to wait before next attempt (in ms)
   */
  getTimeToWait(): number {
    const now = Date.now();
    const lastAttempt = this.getLastAttemptTime();
    const attemptCount = this.getAttemptCount();
    
    if (lastAttempt === 0) return 0;
    
    if (attemptCount > 3) {
      return Math.max(0, 60000 - (now - lastAttempt));
    }
    
    return Math.max(0, 10000 - (now - lastAttempt));
  }
};

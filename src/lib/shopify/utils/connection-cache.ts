
/**
 * Manages token validation cache with timestamps to avoid excessive API calls
 */

// Cache TTL in milliseconds
export const VALIDATION_CACHE_TTL = 60 * 1000; // 1 minute cache validity

// Storage key for connection state
export const CONNECTION_STATE_KEY = 'shopify_connection_state';

// Token validation cache with timestamps
const tokenValidationCache = new Map<string, { isValid: boolean; timestamp: number }>();

export const connectionCache = {
  // Get cached validation result
  getValidationResult: (shopDomain: string): { isValid: boolean; timestamp: number } | undefined => {
    return tokenValidationCache.get(shopDomain);
  },

  // Set validation result in cache
  setValidationResult: (shopDomain: string, isValid: boolean): void => {
    tokenValidationCache.set(shopDomain, { isValid, timestamp: Date.now() });
  },

  // Clear validation result for specific shop
  clearValidationResult: (shopDomain: string): void => {
    tokenValidationCache.delete(shopDomain);
  },

  // Clear all validation results
  clearAllValidationResults: (): void => {
    tokenValidationCache.clear();
  },

  // Check if validation result is fresh (within TTL)
  isValidationResultFresh: (shopDomain: string): boolean => {
    const cached = tokenValidationCache.get(shopDomain);
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < VALIDATION_CACHE_TTL;
  }
};

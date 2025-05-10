
/**
 * Shared constants for Shopify integration
 */

// API configuration
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;
export const REQUEST_TIMEOUT = 10000;

// Default test store for development
export const DEV_TEST_STORE = 'astrem.myshopify.com';
export const DEV_TEST_TOKEN = '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';

// Local Storage keys
export const LS_KEYS = {
  FORCE_PROD_MODE: 'shopify_force_production_mode',
  FORCE_DEV_MODE: 'shopify_force_development_mode',
  FAIL_SAFE_MODE: 'shopify_fail_safe_mode',
  LAST_SHOP: 'shopify_store',
  CACHED_PRODUCTS: 'shopify_products'
};

// Environment detection - more robust with override capability
export const isDevelopmentMode = (): boolean => {
  // Check for user preference override first
  const forceProdMode = localStorage.getItem(LS_KEYS.FORCE_PROD_MODE) === 'true';
  const forceDevMode = localStorage.getItem(LS_KEYS.FORCE_DEV_MODE) === 'true';
  
  if (forceProdMode) return false;
  if (forceDevMode) return true;
  
  // Check for development environment markers
  const isDev = 
    process.env.NODE_ENV === 'development' || 
    import.meta.env?.DEV === true || 
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('lovableproject.com');
    
  return isDev;
};

// Override the development mode setting
export const setDevelopmentMode = (enable: boolean): void => {
  if (enable) {
    localStorage.setItem(LS_KEYS.FORCE_DEV_MODE, 'true');
    localStorage.removeItem(LS_KEYS.FORCE_PROD_MODE);
  } else {
    localStorage.setItem(LS_KEYS.FORCE_PROD_MODE, 'true');
    localStorage.removeItem(LS_KEYS.FORCE_DEV_MODE);
  }
};

// Test store detection - more comprehensive
export const isTestStore = (shop: string): boolean => {
  if (!shop) return false;
  
  // List of test store identifiers
  const testIdentifiers = [
    'test-store',
    'myteststore', 
    'astrem',
    'dev',
    'demo',
    'example',
    'localhost'
  ];
  
  // Check if the shop domain includes any test identifier
  return testIdentifiers.some(
    identifier => shop.toLowerCase().includes(identifier.toLowerCase())
  );
};

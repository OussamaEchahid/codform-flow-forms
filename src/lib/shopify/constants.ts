
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

// Environment detection - more robust
export const isDevelopmentMode = (): boolean => {
  // Check for development environment markers
  const isDev = 
    process.env.NODE_ENV === 'development' || 
    import.meta.env.DEV === true || 
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('.lovableproject.com');
    
  return isDev;
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

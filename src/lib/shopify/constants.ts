
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

// Environment detection
export const isDevelopmentMode = (): boolean => {
  return process.env.NODE_ENV === 'development' || import.meta.env.DEV === true;
};

// Test store detection
export const isTestStore = (shop: string): boolean => {
  if (!shop) return false;
  return ['test-store', 'myteststore', 'astrem', 'dev'].some(
    testName => shop.toLowerCase().includes(testName.toLowerCase())
  );
};


/**
 * Debug logger for Shopify integration
 * Provides consistent logging with identifiers
 */

// Create an instance ID for this browser session
const instanceId = `shopify-${Math.random().toString(36).substring(2, 8)}`;

// Define custom logger
export const connectionLogger = {
  log: (message: string, ...args: any[]) => {
    console.log(`[SHOPIFY:${instanceId}] ${message}`, ...args);
  },
  
  info: (message: string, ...args: any[]) => {
    console.info(`[SHOPIFY:${instanceId}] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[SHOPIFY:${instanceId}] ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[SHOPIFY:${instanceId}] ${message}`, ...args);
  }
};

// Export specialized loggers for different components
export const apiLogger = {
  log: (message: string, ...args: any[]) => {
    console.log(`[SHOPIFY-API:${instanceId}] ${message}`, ...args);
  },
  
  info: (message: string, ...args: any[]) => {
    console.info(`[SHOPIFY-API:${instanceId}] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[SHOPIFY-API:${instanceId}] ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[SHOPIFY-API:${instanceId}] ${message}`, ...args);
  }
};


/**
 * Custom logger for Shopify connection-related events
 */

export const connectionLogger = {
  info: (message: string): void => {
    console.log(`[ShopifyConnection] ${message}`);
  },
  
  error: (message: string, error?: any): void => {
    console.error(`[ShopifyConnection] ${message}`, error);
  },
  
  warn: (message: string): void => {
    console.warn(`[ShopifyConnection] ${message}`);
  },
  
  debug: (message: string, data?: any): void => {
    if (data) {
      console.log(`[ShopifyConnection] ${message}`, data);
    } else {
      console.log(`[ShopifyConnection] ${message}`);
    }
  }
};

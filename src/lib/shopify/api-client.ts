
/**
 * Shopify API Client implementation
 */
import { REQUEST_TIMEOUT, RETRY_DELAY, MAX_RETRIES, isTestStore } from './constants';
import { ShopifyProduct } from './types';
import { getMockProducts } from './mock-data';

/**
 * ShopifyAPI class for interacting with the Shopify Admin API
 */
export class ShopifyAPI {
  private accessToken: string;
  private shop: string;
  private requestId: string;
  
  constructor(accessToken: string, shop: string) {
    this.accessToken = accessToken;
    this.shop = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    this.requestId = `api_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  /**
   * Verify connection to the Shopify store
   */
  async verifyConnection(): Promise<boolean> {
    try {
      console.log(`[${this.requestId}] Verifying connection to ${this.shop}`);
      
      // For test stores, always return true to avoid API calls
      if (isTestStore(this.shop)) {
        console.log(`[${this.requestId}] Test store detected, skipping real verification`);
        return true;
      }
      
      const endpoint = `https://${this.shop}/admin/api/2023-10/shop.json`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${this.requestId}] Connection verification failed: ${response.status}`, errorText);
        return false;
      }
      
      const data = await response.json();
      console.log(`[${this.requestId}] Connection verified successfully for shop: ${data?.shop?.name || this.shop}`);
      return true;
    } catch (error) {
      console.error(`[${this.requestId}] Connection verification error:`, error);
      return false;
    }
  }
  
  /**
   * Get products from the Shopify store using REST API
   */
  async getProducts(): Promise<ShopifyProduct[]> {
    console.log(`[${this.requestId}] Getting products for ${this.shop}`);
    
    // Always use mock data for test stores
    if (isTestStore(this.shop)) {
      console.log(`[${this.requestId}] Test store detected, returning mock products`);
      return getMockProducts();
    }
    
    // Try to get products with retry logic
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[${this.requestId}] Product fetch attempt ${attempt} of ${MAX_RETRIES}`);
        
        // Use REST API instead of GraphQL for better reliability
        const endpoint = `https://${this.shop}/admin/api/2023-10/products.json?limit=50`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        
        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': this.accessToken
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${this.requestId}] Product fetch failed: ${response.status}`, errorText);
          
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            continue;
          }
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.products || !Array.isArray(data.products)) {
          throw new Error('Invalid API response format');
        }
        
        const products: ShopifyProduct[] = data.products.map((product: any) => ({
          id: product.id.toString(),
          title: product.title,
          handle: product.handle,
          images: product.images?.map((img: any) => img.src) || [],
          price: product.variants[0]?.price || '0',
          variants: product.variants?.map((v: any) => ({
            id: v.id.toString(),
            title: v.title,
            price: v.price,
            available: v.inventory_quantity > 0
          })) || []
        }));
        
        console.log(`[${this.requestId}] Successfully fetched ${products.length} products`);
        return products;
      } catch (error) {
        console.error(`[${this.requestId}] Error in product fetch attempt ${attempt}:`, error);
        
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        } else {
          console.error(`[${this.requestId}] All attempts failed, falling back to mock data`);
          return getMockProducts();
        }
      }
    }
    
    // Fallback to mock data if all attempts fail
    return getMockProducts();
  }
}

/**
 * Factory function to create ShopifyAPI instances
 */
export const createShopifyAPI = (accessToken: string, shop: string): ShopifyAPI => {
  return new ShopifyAPI(accessToken, shop);
};

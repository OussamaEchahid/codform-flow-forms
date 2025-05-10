/**
 * Shopify API client factory
 */
import { apiLogger } from './debug-logger';

export interface ShopifyAPIConfig {
  shop: string;
  accessToken?: string;
  apiVersion?: string;
  retries?: number;
  timeout?: number;
}

export class ShopifyAPI {
  private readonly shop: string;
  private readonly accessToken: string | null;
  private readonly apiVersion: string;
  private readonly maxRetries: number;
  private readonly timeout: number;
  
  constructor(config: ShopifyAPIConfig) {
    this.shop = config.shop;
    this.accessToken = config.accessToken || null;
    this.apiVersion = config.apiVersion || '2023-10';
    this.maxRetries = config.retries || 3;
    this.timeout = config.timeout || 10000;
  }
  
  /**
   * Make a GraphQL request to the Shopify API
   */
  async graphql<T>(query: string, variables?: Record<string, any>, customHeaders?: Record<string, string>): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Access token is required for GraphQL queries');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.accessToken,
      ...(customHeaders || {})
    };
    
    const endpoint = `https://${this.shop}/admin/api/${this.apiVersion}/graphql.json`;
    
    // Try up to maxRetries times
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        apiLogger.info(`GraphQL attempt ${attempt}: ${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query,
            variables
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`GraphQL error (${response.status}): ${error}`);
        }
        
        const result = await response.json();
        
        if (result.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }
        
        return result.data as T;
      } catch (error) {
        apiLogger.error(`Error in GraphQL attempt ${attempt}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If this is the last attempt, rethrow
        if (attempt === this.maxRetries) {
          throw lastError;
        }
        
        // Wait before trying again (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
    
    // This should never happen due to the throw in the loop
    throw lastError || new Error('Unknown error in GraphQL request');
  }
  
  /**
   * Make a REST request to the Shopify API
   */
  async rest<T>(
    method: string,
    path: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Access token is required for REST requests');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.accessToken,
      ...(customHeaders || {})
    };
    
    // Ensure path starts with a slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const endpoint = `https://${this.shop}/admin/api/${this.apiVersion}${cleanPath}`;
    
    // Try up to maxRetries times
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        apiLogger.info(`REST ${method} attempt ${attempt}: ${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const options: RequestInit = {
          method,
          headers,
          signal: controller.signal
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          options.body = JSON.stringify(data);
        }
        
        const response = await fetch(endpoint, options);
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`REST error (${response.status}): ${error}`);
        }
        
        // Check if response is empty
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          return result as T;
        } else {
          return {} as T;
        }
      } catch (error) {
        apiLogger.error(`Error in REST attempt ${attempt}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If this is the last attempt, rethrow
        if (attempt === this.maxRetries) {
          throw lastError;
        }
        
        // Wait before trying again (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
    
    // This should never happen due to the throw in the loop
    throw lastError || new Error('Unknown error in REST request');
  }

  /**
   * Verify the connection to the Shopify API
   */
  async verifyConnection(): Promise<boolean> {
    try {
      // Make a simple request to the Shopify API to verify the connection
      const shopData = await this.rest<any>('GET', '/shop.json');
      return !!shopData && !!shopData.shop;
    } catch (error) {
      apiLogger.error('Error verifying connection:', error);
      return false;
    }
  }

  /**
   * Get products from the Shopify API
   */
  async getProducts(limit = 50): Promise<any[]> {
    try {
      // Fetch products using GraphQL for more efficient data retrieval
      const query = `
        query {
          products(first: ${limit}) {
            edges {
              node {
                id
                title
                handle
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      price
                      availableForSale
                    }
                  }
                }
                images(first: 1) {
                  edges {
                    node {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const result = await this.graphql<any>(query);
      
      if (!result || !result.products || !result.products.edges) {
        return [];
      }
      
      // Transform the GraphQL response to a simpler format
      return result.products.edges.map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          price: node.variants.edges[0]?.node.price || "0",
          images: node.images.edges.map((img: any) => img.node.url),
          variants: node.variants.edges.map((v: any) => ({
            id: v.node.id,
            title: v.node.title,
            price: v.node.price,
            available: v.node.availableForSale
          }))
        };
      });
    } catch (error) {
      apiLogger.error('Error fetching products:', error);
      return [];
    }
  }
}

/**
 * Create a new Shopify API client
 */
export function createShopifyAPI(config: ShopifyAPIConfig): ShopifyAPI {
  return new ShopifyAPI(config);
}

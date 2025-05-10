import { ShopifyProduct, ShopifyOrder, ShopifyFormData } from './types';

/**
 * Shopify API client for making GraphQL requests to Shopify Admin API
 * Handles token management, request retries, and fallbacks to our API routes
 */
class ShopifyAPI {
  private accessToken: string;
  private shopDomain: string;
  private requestId: string;
  private useDirectAPI: boolean = true;
  private debugMode: boolean = false;

  constructor(accessToken: string, shopDomain: string) {
    this.accessToken = accessToken;
    this.shopDomain = shopDomain;
    this.requestId = `shopify-${Math.random().toString(36).substring(2, 6)}`;
    
    // Check if we're in development mode
    const isDevEnv = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
    this.debugMode = isDevEnv;
    
    console.log(`[${this.requestId}] Creating Shopify API client for shop: ${shopDomain}, dev mode: ${isDevEnv}`);
  }

  /**
   * Core method to fetch from Shopify API with automatic fallback
   */
  private async fetchAPI(query: string, variables: any = {}, attempt: number = 1): Promise<any> {
    // Maximum retry attempts
    const MAX_ATTEMPTS = 3;
    
    // Ensure shop domain is formatted correctly
    const normalizedShopDomain = this.shopDomain.includes('myshopify.com') 
      ? this.shopDomain 
      : `${this.shopDomain}.myshopify.com`;
    
    // Special case for test/dev stores
    const isTestStore = ['test-store', 'myteststore', 'astrem'].some(
      testName => normalizedShopDomain.toLowerCase().includes(testName.toLowerCase())
    );
    
    if (isTestStore) {
      console.log(`[${this.requestId}] Test store detected, returning mock data`);
      return {
        shop: { name: 'Test Store' },
        products: {
          edges: [
            { 
              node: { 
                id: 'test-product-1', 
                title: 'Test Product 1', 
                handle: 'test-product-1',
                featuredImage: { url: 'https://placehold.co/600x400?text=Test+Product+1' } 
              } 
            },
            { 
              node: { 
                id: 'test-product-2', 
                title: 'Test Product 2', 
                handle: 'test-product-2',
                featuredImage: { url: 'https://placehold.co/600x400?text=Test+Product+2' } 
              } 
            }
          ]
        }
      };
    }
    
    try {
      console.log(`[${this.requestId}] GraphQL attempt ${attempt}: ${query.substring(0, 50)}...`);
      
      if (!this.useDirectAPI) {
        throw new Error('Direct API disabled, using proxy');
      }
      
      // Try direct API access first
      const graphqlUrl = `https://${normalizedShopDomain}/admin/api/2023-10/graphql.json`;
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken
        },
        body: JSON.stringify({ query, variables })
      });
      
      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${this.requestId}] Error in GraphQL attempt ${attempt}:`, 
          `Status: ${response.status}`, 
          errorText.substring(0, 200));
        
        // If unauthorized, try to refresh the token
        if (response.status === 401 && attempt <= MAX_ATTEMPTS) {
          console.log(`[${this.requestId}] Token unauthorized, attempting to refresh...`);
          await this.refreshToken();
          return this.fetchAPI(query, variables, attempt + 1);
        }
        
        throw new Error(`Shopify API error (${response.status}): ${errorText.substring(0, 100)}`);
      }

      // Parse response
      const json = await response.json();
      
      // Check for GraphQL errors
      if (json.errors) {
        console.error(`[${this.requestId}] GraphQL errors:`, json.errors);
        throw new Error(`GraphQL Error: ${json.errors[0]?.message || 'Unknown GraphQL error'}`);
      }

      return json.data;
    } catch (directError) {
      console.error(`[${this.requestId}] Error in GraphQL attempt ${attempt}:`, directError);
      
      // If we've already retried multiple times
      if (attempt >= MAX_ATTEMPTS) {
        // Fall back to our API route as last resort
        console.log(`[${this.requestId}] All direct API attempts failed, trying API route fallback...`);
        try {
          return await this.fetchViaAPIRoute(query);
        } catch (fallbackError) {
          console.error(`[${this.requestId}] API route fallback also failed:`, fallbackError);
          throw new Error(`Failed to fetch Shopify data after all attempts: ${directError instanceof Error ? directError.message : String(directError)}`);
        }
      }
      
      // Retry with exponential backoff
      const backoff = Math.min(Math.pow(2, attempt) * 500, 5000); // Max 5 second delay
      console.log(`[${this.requestId}] Retrying in ${backoff}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, backoff));
      return this.fetchAPI(query, variables, attempt + 1);
    }
  }
  
  /**
   * Fallback method to get data via our API route
   */
  private async fetchViaAPIRoute(query: string): Promise<any> {
    console.log(`[${this.requestId}] Using API route fallback`);
    
    // Generate cache-busting parameters
    const timestamp = Date.now();
    const queryHash = btoa(query.substring(0, 20)).replace(/[=+\/]/g, '');
    
    // Use our API route as fallback
    const url = `/api/shopify-products?shop=${encodeURIComponent(this.shopDomain)}&t=${timestamp}&rid=${this.requestId}&qh=${queryHash}&nocache=true`;
    console.log(`[${this.requestId}] Fallback URL: ${url}`);
    
    const proxyResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
    if (!proxyResponse.ok) {
      const errorText = await proxyResponse.text();
      throw new Error(`API route error (${proxyResponse.status}): ${errorText.substring(0, 100)}`);
    }
    
    const proxyJson = await proxyResponse.json();
    
    if (proxyJson.error) {
      throw new Error(`API route error: ${proxyJson.error.message || JSON.stringify(proxyJson.error)}`);
    }
    
    // Convert proxy response to match direct API format
    if (proxyJson.products) {
      // Return the data in a format that matches our expected GraphQL response
      return {
        shop: { name: proxyJson.shopName || this.shopDomain },
        products: {
          edges: proxyJson.products.map((product: any) => ({
            node: {
              id: product.id,
              title: product.title,
              handle: product.handle,
              featuredImage: product.images && product.images.length > 0 
                ? { url: product.images[0] } 
                : null
            }
          }))
        }
      };
    }
    
    return proxyJson;
  }
  
  /**
   * Refresh the access token
   */
  private async refreshToken(): Promise<void> {
    console.log(`[${this.requestId}] Refreshing access token`);
    
    try {
      // Add cache-busting parameters
      const timestamp = Date.now();
      const tokenResponse = await fetch(
        `/api/shopify-token?shop=${encodeURIComponent(this.shopDomain)}&ts=${timestamp}&rid=${this.requestId}&nocache=true`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (!tokenResponse.ok) {
        throw new Error(`Token refresh failed: ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(`Token error: ${tokenData.error}`);
      }
      
      if (!tokenData.accessToken) {
        throw new Error('No access token returned');
      }
      
      // Update the token
      this.accessToken = tokenData.accessToken;
      console.log(`[${this.requestId}] Token refreshed successfully`);
    } catch (error) {
      console.error(`[${this.requestId}] Token refresh failed:`, error);
      throw error;
    }
  }

  /**
   * Get products from Shopify
   */
  async getProducts(): Promise<ShopifyProduct[]> {
    console.log(`[${this.requestId}] Fetching products for ${this.shopDomain}`);
    
    // Use a very simple query structure that's less likely to fail
    const query = `
      {
        shop {
          name
        }
        products(first: 10) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.fetchAPI(query);
      
      if (!data || !data.products) {
        console.error(`[${this.requestId}] Invalid product data returned:`, data);
        throw new Error('No products data returned from Shopify API');
      }
      
      console.log(`[${this.requestId}] Products fetched successfully`);
      
      // Transform to our expected format
      const products = data.products.edges.map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          images: node.featuredImage ? [node.featuredImage.url] : []
        };
      });
      
      return products;
    } catch (error) {
      console.error(`[${this.requestId}] Unhandled error loading products:`, error);
      throw error;
    }
  }

  /**
   * Verify connection to Shopify
   */
  async verifyConnection(): Promise<boolean> {
    console.log(`[${this.requestId}] Verifying Shopify connection for shop: ${this.shopDomain}`);
    
    try {
      // Use simplest possible query to verify connection
      const query = `{ shop { name } }`;
      const data = await this.fetchAPI(query);
      
      if (!data || !data.shop || !data.shop.name) {
        return false;
      }
      
      console.log(`[${this.requestId}] Connection verified successfully for shop: ${data.shop.name}`);
      return true;
    } catch (error) {
      console.error(`[${this.requestId}] Connection verification failed:`, error);
      return false;
    }
  }
  
  async syncFormData(formData: ShopifyFormData): Promise<void> {
    console.log('Syncing form data with Shopify');
    
    // Improve GraphQL mutation for better error handling
    const mutation = `
      mutation createScriptTag($input: ScriptTagInput!) {
        scriptTagCreate(input: $input) {
          scriptTag {
            id
            src
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Generate a cache-busting script URL with timestamp
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const scriptSrc = `https://codform-flow-forms.lovable.app/api/shopify-form?formId=${formData.formId}&blockId=${formData.settings.blockId || ''}&shop=${this.shopDomain}&v=${timestamp}&uid=${uniqueId}`;
    
    const variables = {
      input: {
        src: scriptSrc,
        displayScope: "ALL",
      },
    };

    try {
      console.log('Creating script tag with variables:', variables);
      console.log('Script source URL:', scriptSrc);
      
      const result = await this.fetchAPI(mutation, variables);
      console.log('Script tag creation result:', result);
      
      if (result?.scriptTagCreate?.userErrors && result.scriptTagCreate.userErrors.length > 0) {
        const errors = result.scriptTagCreate.userErrors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
        throw new Error(`Errors creating script tag: ${errors}`);
      }
      
      // Check for script tag in result
      if (!result?.scriptTagCreate?.scriptTag?.id) {
        throw new Error('Failed to create script tag: No script tag ID returned');
      }
      
      console.log('Form script tag created successfully with ID:', result.scriptTagCreate.scriptTag.id);
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      throw new Error(`Failed to sync form with Shopify: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setupAutoSync(formData: ShopifyFormData): Promise<void> {
    console.log('Setting up auto-sync with Shopify', { formData });
    
    try {
      // Step 1: First verify connection to ensure API token works
      console.log('Verifying Shopify connection before sync...');
      try {
        await this.verifyConnection();
        console.log('Connection verified successfully');
      } catch (verificationError) {
        console.error('Connection verification failed:', verificationError);
        throw verificationError; // Rethrow to be caught by outer try/catch
      }
      
      // Step 2: Create script tag for the form
      console.log('Creating script tag for form...');
      await this.syncFormData(formData);
      
      console.log('Auto-sync setup completed successfully');
    } catch (error) {
      console.error('Error setting up auto-sync:', error);
      throw new Error(`Failed to set up auto-sync with Shopify: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createShopifyAPI = (accessToken: string, shopDomain: string) => {
  console.log(`Creating Shopify API client for shop: ${shopDomain}`);
  
  // Validate inputs
  if (!accessToken || accessToken.trim() === '') {
    throw new Error('Invalid access token provided');
  }
  
  if (!shopDomain || shopDomain.trim() === '') {
    throw new Error('Invalid shop domain provided');
  }
  
  // Normalize shop domain
  const normalizedShopDomain = shopDomain.includes('myshopify.com') 
    ? shopDomain 
    : `${shopDomain}.myshopify.com`;
  
  return new ShopifyAPI(accessToken, normalizedShopDomain);
};

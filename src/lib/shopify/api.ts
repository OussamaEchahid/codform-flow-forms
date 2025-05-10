import { ShopifyProduct, ShopifyOrder, ShopifyFormData } from './types';

class ShopifyAPI {
  private accessToken: string;
  private shopDomain: string;
  private requestId: string;

  constructor(accessToken: string, shopDomain: string) {
    this.accessToken = accessToken;
    this.shopDomain = shopDomain;
    // Generate a unique request ID for this API instance
    this.requestId = Math.random().toString(36).substring(2, 9);
  }

  private async fetchAPI(query: string, variables = {}) {
    // Ensure shop domain is formatted correctly
    const normalizedShopDomain = this.shopDomain.includes('myshopify.com') 
      ? this.shopDomain 
      : `${this.shopDomain}.myshopify.com`;
    
    // Generate cache-busting parameters
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const queryHash = btoa(query.substring(0, 20)).replace(/[=+\/]/g, '');
    
    try {
      // First try direct API access - simpler and more reliable
      console.log(`[${this.requestId}] Making direct request to Shopify Admin API for ${normalizedShopDomain}`);
      
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
        console.error(`[${this.requestId}] Direct API error: ${response.status}, ${errorText.substring(0, 200)}`);
        
        // If unauthorized, throw specific error
        if (response.status === 401) {
          throw new Error('Authentication failed: Your access token may be invalid or expired');
        }
        
        throw new Error(`Shopify API error (${response.status}): ${errorText.substring(0, 100)}`);
      }

      // Parse JSON response
      const json = await response.json();
      
      // Check for GraphQL errors
      if (json.errors) {
        console.error(`[${this.requestId}] GraphQL errors:`, json.errors);
        throw new Error(`GraphQL Error: ${json.errors[0].message}`);
      }

      return json.data;
    } catch (directError) {
      // If direct API access fails, try through the proxy as fallback
      console.error(`[${this.requestId}] Direct API error:`, directError);
      console.log(`[${this.requestId}] Falling back to proxy API...`);
      
      try {
        // Try to use proxy API endpoint as fallback with more parameters for debugging
        const url = `/api/shopify-products?shop=${encodeURIComponent(normalizedShopDomain)}&t=${timestamp}&rid=${this.requestId}&uid=${uniqueId}&qh=${queryHash}`;
        
        const proxyResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        });
        
        if (!proxyResponse.ok) {
          const errorText = await proxyResponse.text();
          console.error(`[${this.requestId}] Proxy API error: ${proxyResponse.status}, ${errorText.substring(0, 200)}`);
          throw new Error(`Proxy API error (${proxyResponse.status}): ${errorText.substring(0, 100)}`);
        }
        
        const proxyJson = await proxyResponse.json();
        
        if (proxyJson.error) {
          throw new Error(`Proxy API error: ${proxyJson.error.message || JSON.stringify(proxyJson.error)}`);
        }
        
        // Convert proxy response format to match direct API format
        // The proxy returns { products: [...] } but we need to transform it to match GraphQL format
        if (proxyJson.products) {
          return {
            products: {
              edges: proxyJson.products.map((product: any) => ({
                node: product
              }))
            }
          };
        }
        
        return proxyJson;
      } catch (proxyError) {
        // If both methods fail, throw the error
        console.error(`[${this.requestId}] Both direct and proxy API failed:`, proxyError);
        throw new Error(`Failed to fetch Shopify data: ${proxyError instanceof Error ? proxyError.message : String(proxyError)}`);
      }
    }
  }

  async getProducts(): Promise<ShopifyProduct[]> {
    console.log(`[${this.requestId}] Fetching products for ${this.shopDomain}`);
    
    // Use a very simple query structure that's less likely to fail
    const query = `
      {
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
      console.error(`[${this.requestId}] Error in getProducts:`, error);
      throw error;
    }
  }

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

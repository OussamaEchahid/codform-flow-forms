import { ShopifyProduct, ShopifyOrder, ShopifyFormData } from './types';

class ShopifyAPI {
  private accessToken: string;
  private shopDomain: string;
  private requestId: string;

  constructor(accessToken: string, shopDomain: string) {
    this.accessToken = accessToken;
    this.shopDomain = shopDomain;
    // Generate a unique request ID for this API instance
    this.requestId = Math.random().toString(36).substring(2, 15);
  }

  private async fetchAPI(query: string, variables = {}) {
    // Ensure shop domain is formatted correctly
    const normalizedShopDomain = this.shopDomain.includes('myshopify.com') 
      ? this.shopDomain 
      : `${this.shopDomain}.myshopify.com`;
    
    // Generate strong cache-busting parameters
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const url = `/api/shopify-proxy?t=${timestamp}&rid=${this.requestId}&uid=${uniqueId}`;
    
    console.log(`Making API request through proxy to Shopify GraphQL API`);
    
    try {
      // Add extra logging for debugging
      console.log('Request details:', {
        shopDomain: normalizedShopDomain,
        query: query.substring(0, 50) + '...', // Log part of the query for debugging
        accessTokenPresent: this.accessToken ? true : false,
        accessTokenLength: this.accessToken ? this.accessToken.length : 0,
        accessTokenFirstChars: this.accessToken ? this.accessToken.substring(0, 4) + '...' : 'none',
        timestamp,
        requestId: this.requestId,
        uniqueId
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add cache control headers
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Unique-Id': uniqueId
        },
        body: JSON.stringify({ 
          query,
          variables,
          shop: normalizedShopDomain,
          accessToken: this.accessToken,
          timestamp,
          requestId: this.requestId
        }),
        // Explicitly prevent caching
        cache: 'no-store',
      });

      // Check for non-2xx status codes first
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response Status:', response.status, 'Response:', errorText.substring(0, 200));
        
        // Check for HTML response which indicates auth issues
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          throw new Error('Authentication error: Received HTML instead of JSON. Your access token is likely invalid or expired.');
        }
        
        // Try to parse the error as JSON
        try {
          const errorJson = JSON.parse(errorText);
          
          // Check if this is a token expiration error
          if (errorJson.errorType === 'token_expired' || 
              response.status === 401 || 
              response.status === 403 || 
              (errorJson.error && errorJson.error.toLowerCase().includes('auth'))) {
            throw new Error(`Authentication error: Your access token is invalid or has expired. Please reconnect your Shopify store.`);
          }
          
          throw new Error(`Shopify API error (${response.status}): ${errorJson.error || errorJson.details || response.statusText}`);
        } catch (parseError) {
          // If parsing fails, return the raw error text
          throw new Error(`Shopify API error (${response.status}): ${response.statusText}. Response: ${errorText.substring(0, 100)}...`);
        }
      }

      // Check content type to ensure we got JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText.substring(0, 200));
        throw new Error('Invalid response format: Expected JSON but received HTML/text. This usually indicates an authentication issue.');
      }

      const json = await response.json();
      
      // Check for GraphQL errors
      if (json.errors) {
        console.error('GraphQL Errors:', json.errors);
        
        // Check specifically for authentication errors
        const errorMessages = json.errors.map((err: any) => err.message).join(', ');
        if (errorMessages.toLowerCase().includes('access') || 
            errorMessages.toLowerCase().includes('token') || 
            errorMessages.toLowerCase().includes('auth') ||
            errorMessages.toLowerCase().includes('unauthorized')) {
          throw new Error(`Authentication error: Your access token may have expired. Please reconnect your Shopify store.`);
        }
        
        throw new Error(`GraphQL Error: ${json.errors[0].message}`);
      }

      return json.data;
    } catch (error) {
      console.error('Error in fetchAPI:', error);
      
      // Improve error messages for authentication issues
      if (error instanceof Error) {
        if (error.message.includes('HTML') || 
            error.message.includes('401') || 
            error.message.includes('403') || 
            error.message.includes('Authentication')) {
          throw new Error(`Authentication error: Your access token is invalid or expired. Please reconnect your Shopify store.`);
        }
      }
      
      throw error; // Rethrow the original error with better context
    }
  }

  async getProducts(): Promise<ShopifyProduct[]> {
    console.log('Fetching products from Shopify API');
    const query = `
      query {
        products(first: 50) {
          edges {
            node {
              id
              title
              handle
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.fetchAPI(query);
      
      if (!data || !data.products) {
        console.error('Invalid product data returned:', data);
        throw new Error('No products data returned from Shopify API');
      }
      
      console.log('Products fetched successfully, transforming data');
      return this.transformProducts(data.products);
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  }

  private transformProducts(data: any): ShopifyProduct[] {
    try {
      if (!data || !data.edges || !Array.isArray(data.edges)) {
        console.error('Invalid product data structure:', data);
        throw new Error('Invalid product data structure received from Shopify');
      }

      return data.edges.map((edge: any) => {
        const node = edge.node;
        let images: string[] = [];
        
        if (node.images && node.images.edges && Array.isArray(node.images.edges)) {
          images = node.images.edges.map((img: any) => img.node.url);
        }

        let variants: any[] = [];
        if (node.variants && node.variants.edges && Array.isArray(node.variants.edges)) {
          variants = node.variants.edges.map((variant: any) => ({
            id: variant.node.id,
            title: variant.node.title,
            price: variant.node.priceV2.amount,
            available: variant.node.availableForSale,
          }));
        }

        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          price: node.priceRangeV2?.minVariantPrice?.amount || '0',
          images: images,
          variants: variants,
        };
      });
    } catch (error) {
      console.error('Error transforming products:', error);
      throw new Error(`Failed to transform product data: ${error instanceof Error ? error.message : String(error)}`);
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

  async verifyConnection(): Promise<boolean> {
    console.log('Verifying Shopify connection for shop:', this.shopDomain);
    
    // Make sure shop domain is properly formatted
    const normalizedShopDomain = this.shopDomain.includes('myshopify.com') 
      ? this.shopDomain 
      : `${this.shopDomain}.myshopify.com`;
    
    console.log('Using normalized shop domain for verification:', normalizedShopDomain);
    
    try {
      // Use the simplest possible query to test the connection
      const query = `
        {
          shop {
            name
          }
        }
      `;
      
      console.log('Sending verification query to Shopify API');
      
      // Add strong cache-busting parameters
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const url = `/api/shopify-proxy?t=${timestamp}&rid=${uniqueId}&ver=1`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Unique-Id': uniqueId
        },
        body: JSON.stringify({ 
          query,
          shop: normalizedShopDomain,
          accessToken: this.accessToken,
          timestamp,
          requestId: uniqueId
        }),
        cache: 'no-store',
      });

      // Check for HTML response which indicates auth issues
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('HTML Error Response:', responseText.substring(0, 200));
        throw new Error('Authentication error: Received HTML instead of JSON. This usually means your access token is invalid or expired.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response (Verify):', errorText, 'Status:', response.status);
        throw new Error(`Shopify API error (${response.status}): ${response.statusText}`);
      }

      const json = await response.json();
      
      if (json.errors) {
        console.error('GraphQL Verification Errors:', json.errors);
        throw new Error(`GraphQL Error: ${json.errors[0].message}`);
      }
      
      const result = json.data;
      
      if (!result || !result.shop || !result.shop.name) {
        console.error('Invalid verification response:', result);
        throw new Error('Invalid response from Shopify API');
      }
      
      console.log('Connection verified successfully, shop name:', result.shop.name);
      return true;
    } catch (error) {
      console.error('Connection verification failed:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Unknown verification error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Add specific guidance for common errors
        if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html')) {
          errorMessage = 'Authentication error: Received HTML instead of JSON. This usually means your access token is invalid or expired.';
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          errorMessage = 'Authentication error: Your access token does not have sufficient permissions or has expired.';
        } else if (errorMessage.includes('404')) {
          errorMessage = 'Shop not found: The shop domain may be incorrect or the shop no longer exists.';
        }
      }
      
      throw new Error(`Could not verify connection to Shopify API: ${errorMessage}`);
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

  /**
   * Update product template to include form automatically
   */
  async updateProductTemplate(formData: ShopifyFormData): Promise<void> {
    console.log('Updating product template with form', { formData });
    
    try {
      // Verify connection first
      await this.verifyConnection();
      
      // Generate a cache-busting timestamp
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const url = `/api/shopify-proxy?t=${timestamp}&rid=${this.requestId}&uid=${uniqueId}`;
      
      console.log('Calling edge function to update product template');
      
      // Call Edge Function via proxy
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Unique-Id': uniqueId
        },
        body: JSON.stringify({
          functionName: 'shopify-theme-updater',
          payload: {
            shop: this.shopDomain,
            accessToken: this.accessToken,
            formId: formData.formId,
            blockId: formData.settings.blockId || '',
            sectionPosition: formData.settings.position || 'after_buy_buttons'
          }
        }),
        cache: 'no-store',
      });
      
      // Handle non-200 responses
      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || response.statusText;
        } catch (e) {
          errorText = await response.text();
        }
        console.error('Error response from theme updater:', errorText);
        throw new Error(`Failed to update product template (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('Theme update reported failure:', result);
        throw new Error(`Failed to update product template: ${result.error || 'Unknown error'}`);
      }
      
      console.log('Product template updated successfully', result);
      
      // Additional return data for debugging
      if (result.snippetCreated) {
        console.log('Created snippet for form embedding');
      }
    } catch (error) {
      console.error('Error updating product template:', error);
      throw new Error(`Failed to update product template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createShopifyAPI = (accessToken: string, shopDomain: string) => {
  console.log(`Creating Shopify API client for shop: ${shopDomain} (token length: ${accessToken?.length || 0})`);
  
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
  
  console.log('Using normalized shop domain:', normalizedShopDomain);
  
  return new ShopifyAPI(accessToken, normalizedShopDomain);
};

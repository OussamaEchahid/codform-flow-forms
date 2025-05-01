import { ShopifyProduct, ShopifyOrder, ShopifyFormData } from './types';

class ShopifyAPI {
  private accessToken: string;
  private shopDomain: string;

  constructor(accessToken: string, shopDomain: string) {
    this.accessToken = accessToken;
    this.shopDomain = shopDomain;
  }

  private async fetchAPI(query: string, variables = {}) {
    // Ensure shop domain is formatted correctly
    const normalizedShopDomain = this.shopDomain.includes('myshopify.com') 
      ? this.shopDomain 
      : `${this.shopDomain}.myshopify.com`;
    
    // Instead of direct API call, use our proxy endpoint
    const url = `/api/shopify-proxy`;
    console.log(`Making API request through proxy to Shopify GraphQL API`);
    
    try {
      // Add extra logging for debugging
      console.log('Request details:', {
        shopDomain: normalizedShopDomain,
        query: query.substring(0, 50) + '...', // Log part of the query for debugging
        accessTokenPresent: this.accessToken ? true : false,
        accessTokenLength: this.accessToken ? this.accessToken.length : 0,
        accessTokenFirstChars: this.accessToken ? `${this.accessToken.substring(0, 4)}...${this.accessToken.substring(this.accessToken.length - 4)}` : 'none'
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          variables,
          shop: normalizedShopDomain,
          accessToken: this.accessToken
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText, 'Status:', response.status);
        
        // Try to parse the error as JSON first
        try {
          const errorJson = JSON.parse(errorText);
          
          // If the error contains a specific "action" field, handle accordingly
          if (errorJson.action === 'reconnect') {
            throw new Error(`Authentication error: Your Shopify access token needs to be refreshed. Please reconnect your store.`);
          }
          
          throw new Error(`Shopify API error (${response.status}): ${errorJson.error || errorJson.details || response.statusText}`);
        } catch (parseError) {
          // If parsing fails, return the raw error text
          throw new Error(`Shopify API error (${response.status}): ${response.statusText}. Response: ${errorText.substring(0, 100)}...`);
        }
      }

      const json = await response.json();
      if (json.errors) {
        console.error('GraphQL Errors:', json.errors);
        throw new Error(`GraphQL Error: ${json.errors[0].message}`);
      }

      return json.data;
    } catch (error) {
      console.error('Error in fetchAPI:', error);
      throw new Error(`Network error while contacting Shopify API: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw error;
    }
  }

  async syncFormData(formData: ShopifyFormData): Promise<void> {
    console.log('Syncing form data with Shopify');
    
    // تحسين استعلام GraphQL لدعم الإعدادات المحددة
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

    // إعداد مصدر السكريبت مع البيانات المطلوبة
    const scriptSrc = `https://codform-flow-forms.lovable.app/api/shopify-form?formId=${formData.formId}&blockId=${formData.settings.blockId || ''}&shop=${this.shopDomain}`;
    
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
      
      // التحقق من وجود scriptTag في النتيجة
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
    console.log('Access token length:', this.accessToken ? this.accessToken.length : 0);
    console.log('Access token first/last chars:', this.accessToken ? `${this.accessToken.substring(0, 4)}...${this.accessToken.substring(this.accessToken.length - 4)}` : 'none');
    
    try {
      // Use the simplest possible query first to test the connection
      const query = `
        {
          shop {
            name
          }
        }
      `;
      
      console.log('Sending verification query to Shopify API');
      const result = await this.fetchAPI(query);
      
      if (!result || !result.shop || !result.shop.name) {
        console.error('Invalid verification response:', result);
        throw new Error('Invalid response from Shopify API');
      }
      
      console.log('Connection verified successfully, shop name:', result.shop.name);
      return true;
    } catch (error) {
      console.error('Connection verification failed:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Verification error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Add specific guidance for common errors
        if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html') || 
            errorMessage.includes('HTML instead of JSON')) {
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

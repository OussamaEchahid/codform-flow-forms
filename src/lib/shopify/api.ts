
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

      // Check if the response is successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText, 'Status:', response.status);
        
        // Handle 401/403 errors explicitly
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication error: Your Shopify access token is invalid or has expired. Please reconnect your store.`);
        }
        
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

      // Parse the JSON response
      const json = await response.json();
      
      // Check for GraphQL errors
      if (json.errors) {
        console.error('GraphQL Errors:', json.errors);
        
        // Check for authentication-related errors
        const errors = json.errors.map((e: any) => e.message).join(', ');
        if (errors.includes('token') || errors.includes('auth') || errors.includes('access')) {
          throw new Error(`Authentication error: ${errors}. Please reconnect your store.`);
        }
        
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
    
    // Ensure the block ID is valid
    const blockId = formData.settings.blockId || '';
    if (!blockId || blockId.trim() === '') {
      throw new Error('Block ID is required for form integration');
    }
    
    // First check if a script tag already exists for this form
    try {
      console.log('Checking for existing script tags...');
      
      const queryExisting = `
        query {
          scriptTags(first: 50) {
            edges {
              node {
                id
                src
                displayScope
              }
            }
          }
        }
      `;
      
      const existingTags = await this.fetchAPI(queryExisting);
      console.log('Found script tags:', existingTags?.scriptTags?.edges?.length || 0);
      
      // Define script src (what we're looking for and what we'll create)
      const formScriptSrc = `https://codform-flow-forms.lovable.app/api/shopify-form?formId=${formData.formId}&blockId=${blockId}&shop=${this.shopDomain}`;
      
      console.log('Target script source URL:', formScriptSrc);
      
      // Check if we already have a script tag for this form
      let existingTag = null;
      let needsUpdate = false;
      
      if (existingTags && existingTags.scriptTags && existingTags.scriptTags.edges) {
        console.log('Checking existing tags against current form ID and block ID');
        // Find a matching script tag - check both formId and blockId
        for (const edge of existingTags.scriptTags.edges) {
          const scriptTag = edge.node;
          console.log('Examining script tag:', scriptTag.src);
          
          // Check if this tag has our formId
          if (scriptTag.src && scriptTag.src.includes(`formId=${formData.formId}`)) {
            existingTag = scriptTag;
            console.log('Found script tag for this form');
            
            // If blockId changed, we need to update
            if (scriptTag.src && !scriptTag.src.includes(`blockId=${blockId}`)) {
              console.log('Block ID has changed, script tag needs update');
              needsUpdate = true;
            } else {
              console.log('Script tag is up to date with correct Block ID');
            }
            break;
          }
        }
      }
      
      // If we found an existing tag but it needs update, delete it first
      if (existingTag && needsUpdate) {
        console.log('Found existing script tag that needs updating, deleting first:', existingTag.id);
        
        const deleteExisting = `
          mutation deleteScriptTag($id: ID!) {
            scriptTagDelete(id: $id) {
              deletedScriptTagId
              userErrors {
                field
                message
              }
            }
          }
        `;
        
        const deleteResult = await this.fetchAPI(deleteExisting, { id: existingTag.id });
        console.log('Delete script tag result:', deleteResult);
        
        // Check for errors in deletion
        if (deleteResult?.scriptTagDelete?.userErrors && deleteResult.scriptTagDelete.userErrors.length > 0) {
          console.error('Errors deleting script tag:', deleteResult.scriptTagDelete.userErrors);
          // Continue anyway to try creating a new one
        }
        
        existingTag = null; // Reset so we create a new one
      } else if (existingTag) {
        console.log('Script tag already exists and is up to date, no changes needed');
        return; // Exit early if script tag exists and is correct
      }
      
      // If we don't have an existing tag, create a new one
      if (!existingTag) {
        console.log('Creating new script tag for form:', formData.formId);
        console.log('Block ID:', blockId);
        console.log('Script source URL:', formScriptSrc);
        
        // Improved GraphQL mutation for creating script tag
        const mutation = `
          mutation createScriptTag($input: ScriptTagInput!) {
            scriptTagCreate(input: $input) {
              scriptTag {
                id
                src
                displayScope
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        // Setup script source with required parameters
        const variables = {
          input: {
            src: formScriptSrc,
            displayScope: "ALL",
          },
        };

        try {
          console.log('Creating script tag with variables:', variables);
          
          const result = await this.fetchAPI(mutation, variables);
          console.log('Script tag creation result:', result);
          
          if (result?.scriptTagCreate?.userErrors && result.scriptTagCreate.userErrors.length > 0) {
            const errors = result.scriptTagCreate.userErrors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
            throw new Error(`Errors creating script tag: ${errors}`);
          }
          
          // Check for scriptTag in result
          if (!result?.scriptTagCreate?.scriptTag?.id) {
            throw new Error('Failed to create script tag: No script tag ID returned');
          }
          
          console.log('Form script tag created successfully with ID:', result.scriptTagCreate.scriptTag.id);
        } catch (error) {
          console.error('Error creating script tag:', error);
          throw error;
        }
      }
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
      // Use the simplest possible query first to test the connection
      const query = `
        {
          shop {
            name
            url
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
      console.log('Shop URL:', result.shop.url);
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
        } else if (errorMessage.includes('authentication')) {
          errorMessage = 'Authentication error: Your access token has expired or is invalid. Please reconnect your store.';
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

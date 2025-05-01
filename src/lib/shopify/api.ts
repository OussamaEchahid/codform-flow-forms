
import { ShopifyProduct, ShopifyOrder, ShopifyFormData } from './types';

class ShopifyAPI {
  private accessToken: string;
  private shopDomain: string;

  constructor(accessToken: string, shopDomain: string) {
    this.accessToken = accessToken;
    this.shopDomain = shopDomain;
  }

  private async fetchAPI(query: string, variables = {}) {
    const url = `https://${this.shopDomain}/admin/api/2024-01/graphql.json`;
    console.log(`Making API request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Shopify API error (${response.status}): ${response.statusText}. Response: ${errorText}`);
      }

      const json = await response.json();
      if (json.errors) {
        console.error('GraphQL Errors:', json.errors);
        throw new Error(json.errors[0].message);
      }

      return json.data;
    } catch (error) {
      console.error('Error in fetchAPI:', error);
      throw error;
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
    console.log('Verifying Shopify connection');
    try {
      const query = `
        query {
          shop {
            name
          }
        }
      `;
      const result = await this.fetchAPI(query);
      console.log('Connection verified successfully, shop name:', result.shop.name);
      return true;
    } catch (error) {
      console.error('Connection verification failed:', error);
      return false;
    }
  }

  async setupAutoSync(formData: ShopifyFormData): Promise<void> {
    console.log('Setting up auto-sync with Shopify', { formData });
    try {
      // أولاً، قم بإنشاء سكريبت للتكامل مع النموذج
      await this.syncFormData(formData);
      
      // ثم قم بإعداد webhook للتحديثات المستقبلية (اختياري)
      // استخدام استعلام GraphQL لإنشاء webhook
      const mutation = `
        mutation createWebhook($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
          webhookSubscriptionCreate(
            topic: $topic,
            webhookSubscription: {
              callbackUrl: $callbackUrl,
              format: JSON
            }
          ) {
            webhookSubscription {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      // تحديد عنوان استدعاء webhook
      const callbackUrl = typeof window !== 'undefined' 
        ? `https://${window.location.host}/api/shopify-webhook` 
        : 'https://codform-flow-forms.lovable.app/api/shopify-webhook';
        
      console.log(`Using webhook callback URL: ${callbackUrl}`);
        
      // إنشاء webhook للتحديثات على المنتجات
      const result = await this.fetchAPI(mutation, {
        topic: 'PRODUCTS_UPDATE',
        callbackUrl: callbackUrl,
      });
        
      console.log('Webhook subscription result:', result);
        
      // التحقق من وجود أخطاء
      if (result?.webhookSubscriptionCreate?.userErrors && result.webhookSubscriptionCreate.userErrors.length > 0) {
        const errors = result.webhookSubscriptionCreate.userErrors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
        // نحن نعتبر أخطاء webhook كتحذيرات فقط ولا نوقف العملية
        console.warn(`Warnings setting up webhook: ${errors}`);
      }
        
      console.log('Auto-sync setup completed successfully');
    } catch (error) {
      console.error('Error setting up auto-sync:', error);
      throw new Error(`Failed to set up auto-sync with Shopify: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createShopifyAPI = (accessToken: string, shopDomain: string) => {
  console.log(`Creating Shopify API client for shop: ${shopDomain} (token length: ${accessToken?.length || 0})`);
  return new ShopifyAPI(accessToken, shopDomain);
};

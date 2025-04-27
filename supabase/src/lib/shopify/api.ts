
import { ShopifyProduct, ShopifyOrder, ShopifyFormData } from './types';

class ShopifyAPI {
  private accessToken: string;
  private shopDomain: string;

  constructor(accessToken: string, shopDomain: string) {
    this.accessToken = accessToken;
    this.shopDomain = shopDomain;
  }

  private async fetchAPI(query: string, variables = {}) {
    const response = await fetch(`https://${this.shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.errors) {
      throw new Error(json.errors[0].message);
    }

    return json.data;
  }

  async getProducts(): Promise<ShopifyProduct[]> {
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

    const data = await this.fetchAPI(query);
    return this.transformProducts(data.products);
  }

  private transformProducts(data: any): ShopifyProduct[] {
    return data.edges.map((edge: any) => {
      const node = edge.node;
      return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        price: node.priceRangeV2.minVariantPrice.amount,
        images: node.images.edges.map((img: any) => img.node.url),
        variants: node.variants.edges.map((variant: any) => ({
          id: variant.node.id,
          title: variant.node.title,
          price: variant.node.priceV2.amount,
          available: variant.node.availableForSale,
        })),
      };
    });
  }

  async syncFormData(formData: ShopifyFormData): Promise<void> {
    const mutation = `
      mutation createAppExtension($input: AppExtensionInput!) {
        appExtensionCreate(input: $input) {
          appExtension {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        type: 'CHECKOUT_POST_PURCHASE',
        title: 'Form Integration',
        config: JSON.stringify(formData),
      },
    };

    try {
      await this.fetchAPI(mutation, variables);
      console.log('Form synced with Shopify successfully');
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const query = `
        query {
          shop {
            name
          }
        }
      `;
      await this.fetchAPI(query);
      return true;
    } catch (error) {
      return false;
    }
  }

  async setupAutoSync(formData: ShopifyFormData): Promise<void> {
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

    try {
      // Setup webhooks for product updates
      await this.fetchAPI(mutation, {
        topic: 'PRODUCTS_UPDATE',
        callbackUrl: `https://${window.location.host}/api/shopify-webhook`,
      });
      
      // Initial sync
      await this.syncFormData(formData);
    } catch (error) {
      console.error('Error setting up auto-sync:', error);
      throw error;
    }
  }
}

export const createShopifyAPI = (accessToken: string, shopDomain: string) => {
  return new ShopifyAPI(accessToken, shopDomain);
};


import { supabase } from '@/integrations/supabase/client';
import { ShopifyProduct, ShopifyFormData, ShopifyOrder } from './types';

// Simple API wrapper for Shopify Admin API requests
export const createShopifyAPI = (accessToken: string, shopDomain: string) => {
  const baseUrl = `https://${shopDomain}/admin/api/2023-01`;
  
  const makeRequest = async (endpoint: string, method: string = 'GET', data?: any) => {
    try {
      const url = `${baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error (${response.status}): ${errorText}`);
      }
      
      // Handle potential HTML responses from Shopify (often indicates an authentication issue)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Received HTML instead of JSON. This often indicates an authentication error.');
      }
      
      // Check if response has content
      const text = await response.text();
      if (!text) return null;
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Shopify API request failed:', error);
      throw error;
    }
  };
  
  return {
    // Verify connection by making a simple request
    verifyConnection: async () => {
      try {
        const response = await makeRequest('/shop.json');
        return !!response && !!response.shop;
      } catch (error) {
        console.error('Shopify connection verification failed:', error);
        return false;
      }
    },
    
    // Get shop information
    getShopInfo: async () => {
      const response = await makeRequest('/shop.json');
      return response?.shop || null;
    },
    
    // Get products
    getProducts: async (limit: number = 50) => {
      const response = await makeRequest(`/products.json?limit=${limit}`);
      
      if (!response || !response.products) {
        return [];
      }
      
      return response.products.map((product: any): ShopifyProduct => ({
        id: product.id.toString(),
        title: product.title,
        handle: product.handle,
        description: product.body_html,
        price: product.variants && product.variants[0] ? product.variants[0].price : '',
        image: product.image ? product.image.src : ''
      }));
    },
    
    // Get a specific product
    getProduct: async (productId: string) => {
      const response = await makeRequest(`/products/${productId}.json`);
      const product = response?.product;
      
      if (!product) {
        return null;
      }
      
      return {
        id: product.id.toString(),
        title: product.title,
        handle: product.handle,
        description: product.body_html,
        price: product.variants && product.variants[0] ? product.variants[0].price : '',
        image: product.image ? product.image.src : ''
      };
    },
    
    // Get recent orders
    getOrders: async (limit: number = 10) => {
      const response = await makeRequest(`/orders.json?limit=${limit}&status=any`);
      
      if (!response || !response.orders) {
        return [];
      }
      
      return response.orders.map((order: any): ShopifyOrder => ({
        id: order.id.toString(),
        order_number: order.name,
        email: order.email || '',
        created_at: order.created_at,
        total_price: order.total_price,
        currency: order.currency,
        financial_status: order.financial_status || '',
      }));
    },
    
    // Update product settings with form
    updateProductSettings: async (productId: string, formData: ShopifyFormData) => {
      try {
        if (!formData?.settings) {
          throw new Error('Form settings are required');
        }
        
        // Extract block ID from settings
        const blockId = formData.settings.blockId;
        
        // Save settings to our database
        const { error } = await supabase
          .from('shopify_product_settings')
          .upsert({
            product_id: productId,
            form_id: formData.form_id,
            shop_id: shopDomain,
            block_id: blockId,
            enabled: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'product_id,shop_id'
          });
        
        if (error) {
          console.error('Error saving product settings to DB:', error);
          throw error;
        }
        
        return true;
      } catch (error) {
        console.error('Failed to update product settings:', error);
        throw error;
      }
    },
    
    // Save form settings
    saveFormSettings: async (formData: ShopifyFormData) => {
      try {
        if (!formData || !formData.form_id || !formData.settings) {
          throw new Error('Invalid form data');
        }
        
        // Save form settings to Shopify metafields
        // Simplified for this implementation
        console.log('Would save form settings to Shopify metafields:', formData);
        
        return true;
      } catch (error) {
        console.error('Failed to save form settings:', error);
        throw error;
      }
    },
    
    // Sync form settings
    syncFormWithShopify: async (formData: ShopifyFormData) => {
      try {
        if (!formData || !formData.form_id) {
          throw new Error('Invalid form data');
        }
        
        // Perform syncing operations
        // Simplified for this implementation
        console.log('Would sync form with Shopify:', formData);
        
        return true;
      } catch (error) {
        console.error('Failed to sync form with Shopify:', error);
        throw error;
      }
    }
  };
};

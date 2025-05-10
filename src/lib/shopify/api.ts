
import { getMockProducts } from './mock-data';
import { isDevelopmentMode, isTestStore } from './constants';
import { toast } from 'sonner';

// Use type import to fix the isolatedModules error
export type { 
  ShopifyProduct, 
  ShopifyVariant, 
  ShopifyFormData 
} from './types';

// Re-export the cleanShopifyDomain function
export { cleanShopifyDomain } from './types';

/**
 * Load Shopify products from the API or mock data
 */
export async function loadShopifyProducts(shop: string, forceRefresh = false): Promise<any[]> {
  // If in development or testing a test store, return mock products
  if (isDevelopmentMode() || isTestStore(shop)) {
    console.log('Using mock products for development/test store');
    return getMockProducts();
  }
  
  try {
    // Implement product loading from the real Shopify API
    // (This would be replaced with actual API calls)
    console.log(`Loading products for shop: ${shop}`);
    
    // For now, we'll just return mock data
    return getMockProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    toast.error('Error loading products');
    return [];
  }
}

/**
 * Test the connection to a Shopify store
 */
export async function testShopifyConnection(shop: string): Promise<boolean> {
  // If in development or testing a test store, return true
  if (isDevelopmentMode() || isTestStore(shop)) {
    console.log('Automatically approving connection for development/test store');
    return true;
  }
  
  try {
    // Call the Supabase Edge Function to test connection
    const response = await fetch('https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1/shopify-test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      },
      body: JSON.stringify({ shop, devMode: isDevelopmentMode() })
    });
    
    if (!response.ok) {
      console.error(`Error response from test connection: ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    return result.success && result.connected;
  } catch (error) {
    console.error('Error testing connection:', error);
    return isDevelopmentMode(); // Auto succeed in dev mode
  }
}

/**
 * Sync a form with Shopify
 */
export async function syncFormWithShopify(formData: any): Promise<any> {
  // If in development or testing a test store, mock success
  if (isDevelopmentMode()) {
    console.log('Mock syncing form with Shopify');
    return {
      success: true,
      message: 'Form synced successfully (dev mode)',
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    // Implementation of syncing would go here
    return {
      success: true,
      message: 'Form synced successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error syncing form with Shopify:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

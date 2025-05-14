
/**
 * Helper functions for generating Shopify Admin routes
 */

// Base URL for Shopify Admin
const ADMIN_BASE_URL = import.meta.env.VITE_SHOPIFY_ADMIN_URL || 'https://codform-flow-forms.lovable.app';

/**
 * Get a full admin route URL
 * @param path The path to append to the admin base URL
 * @param shop Optional shop domain to include as a parameter
 * @returns Full URL for the admin route
 */
export const getAdminRoute = (path: string, shop?: string): string => {
  let route = `${ADMIN_BASE_URL}${path}`;
  
  if (shop) {
    const separator = route.includes('?') ? '&' : '?';
    route += `${separator}shop=${encodeURIComponent(shop)}`;
  }
  
  return route;
};

/**
 * Get the URL for authenticating with Shopify
 * @param shop The shop domain to authenticate with
 * @returns Authentication URL
 */
export const getShopifyAuthUrl = (shop: string): string => {
  return getAdminRoute('/auth', shop);
};

/**
 * Get the URL for the Shopify callback route
 * @param shop Optional shop domain to include as a parameter
 * @returns Callback URL
 */
export const getShopifyCallbackUrl = (shop?: string): string => {
  return getAdminRoute('/api/shopify-callback', shop);
};

/**
 * Get the URL for managing Shopify products
 * @param shop Optional shop domain to include as a parameter
 * @returns Products management URL
 */
export const getProductsAdminRoute = (shop?: string): string => {
  return getAdminRoute('/shopify-products', shop);
};

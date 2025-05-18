
/**
 * Clean and normalize a Shopify store domain
 * @param shop The shop domain to clean
 * @returns The cleaned and normalized shop domain
 */
export function cleanShopDomain(shop: string): string {
  if (!shop) return "";
  
  let cleanedShop = shop.trim();
  
  // Remove protocol if present
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // Ensure it ends with myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

/**
 * Parse Shopify parameters from URL
 * @returns Shop domain and other Shopify parameters if present
 */
export function parseShopifyParams(): { 
  shopDomain?: string;
  hmac?: string; 
  timestamp?: string;
  host?: string;
  isShopifyRequest: boolean;
} {
  const params = new URLSearchParams(window.location.search);
  const shopParam = params.get("shop");
  const hmac = params.get("hmac");
  const timestamp = params.get("timestamp");
  const host = params.get("host");
  
  // Determine if this is a request coming from Shopify
  const isShopifyRequest = !!(shopParam && (hmac || host));
  
  return {
    shopDomain: shopParam ? cleanShopDomain(shopParam) : undefined,
    hmac: hmac || undefined,
    timestamp: timestamp || undefined,
    host: host || undefined,
    isShopifyRequest
  };
}

/**
 * Detect current shop context from various sources
 * @returns The detected shop domain or undefined
 */
export function detectCurrentShop(): string | undefined {
  // First check URL parameters
  const { shopDomain, isShopifyRequest } = parseShopifyParams();
  
  if (shopDomain && isShopifyRequest) {
    return shopDomain;
  }
  
  // Then check localStorage
  const storedShop = localStorage.getItem('shopify_store');
  const isConnected = localStorage.getItem('shopify_connected');
  
  if (storedShop && isConnected === 'true') {
    return cleanShopDomain(storedShop);
  }
  
  return undefined;
}

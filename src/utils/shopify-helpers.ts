
import { cleanShopifyDomain } from '@/lib/shopify/types';

/**
 * Parse Shopify parameters from URL
 * @returns Shop domain and other Shopify parameters if present
 */
export function parseShopifyParams(): { 
  shopDomain?: string;
  hmac?: string; 
  timestamp?: string;
  host?: string;
  code?: string;
  state?: string;
  session?: string;
  auto_connect?: string;
  isShopifyRequest: boolean;
} {
  const params = new URLSearchParams(window.location.search);
  const shopParam = params.get("shop");
  const hmac = params.get("hmac");
  const timestamp = params.get("timestamp");
  const host = params.get("host");
  const code = params.get("code");
  const state = params.get("state");
  const session = params.get("session");
  const auto_connect = params.get("auto_connect");
  
  // Determine if this is a request coming from Shopify
  // More comprehensive check for Shopify requests
  const isShopifyRequest = !!(shopParam && (
    hmac || host || code || state || session || auto_connect ||
    shopParam.includes('.myshopify.com')
  ));
  
  console.log('🔍 Shopify params detection:', {
    shopParam,
    hmac: !!hmac,
    host: !!host,
    code: !!code,
    state: !!state,
    session: !!session,
    auto_connect: !!auto_connect,
    isShopifyRequest
  });
  
  return {
    shopDomain: shopParam ? cleanShopifyDomain(shopParam) : undefined,
    hmac: hmac || undefined,
    timestamp: timestamp || undefined,
    host: host || undefined,
    code: code || undefined,
    state: state || undefined,
    session: session || undefined,
    auto_connect: auto_connect || undefined,
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
    return cleanShopifyDomain(storedShop);
  }
  
  return undefined;
}

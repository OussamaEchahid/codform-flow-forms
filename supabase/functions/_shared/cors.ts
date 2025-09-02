
export const allowedOrigins = [
  'https://codmagnet.com',
  'https://www.codmagnet.com',
  'https://admin.shopify.com',
  'https://astrem.myshopify.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

function isAllowedOrigin(origin?: string) {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:') return false;
    if (allowedOrigins.includes(origin)) return true;
    // Allow any Shopify storefront e.g. https://your-store.myshopify.com
    if (hostname.endsWith('.myshopify.com')) return true;
    return false;
  } catch {
    return false;
  }
}

export function buildCorsHeaders(origin?: string) {
  const allowOrigin = isAllowedOrigin(origin) ? origin! : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Vary': 'Origin',
  };
}

// Backward compatibility
export const corsHeaders = buildCorsHeaders();
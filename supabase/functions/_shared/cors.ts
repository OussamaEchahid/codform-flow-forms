
export const allowedOrigins = [
  'https://codmagnet.com',
  'https://www.codmagnet.com',
];

export function buildCorsHeaders(origin?: string) {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : 'https://codmagnet.com';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Vary': 'Origin',
  };
}

// Backward compatibility
export const corsHeaders = buildCorsHeaders();
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to call Shopify GraphQL Admin API
async function shopifyGQL(shop: string, token: string, query: string, variables?: Record<string, unknown>) {
  const res = await fetch(`https://${shop}/admin/api/2025-04/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`GraphQL error: ${res.status} ${res.statusText} ${JSON.stringify(json.errors || {})}`);
  }
  return json.data;
}

function extractId(gid: string | null | undefined) {
  if (!gid) return null;
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

function mapProduct(node: any, shopInfo: { currencyCode: string; moneyFormat?: string | null; moneyWithCurrencyFormat?: string | null; }) {
  const images = (node.images?.edges || []).map((e: any) => e.node?.url).filter(Boolean);
  const featuredImage = node.featuredImage?.url || images[0] || '/placeholder.svg';
  const variants = (node.variants?.edges || []).map((e: any) => {
    const v = e.node;
    return {
      id: extractId(v.id),
      title: v.title,
      price: v.price?.amount ?? '0',
      compare_at_price: v.compareAtPrice?.amount ?? null,
      sku: v.sku ?? '',
      inventory_quantity: typeof v.inventoryQuantity === 'number' ? v.inventoryQuantity : 0,
      weight: v.weight ?? null,
      weight_unit: v.weightUnit ?? null,
    };
  });

  const basePrice = variants[0]?.price ?? '0';

  return {
    id: extractId(node.id),
    title: node.title,
    handle: node.handle,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    published_at: node.publishedAt,
    status: node.status,
    tags: (node.tags || []).join(', '),
    price: basePrice,
    images,
    featuredImage,
    variants,
    currency: shopInfo.currencyCode,
    money_format: shopInfo.moneyFormat ?? null,
    money_with_currency_format: shopInfo.moneyWithCurrencyFormat ?? null,
  };
}

Deno.serve(async (req) => {
  const requestId = Math.random().toString(36).slice(2, 8);

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    let { shop, productIds, refresh = false } = body as { shop?: string; productIds?: (string|number)[]; refresh?: boolean };

    if (!shop) {
      return new Response(JSON.stringify({ success: false, message: 'Shop parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!shop.includes('.myshopify.com')) shop = `${shop}.myshopify.com`;

    // Get store token and formats
    const { data: store, error: storeErr } = await supabase
      .from('shopify_stores')
      .select('access_token, currency, money_format, money_with_currency_format')
      .eq('shop', shop)
      .single();

    if (storeErr || !store?.access_token) {
      return new Response(JSON.stringify({ success: false, message: 'Store not found or missing token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Load shop info via GraphQL
    const shopInfoData = await shopifyGQL(shop, store.access_token, `
      query ShopInfo { shop { currencyCode } }
    `);

    const shopInfo = {
      currencyCode: shopInfoData.shop?.currencyCode ?? (store.currency ?? 'USD'),
      moneyFormat: store.money_format ?? null,
      moneyWithCurrencyFormat: store.money_with_currency_format ?? null,
    } as { currencyCode: string; moneyFormat?: string | null; moneyWithCurrencyFormat?: string | null };

    // Paginated fetch of products via GraphQL
    const products: any[] = [];
    let cursor: string | null = null;
    let page = 0;

    const PRODUCTS_QUERY = `
      query Products($cursor: String) {
        products(first: 100, query: "status:active", after: $cursor) {
          edges {
            cursor
            node {
              id
              title
              handle
              createdAt
              updatedAt
              publishedAt
              status
              tags
              featuredImage { url }
              images(first: 10) { edges { node { url } } }
              variants(first: 50) {
                edges { node {
                  id
                  title
                  price { amount currencyCode }
                  compareAtPrice { amount currencyCode }
                  sku
                  inventoryQuantity
                  weight
                  weightUnit
                }}
              }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;

    do {
      const data = await shopifyGQL(shop, store.access_token, PRODUCTS_QUERY, { cursor });
      const edges = data.products?.edges || [];
      for (const edge of edges) {
        const node = edge.node;
        products.push(mapProduct(node, shopInfo));
      }
      const pageInfo = data.products?.pageInfo;
      cursor = pageInfo?.hasNextPage ? pageInfo?.endCursor ?? null : null;
      page++;
      // Safety to avoid excessive pages
      if (page >= 10) break;
    } while (cursor);

    // Optional filter by productIds (numeric or string)
    if (Array.isArray(productIds) && productIds.length > 0) {
      const idSet = new Set(productIds.map((p) => String(p)));
      const filtered = products.filter(p => idSet.has(String(p.id)));
      return new Response(JSON.stringify({
        success: true,
        products: filtered,
        count: filtered.length,
        shop,
        currency: shopInfo.currencyCode,
        money_format: shopInfo.moneyFormat ?? null,
        money_with_currency_format: shopInfo.moneyWithCurrencyFormat ?? null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      products,
      count: products.length,
      shop,
      currency: shopInfo.currencyCode,
      money_format: shopInfo.moneyFormat ?? null,
      money_with_currency_format: shopInfo.moneyWithCurrencyFormat ?? null,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(`[shopify-products] Error:`, error);
    return new Response(JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

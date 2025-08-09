import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function extractId(gid?: string | null) {
  if (!gid) return null;
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

function toGid(type: 'Product' | 'ProductVariant', id: string | number) {
  return `gid://shopify/${type}/${id}`;
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
    };
  });

  return {
    id: extractId(node.id),
    title: node.title,
    handle: node.handle,
    status: node.status,
    tags: (node.tags || []).join(', '),
    image: featuredImage,
    currency: shopInfo.currencyCode,
    variants,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    let shop = url.searchParams.get('shop') || undefined;
    let productIdParam = url.searchParams.get('product') || url.searchParams.get('productId') || undefined;

    // Also support POST body payloads
    if ((!shop || !productIdParam) && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const body = await req.json().catch(() => ({}));
      shop = shop || body?.shop;
      productIdParam = productIdParam || body?.productId || body?.product;
    }
    if (!shop) {
      return new Response(JSON.stringify({ success: false, message: 'Shop required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!shop.includes('.myshopify.com')) shop = `${shop}.myshopify.com`;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: store, error: storeErr } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .single();

    if (storeErr || !store?.access_token) {
      return new Response(JSON.stringify({ success: false, error: `STORE_NOT_FOUND:${shop}`, message: 'Store not found or missing token' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch shop info
    const shopInfoData = await shopifyGQL(shop, store.access_token, `
      query ShopInfo { shop { currencyCode } }
    `);
    const shopInfo = {
      currencyCode: shopInfoData.shop?.currencyCode ?? 'USD',
      moneyFormat: store.money_format ?? null,
      moneyWithCurrencyFormat: store.money_with_currency_format ?? null,
    } as { currencyCode: string; moneyFormat?: string | null; moneyWithCurrencyFormat?: string | null };
    // If specific product requested
    if (productIdParam && productIdParam !== 'auto-detect') {
      const gid = /^gid:/.test(productIdParam) ? productIdParam : toGid('Product', productIdParam);
      const data = await shopifyGQL(shop, store.access_token, `
        query Product($id: ID!) {
          product(id: $id) {
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
              }}
            }
          }
        }
      `, { id: gid });

      const node = data.product;
      if (!node) {
        return new Response(JSON.stringify({ error: 'Product not found', message: `المنتج بمعرف ${productIdParam} غير موجود` }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const product = mapProduct(node, shopInfo);
      return new Response(JSON.stringify({
        success: true,
        shop,
        product,
        currency: shopInfo.currencyCode,
        message: `تم جلب المنتج ${product.title} بنجاح`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Otherwise: list products (first 100)
    const list = await shopifyGQL(shop, store.access_token, `
      query Products($cursor: String) {
        products(first: 100, after: $cursor) {
          edges { cursor node {
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
            variants(first: 10) { edges { node {
              id
              title
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              sku
              inventoryQuantity
            }}}
          }}
          pageInfo { hasNextPage endCursor }
        }
      }
    `, { cursor: null });

    const products = (list.products?.edges || []).map((e: any) => mapProduct(e.node, shopInfo));

    return new Response(JSON.stringify({
      success: true,
      shop,
      products,
      currency: shopInfo.currencyCode,
      total: products.length,
      message: `تم جلب ${products.length} منتج بنجاح`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[shopify-products-fixed] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message, message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
}

// Shopify GraphQL helper
async function shopifyGQL(shop: string, token: string, query: string, variables?: Record<string, unknown>) {
  const res = await fetch(`https://${shop}/admin/api/2025-04/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables })
  })
  const json = await res.json()
  if (!res.ok || json.errors) {
    throw new Error(`GraphQL error: ${res.status} ${res.statusText} ${JSON.stringify(json.errors || {})}`)
  }
  return json.data
}

function toGid(type: 'Product' | 'ProductVariant', id: string | number) {
  return `gid://shopify/${type}/${id}`
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(req.url)
    let shop = url.searchParams.get('shop') || undefined
    const productId = url.searchParams.get('product') || url.searchParams.get('productId') || undefined

    if (!shop) {
      return new Response(JSON.stringify({ success: false, message: 'Shop required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!shop.includes('.myshopify.com')) shop = `${shop}.myshopify.com`

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Load form/product settings directly from table
    const { data: formAssociation, error: associationError } = await supabase
      .from('shopify_product_settings')
      .select('form_id, enabled')
      .eq('shop_id', shop)
      .eq('product_id', productId || 'auto-detect')
      .eq('enabled', true)
      .maybeSingle();

    let settings = null;
    let settingsError = null;

    if (!associationError && formAssociation) {
      // Get the full form data using the form_id
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formAssociation.form_id)
        .eq('is_published', true)
        .single();

      if (!formError && formData) {
        settings = {
          form_id: formAssociation.form_id,
          enabled: formAssociation.enabled,
          forms: formData
        };
      } else {
        settingsError = formError;
      }
    } else {
      // Try auto-detect form if specific product not found
      if (productId !== 'auto-detect') {
        const { data: autoFormAssociation } = await supabase
          .from('shopify_product_settings')
          .select('form_id, enabled')
          .eq('shop_id', shop)
          .eq('product_id', 'auto-detect')
          .eq('enabled', true)
          .maybeSingle();
        
        if (autoFormAssociation) {
          const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', autoFormAssociation.form_id)
            .eq('is_published', true)
            .single();

          if (!formError && formData) {
            settings = {
              form_id: autoFormAssociation.form_id,
              enabled: autoFormAssociation.enabled,
              forms: formData
            };
          }
        }
      }
      
      if (!settings) {
        settingsError = associationError || new Error('No form association found');
      }
    }

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ success: false, message: 'No form found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let { data: offers } = await supabase
      .from('quantity_offers')
      .select('*')
      .eq('shop_id', shop)
      .eq('product_id', productId)
      .eq('enabled', true)
      .maybeSingle()

    if (!offers && productId !== 'auto-detect') {
      const { data: autoOffers } = await supabase
        .from('quantity_offers')
        .select('*')
        .eq('shop_id', shop)
        .eq('product_id', 'auto-detect')
        .eq('enabled', true)
        .maybeSingle()
      offers = autoOffers
    }

    const formCurrency = settings.forms?.currency
    const formCountry = settings.forms?.country
    const formPhonePrefix = settings.forms?.phone_prefix

    if (!formCurrency) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'NO_CURRENCY_CONFIGURED',
        message: 'Form currency not configured' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch store token
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .single()

    let productData: any = null

    if (store?.access_token && productId && productId !== 'auto-detect') {
      // Fetch shop info (currency) and product via GraphQL
      const gid = /^gid:/.test(productId) ? productId : toGid('Product', productId)

      const data = await shopifyGQL(shop!, store.access_token, `
        query ProductWithShop($id: ID!) {
          shop { currencyCode }
          product(id: $id) {
            id
            title
            featuredImage { url }
            priceRangeV2 {
              minVariantPrice { amount currencyCode }
              maxVariantPrice { amount currencyCode }
            }
            variants(first: 50) { edges { node {
              id
              price
            }}}
          }
        }
      `, { id: gid })

      const node = data.product
      const firstVariant = node?.variants?.edges?.[0]?.node

      if (node) {
        const minRange = node?.priceRangeV2?.minVariantPrice;
        const minPriceAmount = typeof minRange?.amount === 'string'
          ? minRange.amount
          : (minRange?.amount != null ? String(minRange.amount) : null);
        const fallbackPriceStr = typeof firstVariant?.price === 'object'
          ? (firstVariant.price?.amount ?? '0')
          : String(firstVariant?.price ?? '0');
        const resolvedPrice = (minPriceAmount && parseFloat(minPriceAmount) > 0)
          ? String(minPriceAmount)
          : fallbackPriceStr;

        productData = {
          id: productId,
          price: resolvedPrice,
          currency: data.shop?.currencyCode || 'USD',
          title: node.title,
          image: node.featuredImage?.url || null,
        }
      }
    }

    if (!productData) {
      productData = {
        id: productId,
        price: 1.00,
        currency: 'USD',
        title: 'Test Product',
        image: null,
      }
    }

    return new Response(JSON.stringify({
      success: true,
      form: settings.forms?.title || 'New Form',
      data: settings.forms?.data || [],
      style: settings.forms?.style || {},
      currency: formCurrency,
      country: formCountry,
      phone_prefix: formPhonePrefix,
      quantity_offers: offers,
      product: productData,
      shop,
      productId
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('[forms-product] Error:', error)
    return new Response(JSON.stringify({ success: false, message: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

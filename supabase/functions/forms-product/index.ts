
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    let product = url.searchParams.get('product');
    const blockId = url.searchParams.get('blockId');
    
    console.log(`[${requestId}] 🎯 CLEAN API - Request: shop=${shop}, product=${product}, block=${blockId}`);

    if (!shop) {
      throw new Error('Missing shop parameter');
    }
    
    // Extract product from referer if missing
    if (!product) {
      const referer = req.headers.get('referer');
      if (referer && referer.includes('/products/')) {
        const matches = referer.match(/\/products\/([^?\/]+)/);
        if (matches && matches[1]) {
          product = matches[1];
          console.log(`[${requestId}] ✅ Extracted product: ${product}`);
        }
      }
    }

    if (!product) {
      console.log(`[${requestId}] ❌ No product found`);
      return new Response(JSON.stringify({
        success: false,
        error: 'No product found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get product-specific form
    const { data: settingsData, error: settingsError } = await supabase
      .from('shopify_product_settings')
      .select('form_id, forms(*)')
      .eq('shop_id', shop)
      .eq('product_id', product)
      .eq('enabled', true)
      .limit(1);

    if (settingsError || !settingsData || settingsData.length === 0) {
      console.log(`[${requestId}] ❌ No form found for product ${product}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'No form configured for this product'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const formData = settingsData[0].forms;
    const formId = settingsData[0].form_id;
    
    console.log(`[${requestId}] ✅ Found form: ${formId}`);

    // Get quantity offers
    const { data: offersData, error: offersError } = await supabase
      .from('quantity_offers')
      .select('*')
      .eq('shop_id', shop)
      .eq('product_id', product)
      .eq('form_id', formId)
      .eq('enabled', true)
      .limit(1);

    const quantityOffers = offersData && offersData.length > 0 ? offersData[0] : null;
    
    if (quantityOffers) {
      console.log(`[${requestId}] ✅ Found ${quantityOffers.offers?.length || 0} quantity offers`);
    }

    // Get REAL product data from Shopify
    const realProductData = await getRealProductData(shop, product, requestId);

    // Extract form fields
    const fields = extractFormFields(formData);

    const response = {
      success: true,
      form: {
        id: formData.id,
        title: formData.title,
        data: [{
          id: "1",
          title: "Main Step",
          fields: fields
        }],
        style: formData.style || {},
        shop_id: formData.shop_id,
        country: formData.country || 'SA',
        currency: formData.currency || 'SAR',
        phone_prefix: formData.phone_prefix || '+966'
      },
      quantity_offers: quantityOffers,
      product: realProductData || {
        id: product,
        title: 'Product',
        price: null,
        currency: formData.currency || 'SAR',
        image: null
      }
    };

    console.log(`[${requestId}] 🎉 SUCCESS - Form: ${fields.length} fields, Offers: ${!!quantityOffers}, Product: ${!!realProductData}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getRealProductData(shopDomain: string, productHandle: string, requestId: string) {
  try {
    console.log(`[${requestId}] 🛍️ Fetching real product data for ${productHandle}`);
    
    const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
      },
      body: JSON.stringify({
        shop: shopDomain,
        productHandle: productHandle
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.products && data.products.length > 0) {
        const product = data.products[0];
        
        const productData = {
          id: product.id,
          title: product.title,
          price: product.price || product.priceRangeV2?.minVariantPrice?.amount || null,
          currency: product.priceRangeV2?.minVariantPrice?.currencyCode || 'USD',
          image: product.images?.[0] || product.featuredImage?.url || null
        };
        
        console.log(`[${requestId}] ✅ Got real product: ${productData.title} - ${productData.price} ${productData.currency}`);
        return productData;
      }
    }
    
    console.log(`[${requestId}] ⚠️ Failed to get real product data`);
    return null;
  } catch (error) {
    console.error(`[${requestId}] ❌ Error fetching product:`, error);
    return null;
  }
}

function extractFormFields(formData: any) {
  try {
    let fields: any[] = [];
    
    if (Array.isArray(formData.data)) {
      if (formData.data.length > 0 && formData.data[0].fields) {
        fields = formData.data[0].fields;
      } else if (formData.data.length > 0) {
        fields = formData.data;
      }
    } else if (formData.data && formData.data.fields) {
      fields = formData.data.fields;
    }

    return fields;
  } catch (error) {
    console.error('Error extracting fields:', error);
    return [];
  }
}

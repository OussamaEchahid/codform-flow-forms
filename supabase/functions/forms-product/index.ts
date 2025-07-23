
// Edge function for fetching product-specific forms and quantity offers
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    let product = url.searchParams.get('product');
    const blockId = url.searchParams.get('blockId');
    
    // تقليل console logs - فقط المعلومات الأساسية
    console.log(`[${requestId}] 🎯 API Request: ${shop}/${product}`);

    if (!shop) {
      throw new Error('Missing required parameter: shop');
    }
    
    // Extract product handle from referer URL if product is null
    if (!product) {
      const referer = req.headers.get('referer');
      if (referer && referer.includes('/products/')) {
        const matches = referer.match(/\/products\/([^?\/]+)/);
        if (matches && matches[1]) {
          product = matches[1];
        }
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Function to get real product data from Shopify API
    async function getRealProductData(shopDomain: string, productHandle: string) {
      try {
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
            
            return {
              id: product.id,
              title: product.title,
              price: product.price || product.priceRangeV2?.minVariantPrice?.amount || null,
              currency: product.priceRangeV2?.minVariantPrice?.currencyCode || 'USD',
              image: product.images?.[0] || product.featuredImage?.url || null
            };
          }
        }
        
        return null;
      } catch (error) {
        console.error(`[${requestId}] Product fetch error:`, error);
        return null;
      }
    }

    // Function to get product-specific form settings
    async function getProductFormSettings() {
      try {
        const { data, error } = await supabase
          .from('shopify_product_settings')
          .select(`
            form_id,
            enabled,
            forms(*)
          `)
          .eq('shop_id', shop)
          .eq('product_id', product)
          .eq('enabled', true)
          .limit(1);

        if (error) {
          return { found: false, error: error.message };
        }

        if (data && data.length > 0 && data[0].forms) {
          const setting = data[0];
          return { found: true, formId: setting.form_id, formData: setting.forms };
        }

        return { found: false };
      } catch (error) {
        return { found: false, error: (error as Error).message };
      }
    }

    // Function to fetch quantity offers
    async function getQuantityOffers(formId: string) {
      if (!product) {
        return null;
      }
      
      try {
        const { data, error } = await supabase
          .from('quantity_offers')
          .select('*')
          .eq('shop_id', shop)
          .eq('product_id', product)
          .eq('form_id', formId)
          .eq('enabled', true)
          .limit(1);

        if (error) {
          return null;
        }

        if (data && data.length > 0) {
          return data[0];
        }

        return null;
      } catch (error) {
        console.error(`[${requestId}] Quantity offers error:`, error);
        return null;
      }
    }

    // Function to extract form fields
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
        console.error(`[${requestId}] Fields extraction error:`, error);
        return [];
      }
    }

    // Try to get product-specific form
    let productResult = { found: false };
    if (product) {
      productResult = await getProductFormSettings();
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'No product found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let formData = null;
    let formId = null;

    if (productResult.found && productResult.formData) {
      formData = productResult.formData;
      formId = productResult.formId;
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'No form configured for this product'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract form fields
    const fields = extractFormFields(formData);

    // Fetch quantity offers
    const quantityOffers = await getQuantityOffers(formId);

    // Get REAL product data from Shopify API
    const realProductData = await getRealProductData(shop, product);

    // Build response with REAL product data
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

    // تقليل console logs - فقط النتيجة النهائية
    console.log(`[${requestId}] ✅ Success: ${fields.length} fields, ${!!quantityOffers ? 'with' : 'no'} offers`);

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

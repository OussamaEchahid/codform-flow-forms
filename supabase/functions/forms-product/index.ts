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
    console.log(`[${requestId}] 🎯 PRECISE FIX - Product form request`);
    
    const url = new URL(req.url);
    const params = url.searchParams;
    
    // Parse query parameters - استخدام النطاق الجديد كافتراضي
    let shop = params.get('shop') || params.get('shopDomain') || 'codmagnet.com';
    
    // Force codmagnet.com for any bestform-app requests
    if (shop.includes('bestform-app.myshopify.com')) {
      shop = 'codmagnet.com';
      console.log(`[${requestId}] 🔄 Redirected bestform-app to codmagnet.com`);
    }
    
    let product = params.get('product') || params.get('productId') || 'default';
    const blockId = params.get('blockId');
    
    console.log(`[${requestId}] 🏪 Processing shop: ${shop}, product: ${product}, blockId: ${blockId}`);

    
    // Extract product handle from referer URL if product is default or null
    if (!product || product === 'default') {
      const referer = req.headers.get('referer');
      if (referer && referer.includes('/products/')) {
        const matches = referer.match(/\/products\/([^?\/]+)/);
        if (matches && matches[1]) {
          product = matches[1];
          console.log(`[${requestId}] ✅ Extracted product handle: ${product}`);
        }
      }
    }

    if (!product || product === 'default') {
      console.log(`[${requestId}] ⚠️ No product available, will return default form`);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Function to get real product data from Shopify API
    async function getRealProductData(shopDomain: string, productIdentifier: string) {
      console.log(`[${requestId}] 🛍️ Fetching REAL product data for ${productIdentifier}`);
      
      try {
        // Get store info with access token
        const { data: storeData, error: storeError } = await supabase
          .from('shopify_stores')
          .select('access_token, shop')
          .eq('shop', shopDomain)
          .eq('is_active', true)
          .single();

        if (storeError || !storeData?.access_token) {
          console.log(`[${requestId}] ❌ No access token found for shop: ${shopDomain}`);
          return null;
        }

        const actualShopDomain = storeData.shop.includes('.myshopify.com') 
          ? storeData.shop 
          : `${storeData.shop}.myshopify.com`;

        console.log(`[${requestId}] 🏪 Using shop domain: ${actualShopDomain}`);

        // Try different methods to get product data
        const methods = [
          // Method 1: By product ID (if numeric)
          async () => {
            if (!isNaN(Number(productIdentifier))) {
              const url = `https://${actualShopDomain}/admin/api/2023-07/products/${productIdentifier}.json`;
              const response = await fetch(url, {
                headers: {
                  'X-Shopify-Access-Token': storeData.access_token,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                return data.product;
              }
            }
            return null;
          },
          
          // Method 2: By handle using GraphQL
          async () => {
            const graphqlQuery = `
              query getProductByHandle($handle: String!) {
                productByHandle(handle: $handle) {
                  id
                  title
                  handle
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  featuredImage {
                    originalSrc
                    altText
                  }
                }
              }
            `;
            
            const response = await fetch(`https://${actualShopDomain}/admin/api/2023-07/graphql.json`, {
              method: 'POST',
              headers: {
                'X-Shopify-Access-Token': storeData.access_token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: graphqlQuery,
                variables: { handle: productIdentifier }
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              const product = data.data?.productByHandle;
              if (product) {
                return {
                  id: product.id.split('/').pop(),
                  title: product.title,
                  handle: product.handle,
                  price: product.priceRange?.minVariantPrice?.amount,
                  currency: product.priceRange?.minVariantPrice?.currencyCode,
                  image: product.featuredImage?.originalSrc
                };
              }
            }
            return null;
          },
          
          // Method 3: Try public API (no auth needed)
          async () => {
            const url = `https://${actualShopDomain}/products/${productIdentifier}.json`;
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              return data.product;
            }
            return null;
          }
        ];

        // Try each method until one succeeds
        for (const method of methods) {
          try {
            const result = await method();
            if (result) {
              console.log(`[${requestId}] ✅ Got product data: ${result.title || result.id}`);
              return result;
            }
          } catch (error) {
            console.log(`[${requestId}] ⚠️ Method failed:`, error);
          }
        }

        console.log(`[${requestId}] ❌ Failed to get real product data from all methods`);
        return null;
        
      } catch (error) {
        console.error(`[${requestId}] ❌ Error in getRealProductData:`, error);
        return null;
      }
    }

    // Function to check for product-specific form settings
    async function getProductFormSettings() {
      try {
        console.log(`[${requestId}] 🔎 Checking product-specific settings...`);
        
        let { data, error } = await supabase
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

        // If no results and product looks like a handle, try to get product ID from Shopify
        if ((!data || data.length === 0) && isNaN(Number(product))) {
          console.log(`[${requestId}] 🔄 Product looks like handle, trying to get ID from Shopify`);
          
          const realProductData = await getRealProductData(shop, product);
          if (realProductData && realProductData.id) {
            // Extract numeric ID from Shopify ID (e.g., "gid://shopify/Product/7597766148198" -> "7597766148198")
            const productId = realProductData.id.toString().split('/').pop();
            console.log(`[${requestId}] 🎯 Got product ID: ${productId} for handle: ${product}`);
            
            // Try again with the numeric ID
            const result = await supabase
              .from('shopify_product_settings')
              .select(`
                form_id,
                enabled,
                forms(*)
              `)
              .eq('shop_id', shop)
              .eq('product_id', productId)
              .eq('enabled', true)
              .limit(1);
            
            data = result.data;
            error = result.error;
          }
        }

        if (error) {
          console.log(`[${requestId}] Product settings error:`, error.message);
          return { found: false, error: error.message };
        }

        if (data && data.length > 0 && data[0].forms) {
          const setting = data[0];
          return { found: true, formId: setting.form_id, formData: setting.forms };
        }

        return { found: false };
      } catch (error) {
        console.log(`[${requestId}] Product settings exception:`, error);
        return { found: false, error: (error as Error).message };
      }
    }

    // Function to fetch quantity offers
    async function getQuantityOffers(formId: string, productIdentifier: string) {
      if (!productIdentifier) {
        console.log(`[${requestId}] ⚠️ No product available, skipping quantity offers`);
        return null;
      }
      
      console.log(`[${requestId}] 🎁 Fetching quantity offers for product ${productIdentifier}`);
      
      try {
        // First try with the original product identifier
        let { data, error } = await supabase
          .from('quantity_offers')
          .select('*')
          .eq('shop_id', shop)
          .eq('product_id', productIdentifier)
          .eq('form_id', formId)
          .eq('enabled', true)
          .limit(1);

        // If no results and product looks like a handle, try to get the actual product ID
        if ((!data || data.length === 0) && isNaN(Number(productIdentifier))) {
          console.log(`[${requestId}] 🔄 Trying to convert handle to product ID for quantity offers`);
          
          const realProductData = await getRealProductData(shop, productIdentifier);
          if (realProductData && realProductData.id) {
            const productId = realProductData.id.toString().split('/').pop();
            console.log(`[${requestId}] 🎯 Using product ID ${productId} for quantity offers search`);
            
            const result = await supabase
              .from('quantity_offers')
              .select('*')
              .eq('shop_id', shop)
              .eq('product_id', productId)
              .eq('form_id', formId)
              .eq('enabled', true)
              .limit(1);
            
            data = result.data;
            error = result.error;
          }
        }

        if (error) {
          console.log(`[${requestId}] ❌ Quantity offers error:`, error.message);
          return null;
        }

        if (data && data.length > 0) {
          console.log(`[${requestId}] ✅ Found ${data.length} quantity offers`);
          return data[0];
        }

        console.log(`[${requestId}] ❌ No quantity offers found`);
        return null;
      } catch (error) {
        console.log(`[${requestId}] ❌ Exception in getQuantityOffers:`, error);
        return null;
      }
    }

    // Function to extract fields from form data
    function extractFields(formData: any) {
      try {
        if (!formData || !formData.data) {
          return [];
        }

        const formSteps = Array.isArray(formData.data) ? formData.data : [formData.data];
        const fields: any[] = [];

        for (const step of formSteps) {
          if (step && step.fields && Array.isArray(step.fields)) {
            fields.push(...step.fields);
          }
        }

        console.log(`[${requestId}] ✅ Extracted ${fields.length} fields`);
        return fields;
      } catch (error) {
        console.error(`[${requestId}] Error extracting fields:`, error);
        return [];
      }
    }

    // Try to get product-specific form
    let productResult = { found: false };
    if (product && product !== 'default') {
      productResult = await getProductFormSettings();
    } else {
      console.log(`[${requestId}] ⚠️ No specific product, will try to find any form for this shop`);
      
      // Try to get any form for this shop
      try {
        const { data: anyForm, error } = await supabase
          .from('forms')
          .select('*')
          .eq('shop_id', shop)
          .eq('is_published', true)
          .limit(1);
          
        if (anyForm && anyForm.length > 0) {
          console.log(`[${requestId}] 📝 Found default form for shop`);
          productResult = { found: true, formData: anyForm[0], formId: anyForm[0].id };
        }
      } catch (error) {
        console.log(`[${requestId}] ❌ Error finding default form:`, error);
      }
    }

    let formData = null;
    let formId = null;

    if (productResult.found && productResult.formData) {
      console.log(`[${requestId}] 🎯 Found product-specific form`);
      formData = productResult.formData;
      formId = productResult.formId;
    } else {
      console.log(`[${requestId}] ❌ No form configured for this product`);
      return new Response(JSON.stringify({
        success: false,
        error: 'No form configured for this product'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get quantity offers
    const quantityOffers = await getQuantityOffers(formId, product);
    
    // Extract fields
    const fields = extractFields(formData);

    // تحديد المنتج الصحيح للحصول على البيانات
    let productForData = product;
    if (quantityOffers && quantityOffers.product_id) {
      productForData = quantityOffers.product_id;
      console.log(`[${requestId}] 🎯 Using product from quantity offer: ${productForData} instead of URL product: ${product}`);
    }
    
    // Get REAL product data from Shopify API
    const realProductData = await getRealProductData(shop, productForData);
    
    if (!realProductData) {
      console.log(`[${requestId}] ⚠️ Could not fetch product data for ${productForData}`);
    }

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
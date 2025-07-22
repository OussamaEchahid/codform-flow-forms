
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
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] 🎯 COMPREHENSIVE FIX - Product form request received`);
    
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    let product = url.searchParams.get('product');
    const blockId = url.searchParams.get('blockId');
    const debug = url.searchParams.get('debug') === 'true';
    
    console.log(`[${requestId}] Parameters: shop=${shop}, product=${product}, blockId=${blockId}, debug=${debug}`);

    if (!shop) {
      throw new Error('Missing required parameter: shop');
    }
    
    // Extract product handle from referer URL if product is null
    if (!product) {
      const referer = req.headers.get('referer');
      console.log(`[${requestId}] 🔍 Product is null, checking referer: ${referer}`);
      
      if (referer && referer.includes('/products/')) {
        const matches = referer.match(/\/products\/([^?\/]+)/);
        if (matches && matches[1]) {
          product = matches[1];
          console.log(`[${requestId}] ✅ Extracted product handle from referer: ${product}`);
        }
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${requestId}] 🔍 Fetching form for shop ${shop}, product ${product}`);

    // Function to get product-specific form settings
    async function getProductFormSettings() {
      console.log(`[${requestId}] 🔎 Checking product-specific settings...`);
      
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
          .single();

        if (error) {
          console.log(`[${requestId}] Product settings error:`, error.message);
          return { found: false, error: error.message };
        }

        if (data && data.forms) {
          return { found: true, formId: data.form_id, formData: data.forms };
        }

        return { found: false };
      } catch (error) {
        console.log(`[${requestId}] Product settings exception:`, error);
        return { found: false, error: (error as Error).message };
      }
    }

    // Function to get default form for shop
    async function getDefaultForm() {
      console.log(`[${requestId}] 🔄 Trying default form for shop ${shop}`);
      
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('shop_id', shop)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.log(`[${requestId}] Default form error:`, error.message);
          return { found: false, error: error.message };
        }

        return { found: true, formData: data };
      } catch (error) {
        console.log(`[${requestId}] Default form exception:`, error);
        return { found: false, error: (error as Error).message };
      }
    }

    // Function to fetch quantity offers
    async function getQuantityOffers(formId: string) {
      if (!product) {
        console.log(`[${requestId}] ⚠️ No product available, skipping quantity offers`);
        return null;
      }
      
      console.log(`[${requestId}] 🎁 Fetching quantity offers for product ${product} and form ${formId}`);
      
      try {
        const { data, error } = await supabase
          .from('quantity_offers')
          .select('*')
          .eq('shop_id', shop)
          .eq('product_id', product)
          .eq('form_id', formId)
          .eq('enabled', true)
          .single();

        if (error) {
          console.log(`[${requestId}] ℹ️ No quantity offers configured for this product`);
          return null;
        }

        if (data) {
          console.log(`[${requestId}] ✅ Found quantity offers:`, JSON.stringify(data, null, 2));
          return data;
        }

        return null;
      } catch (error) {
        console.error(`[${requestId}] Error fetching quantity offers:`, error);
        return null;
      }
    }

    // Function to extract form fields
    function extractFormFields(formData: any) {
      console.log(`[${requestId}] 🔧 Processing form data structure`);
      
      try {
        let fields: any[] = [];
        
        if (Array.isArray(formData.data)) {
          if (formData.data.length > 0 && formData.data[0].fields) {
            console.log(`[${requestId}] 📊 Form data is in steps format with ${formData.data.length} steps`);
            fields = formData.data[0].fields;
          } else if (formData.data.length > 0) {
            console.log(`[${requestId}] 📊 Form data is direct fields array`);
            fields = formData.data;
          }
        } else if (formData.data && formData.data.fields) {
          console.log(`[${requestId}] 📊 Form data has fields property`);
          fields = formData.data.fields;
        }

        console.log(`[${requestId}] ✅ Successfully extracted ${fields.length} fields`);
        return fields;
      } catch (error) {
        console.error(`[${requestId}] Error extracting fields:`, error);
        return [];
      }
    }

    // Try to get product-specific form first (only if product is available)
    let productResult = { found: false };
    if (product) {
      productResult = await getProductFormSettings();
      console.log(`[${requestId}] 📋 Product settings result:`, JSON.stringify({
        found: productResult.found,
        formId: productResult.formId,
        error: productResult.error
      }, null, 2));
    } else {
      console.log(`[${requestId}] ⚠️ No product handle available, skipping product-specific form check`);
    }

    let formData = null;
    let formId = null;

    if (productResult.found && productResult.formData) {
      console.log(`[${requestId}] 🎯 Found product-specific form ID: ${productResult.formId}`);
      console.log(`[${requestId}] 🔄 Fetching product-specific form data...`);
      formData = productResult.formData;
      formId = productResult.formId;
    } else {
      console.log(`[${requestId}] ℹ️ No product-specific settings found, using default form`);
      const defaultResult = await getDefaultForm();
      console.log(`[${requestId}] 📄 Default forms result:`, { found: defaultResult.found, error: defaultResult.error });
      
      if (defaultResult.found && defaultResult.formData) {
        console.log(`[${requestId}] ✅ Using default form: ${defaultResult.formData.id}`);
        formData = defaultResult.formData;
        formId = defaultResult.formData.id;
      }
    }

    if (!formData) {
      throw new Error('No forms found for this shop');
    }

    console.log(`[${requestId}] ✅ Successfully fetched ${productResult.found ? 'product-specific' : 'default'} form`);

    // Extract form fields
    const fields = extractFormFields(formData);
    const fieldsWithIcons = fields.filter((field: any) => field.icon).length;

    // Fetch quantity offers for this form and product
    const quantityOffers = await getQuantityOffers(formId);

    // Build response in expected format
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
      debug_info: debug ? {
        shop,
        product,
        blockId,
        formId,
        fieldsCount: fields.length,
        hasQuantityOffers: !!quantityOffers
      } : undefined
    };

    console.log(`[${requestId}] 📊 Form stats: ${fields.length} fields, ${fieldsWithIcons} with icons`);
    console.log(`[${requestId}] 📦 Response includes quantity offers: ${!!quantityOffers}`);
    console.log(`[${requestId}] 🎉 SUCCESS - Sending form data to client`);

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);
    
    const errorResponse = {
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});

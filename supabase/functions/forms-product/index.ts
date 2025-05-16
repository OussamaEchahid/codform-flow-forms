
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log request details for debugging
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const productId = url.searchParams.get('productId');
    const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
    const debugMode = url.searchParams.get('debug') === 'true';
    
    console.log(`[${requestId}] Product form request received - shop: ${shop}, product: ${productId}, debug: ${debugMode}`);

    if (!shop || !productId) {
      console.error(`[${requestId}] Missing required parameters: shop=${shop}, productId=${productId}`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: shop or productId' }),
        { 
          headers: {...corsHeaders, 'Content-Type': 'application/json'},
          status: 400 
        }
      );
    }

    // Create Supabase client - with PUBLIC ANON KEY
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`[${requestId}] Missing Supabase configuration`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          headers: corsHeaders, 
          status: 500 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${requestId}] Fetching form for shop ${shop}, product ${productId}`);

    // First, check if there's a specific form for this product
    const { data: productSettings, error: settingsError } = await supabase
      .from('shopify_product_settings')
      .select('form_id, block_id, enabled')
      .eq('shop_id', shop)
      .eq('product_id', productId)
      .eq('enabled', true)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') {
      // Real error, not just "no rows returned"
      console.error(`[${requestId}] Error fetching product settings:`, settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve product settings', details: settingsError }),
        { 
          headers: corsHeaders, 
          status: 500 
        }
      );
    }

    // If we have product-specific settings, get that form
    let form = null;
    let formSource = 'none';
    
    if (productSettings && productSettings.form_id) {
      console.log(`[${requestId}] Found product-specific form ID: ${productSettings.form_id}`);
      formSource = 'product-specific';
      
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', productSettings.form_id)
        .eq('is_published', true)
        .limit(1);
        
      if (!formError && formData && formData.length > 0) {
        form = formData[0];
        console.log(`[${requestId}] Successfully fetched product-specific form with ID: ${form.id}`);
      } else if (formError) {
        console.log(`[${requestId}] Error fetching product-specific form: ${formError.message}. Will try default form.`);
      } else {
        console.log(`[${requestId}] No product-specific form found with ID: ${productSettings.form_id}. Will try default form.`);
      }
    } else {
      console.log(`[${requestId}] No product-specific settings found for product ${productId}`);
    }

    // If no product-specific form was found, get the default form
    if (!form) {
      console.log(`[${requestId}] Trying default form for shop ${shop}`);
      formSource = 'default';
      
      // Get the default form for this shop
      const { data: defaultForms, error: defaultError } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', shop)
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (!defaultError && defaultForms && defaultForms.length > 0) {
        form = defaultForms[0];
        console.log(`[${requestId}] Using default form: ${form.id}`);
      } else if (defaultError) {
        console.error(`[${requestId}] Error fetching default form:`, defaultError);
      } else {
        console.log(`[${requestId}] No default form found for shop ${shop}`);
      }
    }

    // Ensure the settings object exists and process field data
    if (form) {
      // Make sure form has a settings object
      if (!form.settings) {
        form.settings = {};
      }
      
      // Make sure enableIcons is set (default to true if not specified)
      form.settings.enableIcons = form.settings.enableIcons !== false;
      
      // Add fields array if it doesn't exist
      if (!form.fields) {
        form.fields = [];
      }
      
      // Process form fields to ensure icons are correctly formatted
      form.fields = form.fields.map(field => {
        if (!field) return field;
        
        // Make a copy of the field to avoid modifying the original
        const processedField = { ...field };
        
        // Make sure icon is properly defined and not empty string
        if (processedField.icon === undefined || processedField.icon === '') {
          processedField.icon = 'none';
        }
        
        // Ensure style object exists
        if (!processedField.style) {
          processedField.style = {};
        }
        
        // Make sure showIcon is properly defined if an icon exists
        if (processedField.icon && processedField.icon !== 'none') {
          processedField.style.showIcon = processedField.style.showIcon !== undefined ? 
            processedField.style.showIcon : true;
        }
        
        return processedField;
      });

      // Log all form fields with icon information for debugging
      if (debugMode || (form.fields && form.fields.some(f => f && f.icon && f.icon !== 'none'))) {
        console.log(`[${requestId}] Form fields with icon information:`);
        form.fields.forEach(field => {
          if (field && field.icon && field.icon !== 'none') {
            console.log(`[${requestId}] Field ${field.id} (${field.type}) has icon: ${field.icon}, showIcon: ${field.style?.showIcon !== false}`);
          }
        });
      }
    }

    // Add debug information if requested
    const debugInfo = debugMode ? {
      requestId,
      timestamp: new Date().toISOString(),
      formSource,
      shopId: shop,
      productId,
      hasForm: !!form,
      formId: form?.id || null,
      fieldsCount: form?.fields?.length || 0,
      fieldsWithIcons: form?.fields?.filter(f => f && f.icon && f.icon !== 'none').length || 0,
      iconsEnabled: form?.settings?.enableIcons !== false,
    } : undefined;

    // Return form data
    if (form) {
      const fieldsWithIcons = form.fields?.filter(field => field && field.icon && field.icon !== 'none') || [];
      console.log(`[${requestId}] Successfully sending form data to client. Form has ${form.fields?.length || 0} fields, ${fieldsWithIcons.length} with icons`);
      
      if (fieldsWithIcons.length > 0) {
        console.log(`[${requestId}] Icon types used: ${fieldsWithIcons.map(f => f.icon).join(', ')}`);
      }
      
      return new Response(
        JSON.stringify({ 
          form,
          debug: debugInfo 
        }),
        { 
          headers: {
            ...corsHeaders,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Type': 'application/json'
          },
          status: 200 
        }
      );
    } else {
      // No form found at all
      console.log(`[${requestId}] No form found for shop ${shop}`);
      return new Response(
        JSON.stringify({ 
          message: 'No form found for this shop',
          debug: debugInfo
        }),
        { 
          headers: {...corsHeaders, 'Content-Type': 'application/json'}, 
          status: 404 
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: {...corsHeaders, 'Content-Type': 'application/json'}, 
        status: 500 
      }
    );
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface SyncFormRequest {
  shop: string;
  formId: string;
  settings?: {
    position?: string;
    blockId?: string;
    products?: string[];
    themeType?: 'os2' | 'traditional' | 'auto-detect';
    insertionMethod?: 'auto' | 'manual';
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { shop, formId, settings } = await req.json() as SyncFormRequest;

    if (!shop || !formId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Syncing form ${formId} with shop ${shop}`);

    // Get the access token for the store
    const { data: storeData, error: storeError } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('shop', shop)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (storeError || !storeData || storeData.length === 0) {
      console.error('Store not found or error fetching store data:', storeError);
      return new Response(
        JSON.stringify({ success: false, message: 'Store not found or not connected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const accessToken = storeData[0].access_token;
    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid access token for store' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get the form data to fetch floating button settings
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formError || !formData) {
      console.error('Form not found or error fetching form data:', formError);
      return new Response(
        JSON.stringify({ success: false, message: 'Form not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Extract floating button settings and product ID
    const floatingButtonSettings = formData.floating_button || {};
    const productId = formData.product_id || (settings?.products && settings.products[0]);
    
    console.log('Form floating button settings:', floatingButtonSettings);
    console.log('Associated product ID:', productId);

    if (!productId) {
      console.warn('No product ID associated with form. Proceeding with general theme update.');
    }

    // If we have a product ID and settings.products is not set, add it
    if (productId && (!settings?.products || settings.products.length === 0)) {
      if (!settings) {
        settings = {};
      }
      settings.products = [productId];
    }

    // Call the shopify-theme-update function to update the theme
    const updateResponse = await supabase.functions.invoke('shopify-theme-update', {
      body: {
        shop,
        accessToken,
        formId,
        insertionMethod: settings?.insertionMethod || 'auto',
        blockId: settings?.blockId,
        floatingButtonSettings, // Pass floating button settings to theme update function
        productId // Pass product ID explicitly
      }
    });

    if (updateResponse.error) {
      console.error('Error calling theme update function:', updateResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error updating theme',
          error: updateResponse.error
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Store the form-shop association
    const { error: insertError } = await supabase
      .from('form_shop_mappings')
      .upsert({
        form_id: formId,
        shop_id: shop,
        settings: settings || {},
        product_id: productId, // Add product ID to mapping
        updated_at: new Date().toISOString()
      }, { onConflict: 'form_id,shop_id' });

    if (insertError) {
      console.error('Error storing form-shop mapping:', insertError);
    }

    // Ensure the form has the product_id saved
    if (productId) {
      const { error: formUpdateError } = await supabase
        .from('forms')
        .update({ product_id: productId })
        .eq('id', formId);

      if (formUpdateError) {
        console.error('Error updating form with product ID:', formUpdateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Form successfully synced with Shopify store',
        theme_update_result: updateResponse.data,
        floating_button: floatingButtonSettings.enabled,
        product_id: productId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in shopify-sync-form function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error syncing form',
        error_details: error instanceof Error ? error.stack : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

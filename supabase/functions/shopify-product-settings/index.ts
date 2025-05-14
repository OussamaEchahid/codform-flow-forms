
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { shop, settings } = await req.json();
    
    if (!shop) {
      throw new Error('Missing shop parameter');
    }
    
    if (!settings || !settings.productId || !settings.formId) {
      throw new Error('Missing required settings (productId or formId)');
    }
    
    console.log(`Processing product settings for shop: ${shop}, product: ${settings.productId}, form: ${settings.formId}`);
    
    // Update the product_id in the form record
    const { error: formError } = await supabase
      .from('forms')
      .update({ product_id: settings.productId })
      .eq('id', settings.formId);
      
    if (formError) {
      console.error('Error updating form product association:', formError);
      // Continue anyway since the shopify_product_settings table is the primary association
    }
    
    // Check if an entry already exists
    const { data: existingData, error: existingError } = await supabase
      .from('shopify_product_settings')
      .select('*')
      .eq('shop_id', shop)
      .eq('product_id', settings.productId);
      
    if (existingError) {
      console.error('Error checking existing settings:', existingError);
      throw new Error(`Database error: ${existingError.message}`);
    }
    
    let result;
    
    if (existingData && existingData.length > 0) {
      // Update existing entry
      result = await supabase
        .from('shopify_product_settings')
        .update({
          form_id: settings.formId,
          enabled: settings.enabled !== undefined ? settings.enabled : true,
          block_id: settings.blockId || existingData[0].block_id || `codform-${Date.now()}`,
          updated_at: new Date().toISOString()
        })
        .eq('shop_id', shop)
        .eq('product_id', settings.productId);
    } else {
      // Insert new entry
      result = await supabase
        .from('shopify_product_settings')
        .insert({
          shop_id: shop,
          product_id: settings.productId,
          form_id: settings.formId,
          enabled: settings.enabled !== undefined ? settings.enabled : true,
          block_id: settings.blockId || `codform-${Date.now()}`
        });
    }
    
    if (result.error) {
      console.error('Error saving product settings:', result.error);
      throw new Error(`Database error: ${result.error.message}`);
    }
    
    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product settings saved successfully',
        productId: settings.productId,
        formId: settings.formId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred saving product settings',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});

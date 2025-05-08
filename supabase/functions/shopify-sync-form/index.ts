
// This function syncs a form with Shopify by adding it to the store's settings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface SyncFormRequest {
  formId: string;
  shop: string;
  settings?: {
    position?: 'product-page' | 'cart-page' | 'checkout';
    blockId?: string;
    products?: string[];
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { formId, shop, settings } = await req.json() as SyncFormRequest;

    if (!formId || !shop) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required parameters: formId and shop are required'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Syncing form ${formId} with shop ${shop}`);

    // Get the form data first to verify it exists
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    
    if (formError || !formData) {
      console.error("Error fetching form data:", formError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Form not found in database'
      }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update form with shop_id and is_published=true to ensure it's visible
    const { error: formUpdateError } = await supabase
      .from('forms')
      .update({ 
        shop_id: shop,
        is_published: true // Make sure the form is published when synced
      })
      .eq('id', formId);
    
    if (formUpdateError) {
      console.error("Error updating form with shop_id:", formUpdateError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to update form with shop ID'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log(`Form ${formId} updated with shop_id ${shop} and published`);
    }

    // If we have product settings
    if (settings?.products && settings.products.length > 0) {
      // Delete existing product settings for this form
      const { error: deleteError } = await supabase
        .from('shopify_product_settings')
        .delete()
        .eq('form_id', formId);
      
      if (deleteError) {
        console.error("Error deleting existing product settings:", deleteError);
      }
      
      // Insert new product settings
      const productSettings = settings.products.map(productId => ({
        form_id: formId,
        product_id: productId,
        shop_id: shop,
        block_id: settings.blockId || null,
        enabled: true
      }));
      
      const { error: insertError } = await supabase
        .from('shopify_product_settings')
        .insert(productSettings);
      
      if (insertError) {
        console.error("Error inserting product settings:", insertError);
        return new Response(JSON.stringify({
          success: false,
          message: 'Failed to save product settings'
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`Synced ${productSettings.length} products with form ${formId}`);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Form synced with Shopify successfully',
      form_id: formId,
      shop: shop,
      is_published: true
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error in shopify-sync-form:", error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})

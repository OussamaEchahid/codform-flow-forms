
// This function syncs a form with Shopify by adding it to the store's settings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncFormRequest {
  formId: string;
  shop: string;
  settings?: {
    position?: 'product-page' | 'cart-page' | 'checkout';
    blockId?: string;
    products?: string[];
    insertionMethod?: 'auto' | 'manual';
    themeType?: 'os2' | 'traditional' | 'auto-detect';
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

    // Log form details
    console.log(`Form found: "${formData.title}", current published status: ${formData.is_published}`);

    // Update form with shop_id and ensure it's published for use in the theme
    const { error: formUpdateError } = await supabase
      .from('forms')
      .update({ 
        shop_id: shop,
        is_published: true, // Always ensure the form is published when synced with a shop
        updated_at: new Date().toISOString()
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
      console.log(`Form ${formId} updated with shop_id ${shop} and published successfully`);
    }

    // Verify form is now published
    const { data: updatedForm } = await supabase
      .from('forms')
      .select('is_published')
      .eq('id', formId)
      .single();
      
    console.log(`Form published status after sync: ${updatedForm?.is_published}`);

    // Store insertion preferences if provided
    if (settings) {
      // First, ensure we have a valid block_id
      const blockId = settings.blockId || `codform-${Date.now().toString(36)}`;
      
      const insertionSettings = {
        form_id: formId,
        shop_id: shop,
        insertion_method: settings.insertionMethod || 'auto',
        theme_type: settings.themeType || 'auto-detect',
        position: settings.position || 'product-page',
        block_id: blockId
      };

      // Store insertion preferences
      const { error: insertionError } = await supabase
        .from('shopify_form_insertion')
        .upsert(insertionSettings, { 
          onConflict: 'form_id,shop_id' 
        });

      if (insertionError) {
        console.error("Error saving insertion settings:", insertionError);
      } else {
        console.log("Insertion settings saved successfully:", insertionSettings);
      }

      // If we have product settings and it's a new form
      if (settings.products && settings.products.length > 0) {
        // First delete existing product settings for this form to avoid conflicts
        const { error: deleteError } = await supabase
          .from('shopify_product_settings')
          .delete()
          .eq('form_id', formId)
          .eq('shop_id', shop);
        
        if (deleteError) {
          console.error("Error deleting existing product settings:", deleteError);
        }
        
        // Insert new product settings
        const productSettings = settings.products.map(productId => ({
          form_id: formId,
          product_id: productId,
          shop_id: shop,
          block_id: blockId,
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
      } else if (!settings.products || settings.products.length === 0) {
        // If no products specified, we'll create a default entry that can be used globally
        console.log("No specific products provided - form will be available for all products");
        
        // This is optional - you may want to create a "default" product setting
        // or just rely on the form_insertion record
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Form synced with Shopify successfully',
      form_id: formId,
      shop: shop,
      is_published: true,
      manual_installation_required: settings?.insertionMethod === 'manual',
      insertion_settings: settings
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

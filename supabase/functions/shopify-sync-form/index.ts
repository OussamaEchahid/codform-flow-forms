
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
    const requestData: SyncFormRequest = await req.json();
    const { formId, shop, settings } = requestData;

    if (!formId || !shop) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: formId or shop' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing form sync for shop ${shop}, formId ${formId}`);

    // First, check if the form exists and update its published status if needed
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formError || !formData) {
      console.error('Form not found:', formError);
      return new Response(
        JSON.stringify({ error: 'Form not found', details: formError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Update form to published state if not already published
    if (!formData.is_published) {
      await supabase
        .from('forms')
        .update({ is_published: true })
        .eq('id', formId);
      console.log(`Updated form ${formId} to published state`);
    }

    // Insert or update the form insertion settings
    const blockId = settings?.blockId || `cod-form-${formId.substring(0, 8)}`;
    const position = settings?.position || 'product-page';
    const themeType = settings?.themeType || 'auto-detect';
    const insertionMethod = settings?.insertionMethod || 'auto';

    const { error: insertError } = await supabase
      .from('shopify_form_insertion')
      .upsert({
        form_id: formId,
        shop_id: shop,
        position,
        block_id: blockId,
        theme_type: themeType,
        insertion_method: insertionMethod,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'form_id,shop_id'
      });

    if (insertError) {
      console.error('Error updating form insertion:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to update form insertion settings', details: insertError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // If specific products are specified, associate the form with those products
    if (settings?.products && settings.products.length > 0) {
      console.log(`Associating form ${formId} with ${settings.products.length} products`);
      
      const productSettings = settings.products.map(productId => ({
        shop_id: shop,
        form_id: formId,
        product_id: productId,
        block_id: blockId,
        enabled: true,
        updated_at: new Date().toISOString()
      }));

      const { error: productsError } = await supabase
        .from('shopify_product_settings')
        .upsert(productSettings, {
          onConflict: 'shop_id,product_id'
        });

      if (productsError) {
        console.error('Error associating form with products:', productsError);
        return new Response(
          JSON.stringify({ error: 'Failed to associate form with products', details: productsError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } else {
      // If no specific products, mark this as the default form if needed
      console.log(`No specific products provided, marking form ${formId} as candidate for default`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Form synced successfully',
        formId,
        blockId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

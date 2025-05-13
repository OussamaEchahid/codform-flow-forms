
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function syncFormWithShopify(shop: string, formId: string, settings: any = {}) {
  try {
    console.log(`Syncing form ${formId} for shop ${shop}`);
    
    // Get form data
    const { data: form, error: formError } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();
    
    if (formError || !form) {
      throw new Error(`Form not found: ${formError?.message || 'Unknown error'}`);
    }
    
    // Update form properties in database to link with shop
    const { error: updateError } = await supabaseAdmin
      .from('forms')
      .update({ shop_id: shop })
      .eq('id', formId);
    
    if (updateError) {
      console.error('Error updating form with shop_id:', updateError);
      // Continue anyway - non-critical error
    }
    
    // Handle product associations if provided
    if (settings && settings.products && Array.isArray(settings.products) && settings.products.length > 0) {
      // First check if we need to delete existing product settings
      // Only delete if specifically requested to replace all settings
      if (settings.replaceExisting) {
        // Delete any existing product settings for this form and shop
        await supabaseAdmin
          .from('shopify_product_settings')
          .delete()
          .match({ form_id: formId, shop_id: shop });
      }
      
      // Insert new product settings
      const productSettings = settings.products.map((productId: string) => ({
        form_id: formId,
        product_id: productId,
        shop_id: shop,
        block_id: settings.blockId || `codform_${formId.substring(0, 8)}`,
        enabled: true
      }));
      
      if (productSettings.length > 0) {
        const { error: productSettingsError } = await supabaseAdmin
          .from('shopify_product_settings')
          .upsert(productSettings, { onConflict: 'shop_id,product_id' });
        
        if (productSettingsError) {
          console.error('Error creating product settings:', productSettingsError);
          // Continue anyway - non-critical error
        }
      }
    } else if (settings.blockId) {
      // If no specific products provided but blockId exists, create a single entry
      // only if explicitly requested by the singleProductSync flag
      if (settings.singleProductSync && settings.productId) {
        const { error: singleProductError } = await supabaseAdmin
          .from('shopify_product_settings')
          .upsert({
            form_id: formId,
            product_id: settings.productId,
            shop_id: shop,
            block_id: settings.blockId,
            enabled: true
          }, { onConflict: 'shop_id,product_id' });
          
        if (singleProductError) {
          console.error('Error creating single product settings:', singleProductError);
        }
      }
    }
    
    // Get shop access token for theme operations
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (shopError) {
      throw new Error(`Could not fetch shop access token: ${shopError.message}`);
    }

    const accessToken = shopData?.access_token;

    if (!accessToken) {
      throw new Error('No access token found for shop');
    }

    // Proceed with theme updates only if needed
    let themeUpdateResult = { success: true };
    
    if (settings.updateTheme) {
      // Call the theme update function through another edge function
      const themeUpdatePayload = {
        shop,
        accessToken,
        formId,
        insertionMethod: settings.insertionMethod || 'auto',
        blockId: settings.blockId || `codform_${formId.substring(0, 8)}`,
        themeId: settings.themeId,
        floatingButtonSettings: settings.floatingButton || {}
      };
      
      const themeUpdateResponse = await fetch(`${supabaseUrl}/functions/v1/shopify-theme-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(themeUpdatePayload)
      });
      
      if (!themeUpdateResponse.ok) {
        const errorText = await themeUpdateResponse.text();
        console.error('Theme update error:', errorText);
        themeUpdateResult = { success: false, error: errorText };
      } else {
        themeUpdateResult = await themeUpdateResponse.json();
      }
    }
    
    return {
      success: true,
      message: 'Form synced successfully',
      theme_update: themeUpdateResult
    };
  } catch (error) {
    console.error('Error in syncFormWithShopify:', error);
    return {
      success: false,
      message: error.message || 'Unknown error occurred'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop, formId, settings } = await req.json();

    if (!shop) {
      throw new Error('Shop is required');
    }

    if (!formId) {
      throw new Error('Form ID is required');
    }

    const result = await syncFormWithShopify(shop, formId, settings);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in serve function:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

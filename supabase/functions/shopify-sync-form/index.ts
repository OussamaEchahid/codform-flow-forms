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
      // Delete any existing product settings for this form
      await supabaseAdmin
        .from('shopify_product_settings')
        .delete()
        .eq('form_id', formId)
        .eq('shop_id', shop);
      
      // Insert new product settings
      const productSettings = settings.products.map((productId: string) => ({
        form_id: formId,
        product_id: productId,
        shop_id: shop,
        block_id: settings.blockId || null,
        enabled: true
      }));
      
      if (productSettings.length > 0) {
        const { error: productSettingsError } = await supabaseAdmin
          .from('shopify_product_settings')
          .insert(productSettings);
        
        if (productSettingsError) {
          console.error('Error creating product settings:', productSettingsError);
          // Continue anyway - non-critical error
        }
      }
    }
    
    // Fetch shop access token
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (shopError) {
      throw new Error(`Could not fetch shop access token: ${shopError.message}`);
    }

    const accessToken = shopData?.access_token;

    if (!accessToken) {
      throw new Error('No access token found for shop');
    }

    // Construct the GraphQL query to update the theme
    const graphqlQuery = JSON.stringify({
      query: `
        mutation {
          themeEditorExtensionUpdate(
            input: {
              theme: "${form.theme_id}",
              settings: [
                {
                  key: "form_id",
                  value: "${form.id}"
                }
              ]
            }
          ) {
            themeEditorExtension {
              theme {
                id
                name
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `
    });

    // Call the Shopify Admin API to update the theme
    const shopifyEndpoint = `https://${shop}/admin/api/2023-10/graphql.json`;
    const shopifyResponse = await fetch(shopifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: graphqlQuery,
    });

    const shopifyData = await shopifyResponse.json();

    if (shopifyData.errors) {
      console.error('Shopify API errors:', shopifyData.errors);
      throw new Error(`Shopify API error: ${shopifyData.errors.map((e: any) => e.message).join(', ')}`);
    }

    if (shopifyData.data?.themeEditorExtensionUpdate?.userErrors?.length > 0) {
      console.error('Theme Editor Extension Update errors:', shopifyData.data.themeEditorExtensionUpdate.userErrors);
      throw new Error(`Theme Editor Extension Update error: ${shopifyData.data.themeEditorExtensionUpdate.userErrors.map((e: any) => e.message).join(', ')}`);
    }
    
    return {
      success: true,
      message: 'Form synced successfully'
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

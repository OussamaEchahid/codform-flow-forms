
// This edge function allows updating Shopify access tokens
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface ShopifyUpdateRequest {
  shop: string;
  accessToken: string;
  makeActive?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get request body
    const body: ShopifyUpdateRequest = await req.json();
    
    // Validate request
    if (!body.shop || !body.accessToken) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: shop and accessToken' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean up shop domain
    let shopDomain = body.shop.trim().toLowerCase();
    if (!shopDomain.includes('myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    // First, check if the store exists
    const { data: existingStores, error: queryError } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('shop', shopDomain);

    if (queryError) {
      throw queryError;
    }

    let result;
    
    if (existingStores && existingStores.length > 0) {
      // If makeActive is true, set all other stores to inactive
      if (body.makeActive) {
        // First, set all stores to inactive
        await supabase
          .from('shopify_stores')
          .update({ is_active: false })
          .neq('shop', shopDomain);
      }
      
      // Update existing store
      result = await supabase
        .from('shopify_stores')
        .update({ 
          access_token: body.accessToken,
          is_active: body.makeActive ?? existingStores[0].is_active,
          updated_at: new Date().toISOString()
        })
        .eq('shop', shopDomain);
        
      if (result.error) {
        throw result.error;
      }
    } else {
      // Insert new store
      result = await supabase
        .from('shopify_stores')
        .insert({ 
          shop: shopDomain,
          access_token: body.accessToken,
          is_active: body.makeActive ?? true,
          token_type: 'offline'
        });
        
      if (result.error) {
        throw result.error;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Shopify token updated successfully',
      shop: shopDomain,
      isActive: body.makeActive ?? true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating Shopify token:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to update Shopify token' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

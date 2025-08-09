import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  action: 'link_store' | 'get_stores' | 'validate_token';
  shop?: string;
  user_id?: string;
  email?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, shop, user_id, email }: RequestBody = await req.json()

    switch (action) {
      case 'link_store':
        if (!shop || !user_id) {
          throw new Error('Missing required parameters: shop and user_id')
        }

        // ربط المتجر بالمستخدم
        const { data: linkData, error: linkError } = await supabaseClient
          .from('shopify_stores')
          .upsert({
            shop,
            user_id,
            email,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'shop'
          })

        if (linkError) {
          throw linkError
        }

        return new Response(
          JSON.stringify({ success: true, data: linkData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_stores':
        if (!user_id) {
          throw new Error('Missing user_id parameter')
        }

        // جلب المتاجر للمستخدم
        const { data: stores, error: storesError } = await supabaseClient
          .from('shopify_stores')
          .select('*')
          .eq('user_id', user_id)
          .order('updated_at', { ascending: false })

        if (storesError) {
          throw storesError
        }

        return new Response(
          JSON.stringify({ success: true, stores }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'validate_token':
        if (!shop) {
          throw new Error('Missing shop parameter')
        }

        // التحقق من صحة access token
        const { data: storeData, error: tokenError } = await supabaseClient
          .from('shopify_stores')
          .select('access_token, shop')
          .eq('shop', shop)
          .single()

        if (tokenError || !storeData?.access_token) {
          return new Response(
            JSON.stringify({ success: false, valid: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // اختبار الـ token مع Shopify API
        const shopifyResponse = await fetch(`https://${shop}/admin/api/2025-04/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': storeData.access_token,
            'Content-Type': 'application/json'
          }
        })

        const isValid = shopifyResponse.ok

        return new Response(
          JSON.stringify({ 
            success: true, 
            valid: isValid,
            shop: storeData.shop 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error in shopify-store-manager:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
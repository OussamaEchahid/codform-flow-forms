import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, shop, userId, email } = await req.json()

    console.log(`🔐 Secure auth request: ${action} for shop: ${shop}, user: ${userId}`)

    switch (action) {
      case 'link_store_to_user':
        // ربط متجر بمستخدم مصادق
        if (!userId || !shop) {
          throw new Error('Missing required parameters')
        }

        // التحقق من وجود المستخدم
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
        if (userError || !user) {
          throw new Error('Invalid user')
        }

        // ربط المتجر بالمستخدم
        const { error: linkError } = await supabase
          .from('shopify_stores')
          .upsert({
            shop,
            user_id: userId,
            email: user.user.email || email,
            is_active: true,
            updated_at: new Date().toISOString()
          })

        if (linkError) {
          throw linkError
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Store linked successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_user_stores':
        // جلب متاجر المستخدم
        if (!userId) {
          throw new Error('User ID required')
        }

        const { data: stores, error: storesError } = await supabase
          .from('shopify_stores')
          .select('shop, is_active, access_token, updated_at')
          .eq('user_id', userId)
          .eq('is_active', true)

        if (storesError) {
          throw storesError
        }

        return new Response(
          JSON.stringify({ success: true, stores }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'validate_store_access':
        // التحقق من صلاحية وصول المستخدم للمتجر
        if (!userId || !shop) {
          throw new Error('Missing required parameters')
        }

        const { data: storeAccess, error: accessError } = await supabase
          .from('shopify_stores')
          .select('shop, access_token')
          .eq('user_id', userId)
          .eq('shop', shop)
          .eq('is_active', true)
          .single()

        if (accessError || !storeAccess) {
          return new Response(
            JSON.stringify({ success: false, error: 'Access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, hasAccess: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('❌ Secure auth error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
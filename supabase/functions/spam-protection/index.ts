import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface BlockedIPCheck {
  is_blocked: boolean;
  redirect_url?: string;
  reason?: string;
}

interface BlockedIPRecord {
  id: string;
  ip_address: string;
  shop_id: string;
  reason?: string;
  redirect_url?: string;
  is_active: boolean;
  created_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'check'

    // التحقق من حظر عنوان IP
    if (req.method === 'GET' && action === 'check') {
      const ipAddress = url.searchParams.get('ip')
      const shopId = url.searchParams.get('shop_id')

      if (!ipAddress) {
        return new Response(
          JSON.stringify({ error: 'IP address is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // استدعاء دالة التحقق من الحظر
      const { data, error } = await supabase.rpc('is_ip_blocked', {
        p_ip_address: ipAddress,
        p_shop_id: shopId
      })

      if (error) {
        console.error('Error checking IP block:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to check IP block status' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const result: BlockedIPCheck = data?.[0] || { is_blocked: false }

      return new Response(
        JSON.stringify(result),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // جلب قائمة عناوين IP المحظورة لمتجر معين
    if (req.method === 'GET' && action === 'list') {
      const shopId = url.searchParams.get('shop_id')

      if (!shopId) {
        return new Response(
          JSON.stringify({ error: 'Shop ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching blocked IPs:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch blocked IPs' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ blocked_ips: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إضافة عنوان IP إلى قائمة الحظر
    if (req.method === 'POST' && action === 'add') {
      const { ip_address, shop_id, reason, redirect_url } = await req.json()

      if (!ip_address || !shop_id) {
        return new Response(
          JSON.stringify({ error: 'IP address and shop ID are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // استدعاء دالة إضافة عنوان IP المحظور
      const { data, error } = await supabase.rpc('add_blocked_ip', {
        p_ip_address: ip_address,
        p_shop_id: shop_id,
        p_reason: reason || null,
        p_redirect_url: redirect_url || null
      })

      if (error) {
        console.error('Error adding blocked IP:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to add blocked IP',
            details: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          blocked_id: data,
          message: 'IP address blocked successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إزالة عنوان IP من قائمة الحظر
    if (req.method === 'DELETE' && action === 'remove') {
      const { blocked_id } = await req.json()

      if (!blocked_id) {
        return new Response(
          JSON.stringify({ error: 'Blocked ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // استدعاء دالة إزالة عنوان IP المحظور
      const { data, error } = await supabase.rpc('remove_blocked_ip', {
        p_blocked_id: blocked_id
      })

      if (error) {
        console.error('Error removing blocked IP:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to remove blocked IP',
            details: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Blocked IP not found or access denied' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'IP address unblocked successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // تحديث عنوان IP محظور
    if (req.method === 'PUT' && action === 'update') {
      const { blocked_id, reason, redirect_url, is_active } = await req.json()

      if (!blocked_id) {
        return new Response(
          JSON.stringify({ error: 'Blocked ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const updateData: any = { updated_at: new Date().toISOString() }
      if (reason !== undefined) updateData.reason = reason
      if (redirect_url !== undefined) updateData.redirect_url = redirect_url
      if (is_active !== undefined) updateData.is_active = is_active

      const { data, error } = await supabase
        .from('blocked_ips')
        .update(updateData)
        .eq('id', blocked_id)
        .select()

      if (error) {
        console.error('Error updating blocked IP:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update blocked IP',
            details: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Blocked IP not found or access denied' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          blocked_ip: data[0],
          message: 'Blocked IP updated successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or method' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Spam protection function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

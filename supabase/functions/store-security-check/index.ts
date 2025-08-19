import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID().substring(0, 8)
  console.log(`[${requestId}] Store security check started`)

  try {
    const { shop_id, visitor_ip, user_agent, referer } = await req.json()
    
    if (!shop_id || !visitor_ip) {
      throw new Error('shop_id and visitor_ip are required')
    }

    console.log(`[${requestId}] Checking security for shop: ${shop_id}, IP: ${visitor_ip}`)

    // إنشاء عميل Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 1. فحص حظر عنوان IP مباشرة
    console.log(`[${requestId}] Checking IP block for: ${visitor_ip}`)
    const { data: ipBlockData } = await supabaseClient.rpc('is_ip_blocked', {
      p_ip_address: visitor_ip,
      p_shop_id: shop_id
    })

    if (ipBlockData && ipBlockData.length > 0 && ipBlockData[0].is_blocked) {
      console.log(`[${requestId}] IP ${visitor_ip} is blocked for shop ${shop_id}`)
      
      // تسجيل محاولة الحظر
      await supabaseClient.rpc('log_security_block', {
        p_shop_id: shop_id,
        p_blocked_type: 'ip',
        p_blocked_value: visitor_ip,
        p_visitor_ip: visitor_ip,
        p_user_agent: user_agent,
        p_referer: referer
      })

      return new Response(JSON.stringify({
        blocked: true,
        reason: ipBlockData[0].reason || 'IP address is blocked',
        redirect_url: ipBlockData[0].redirect_url || '/blocked',
        block_type: 'ip'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // 2. الحصول على معلومات الموقع الجغرافي
    console.log(`[${requestId}] Getting geolocation for IP: ${visitor_ip}`)
    const geoResponse = await supabaseClient.functions.invoke('ip-geolocation', {
      body: { ip: visitor_ip }
    })

    if (geoResponse.error) {
      console.error(`[${requestId}] Geolocation error:`, geoResponse.error)
      // في حالة فشل تحديد الموقع، لا نحظر المستخدم
      return new Response(JSON.stringify({
        blocked: false,
        reason: 'Geolocation service unavailable',
        visitor_country: 'Unknown'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const geoData = geoResponse.data
    const countryCode = geoData?.countryCode || 'XX'
    const country = geoData?.country || 'Unknown'

    console.log(`[${requestId}] Visitor country: ${country} (${countryCode})`)

    // 3. فحص حظر الدولة
    console.log(`[${requestId}] Checking country block for: ${countryCode}`)
    const { data: countryBlockData } = await supabaseClient.rpc('is_country_blocked', {
      p_shop_id: shop_id,
      p_country_code: countryCode
    })

    if (countryBlockData && countryBlockData.length > 0 && countryBlockData[0].is_blocked) {
      console.log(`[${requestId}] Country ${country} (${countryCode}) is blocked for shop ${shop_id}`)
      
      // تسجيل محاولة الحظر
      await supabaseClient.rpc('log_security_block', {
        p_shop_id: shop_id,
        p_blocked_type: 'country',
        p_blocked_value: countryCode,
        p_visitor_ip: visitor_ip,
        p_visitor_country: country,
        p_user_agent: user_agent,
        p_referer: referer
      })

      return new Response(JSON.stringify({
        blocked: true,
        reason: countryBlockData[0].reason || `Access from ${country} is not allowed`,
        redirect_url: countryBlockData[0].redirect_url || '/blocked',
        block_type: 'country',
        visitor_country: country,
        visitor_country_code: countryCode
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // 4. لا يوجد حظر - السماح بالوصول
    console.log(`[${requestId}] Access allowed for IP ${visitor_ip} from ${country}`)
    
    return new Response(JSON.stringify({
      blocked: false,
      visitor_country: country,
      visitor_country_code: countryCode,
      visitor_ip: visitor_ip,
      check_timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error(`[${requestId}] Error in store-security-check:`, error)
    
    // في حالة الخطأ، لا نحظر المستخدم لتجنب حظر غير مقصود
    return new Response(JSON.stringify({
      blocked: false,
      error: error.message || 'Security check failed',
      fallback: true,
      timestamp: new Date().toISOString()
    }), {
      status: 200, // نرجع 200 لتجنب حظر المستخدمين عند الأخطاء
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
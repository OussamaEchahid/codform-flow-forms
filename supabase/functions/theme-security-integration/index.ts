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
  console.log(`[${requestId}] Theme security integration request started`)

  try {
    const { shop_id, action } = await req.json()
    
    if (!shop_id) {
      throw new Error('shop_id is required')
    }

    console.log(`[${requestId}] Processing ${action} for shop: ${shop_id}`)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    switch (action) {
      case 'inject_security_script':
        // Generate security script for theme injection
        const securityScript = generateSecurityScript(shop_id)
        
        return new Response(JSON.stringify({
          success: true,
          script: securityScript,
          shop_id: shop_id
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })

      case 'verify_integration':
        // Verify that the shop has security integration enabled
        const { data: storeData, error: storeError } = await supabaseClient
          .from('shopify_stores')
          .select('shop, is_active')
          .eq('shop', shop_id)
          .eq('is_active', true)
          .single()

        if (storeError || !storeData) {
          throw new Error('Store not found or inactive')
        }

        return new Response(JSON.stringify({
          success: true,
          integrated: true,
          shop: storeData.shop
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error(`[${requestId}] Error in theme-security-integration:`, error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})

function generateSecurityScript(shopId: string): string {
  return `
// CodForm Security System - Auto-generated for ${shopId}
(function() {
  'use strict';
  
  const SHOP_ID = '${shopId}';
  const SECURITY_CHECK_URL = '${Deno.env.get('SUPABASE_URL')}/functions/v1/store-security-check';
  const API_KEY = '${Deno.env.get('SUPABASE_ANON_KEY')}';
  
  let securityChecked = false;
  
  async function performSecurityCheck() {
    if (securityChecked) return;
    securityChecked = true;
    
    try {
      console.log('[CodForm Security] Performing security check...');
      
      const visitorIP = await getVisitorIP();
      if (!visitorIP) {
        console.warn('[CodForm Security] Could not determine visitor IP');
        return;
      }
      
      const response = await fetch(SECURITY_CHECK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + API_KEY
        },
        body: JSON.stringify({
          shop_id: SHOP_ID,
          visitor_ip: visitorIP,
          user_agent: navigator.userAgent,
          referer: document.referrer || window.location.href
        })
      });
      
      if (!response.ok) {
        throw new Error('Security check request failed');
      }
      
      const result = await response.json();
      console.log('[CodForm Security] Check result:', result);
      
      if (result.blocked) {
        console.warn('[CodForm Security] Access blocked:', result.reason);
        handleBlocked(result);
      } else {
        console.log('[CodForm Security] Access allowed');
      }
      
    } catch (error) {
      console.error('[CodForm Security] Check failed:', error);
      // في حالة الخطأ، لا نحظر المستخدم
    }
  }
  
  async function getVisitorIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('[CodForm Security] Failed to get IP:', error);
      return null;
    }
  }
  
  function handleBlocked(blockInfo) {
    if (blockInfo.redirect_url) {
      // إعادة توجيه فورية
      window.location.href = blockInfo.redirect_url;
      return;
    }
    
    // إنشاء صفحة حظر مبسطة
    document.body.innerHTML = createBlockedPageHTML(blockInfo);
    document.body.style.cssText = 'margin: 0; padding: 0; font-family: Arial, sans-serif;';
  }
  
  function createBlockedPageHTML(blockInfo) {
    const blockTypeText = blockInfo.block_type === 'country' ? 'حظر جغرافي' : 'حظر عنوان IP';
    const countryInfo = blockInfo.visitor_country ? \`<br><strong>الموقع:</strong> \${blockInfo.visitor_country}\` : '';
    
    return \`
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        text-align: center;
        direction: rtl;
      ">
        <div style="
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 80px;
            height: 80px;
            background: #ff4757;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            font-size: 40px;
          ">🛡️</div>
          
          <h1 style="color: #ff4757; margin-bottom: 20px; font-size: 28px;">
            تم حظر الوصول
          </h1>
          
          <p style="margin-bottom: 30px; color: #666; font-size: 18px;">
            عذراً، لا يمكنك الوصول إلى هذا المتجر في الوقت الحالي
          </p>
          
          <div style="
            background: #f1f2f6;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-right: 4px solid #ff4757;
            text-align: right;
          ">
            <strong>السبب:</strong> \${blockInfo.reason || 'تم حظر الوصول من موقعك'}
            <br><strong>نوع الحظر:</strong> \${blockTypeText}
            \${countryInfo}
            <br><strong>الوقت:</strong> \${new Date().toLocaleString('ar-SA')}
          </div>
          
          <p style="margin: 20px 0; color: #666;">
            إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع إدارة المتجر
          </p>
          
          <div style="margin-top: 30px;">
            <button onclick="window.location.reload()" style="
              background: #5352ed;
              color: white;
              padding: 15px 30px;
              border: none;
              border-radius: 10px;
              font-size: 16px;
              cursor: pointer;
              margin: 10px;
            ">إعادة المحاولة</button>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
            محمي بواسطة CodForm Security System
          </div>
        </div>
      </div>
    \`;
  }
  
  // تشغيل فحص الأمان
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performSecurityCheck);
  } else {
    performSecurityCheck();
  }
  
  // تشغيل إضافي بعد ثانية واحدة للتأكد
  setTimeout(performSecurityCheck, 1000);
  
})();
`;
}
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
  console.log(`[${requestId}] Shopify protection script request started`)

  try {
    const { shop_domain, method } = await req.json()
    
    if (!shop_domain) {
      throw new Error('shop_domain is required')
    }

    console.log(`[${requestId}] Generating protection for shop: ${shop_domain}`)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    if (method === 'get_script') {
      // إنتاج سكريپت الحماية للمتجر
      const protectionScript = generateShopifyProtectionScript(shop_domain)
      
      return new Response(JSON.stringify({
        success: true,
        script: protectionScript,
        shop_domain: shop_domain,
        instructions: `
تعليمات التطبيق:
1. انسخ السكريپت أدناه
2. اذهب إلى إعدادات الثيم في شوبيفاي
3. افتح ملف theme.liquid
4. الصق السكريپت قبل إغلاق </head>
5. احفظ التغييرات
        `
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (method === 'test_protection') {
      // اختبار الحماية
      const testResult = await testShopProtection(shop_domain, supabaseClient)
      
      return new Response(JSON.stringify({
        success: true,
        test_result: testResult,
        shop_domain: shop_domain
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    throw new Error('Invalid method. Use "get_script" or "test_protection"')

  } catch (error) {
    console.error(`[${requestId}] Error in shopify-protection-script:`, error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})

function generateShopifyProtectionScript(shopDomain: string): string {
  return `
<!-- CodForm Protection System - Generated for ${shopDomain} -->
<script>
(function() {
  'use strict';
  
  const SHOP_DOMAIN = '${shopDomain}';
  const SECURITY_API = '${Deno.env.get('SUPABASE_URL')}/functions/v1/store-security-check';
  const API_KEY = '${Deno.env.get('SUPABASE_ANON_KEY')}';
  
  let protectionActive = false;
  
  // تشغيل فحص الحماية
  async function activateProtection() {
    if (protectionActive) return;
    protectionActive = true;
    
    try {
      console.log('[CodForm] 🛡️ Activating store protection...');
      
      // الحصول على IP العنوان
      const visitorIP = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(data => data.ip)
        .catch(() => null);
      
      if (!visitorIP) {
        console.warn('[CodForm] ⚠️ Could not get visitor IP');
        return;
      }
      
      console.log('[CodForm] 🔍 Checking security for IP:', visitorIP);
      
      // فحص الحماية
      const response = await fetch(SECURITY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + API_KEY
        },
        body: JSON.stringify({
          shop_id: SHOP_DOMAIN,
          visitor_ip: visitorIP,
          user_agent: navigator.userAgent,
          referer: document.referrer || window.location.href
        })
      });
      
      if (!response.ok) {
        throw new Error('Security check failed: ' + response.status);
      }
      
      const result = await response.json();
      console.log('[CodForm] 🔒 Security check result:', result);
      
      if (result.blocked) {
        console.warn('[CodForm] 🚫 Access BLOCKED:', result.reason);
        blockAccess(result);
      } else {
        console.log('[CodForm] ✅ Access ALLOWED');
      }
      
    } catch (error) {
      console.error('[CodForm] ❌ Protection error:', error);
      // في حالة الخطأ، لا نحظر المستخدم
    }
  }
  
  function blockAccess(blockInfo) {
    // إيقاف كل شيء فوراً
    document.documentElement.style.cssText = 'margin:0!important;padding:0!important;overflow:hidden!important;';
    document.body.style.cssText = 'margin:0!important;padding:0!important;overflow:hidden!important;';
    
    // إخفاء كل المحتوى الموجود
    const hideStyle = document.createElement('style');
    hideStyle.innerHTML = \`
      * { display: none !important; }
      html, body { display: block !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
      .codform-blocked-page { display: flex !important; }
      .codform-blocked-page * { display: block !important; }
    \`;
    document.head.appendChild(hideStyle);
    
    // مسح محتوى الـ body بالكامل وإضافة صفحة الحظر
    document.body.innerHTML = '';
    document.body.className = '';
    document.body.insertAdjacentHTML('afterbegin', createBlockedPageHTML(blockInfo));
    
    // منع التنقل والتمرير
    window.history.replaceState(null, '', window.location.href);
    window.addEventListener('popstate', function(e) {
      e.preventDefault();
      window.history.replaceState(null, '', window.location.href);
    });
    
    // منع التمرير
    document.addEventListener('wheel', function(e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('keydown', function(e) {
      if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
      }
    });
  }
  
  function createBlockedPageHTML(blockInfo) {
    const blockTypeText = blockInfo.block_type === 'country' ? 'حظر جغرافي' : 'حظر عنوان IP';
    const countryInfo = blockInfo.visitor_country ? \`<br><strong>الموقع:</strong> \${blockInfo.visitor_country}\` : '';
    
    return \`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم حظر الوصول - Store Access Blocked</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      direction: rtl;
    }
    .blocked-container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      animation: slideIn 0.5s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-50px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .shield-icon {
      width: 80px;
      height: 80px;
      background: #ff4757;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 30px;
      font-size: 40px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    h1 { color: #ff4757; margin-bottom: 20px; font-size: 28px; }
    .reason-box {
      background: #f1f2f6;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      border-right: 4px solid #ff4757;
      text-align: right;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .info-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .btn {
      background: #5352ed;
      color: white;
      padding: 15px 30px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      cursor: pointer;
      margin: 10px;
      transition: all 0.3s;
    }
    .btn:hover { background: #3742fa; transform: translateY(-2px); }
    .footer-info {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body class="codform-blocked-page">
  <div class="blocked-container codform-blocked-page">
    <div class="shield-icon">🛡️</div>
    
    <h1>تم حظر الوصول</h1>
    <p style="margin-bottom: 30px; color: #666; font-size: 18px;">
      عذراً، لا يمكنك الوصول إلى هذا المتجر في الوقت الحالي
    </p>
    
    <div class="reason-box">
      <strong>السبب:</strong> \${blockInfo.reason || 'تم حظر الوصول من موقعك'}
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <strong>نوع الحظر</strong><br>
        <span style="color: #ff4757; font-weight: bold;">\${blockTypeText}</span>
      </div>
      <div class="info-item">
        <strong>الوقت</strong><br>
        <span>\${new Date().toLocaleString('ar-SA')}</span>
      </div>
    </div>
    
    \${blockInfo.visitor_country ? \`
    <div class="info-item" style="margin: 20px 0;">
      <strong>موقعك الجغرافي:</strong> \${blockInfo.visitor_country}
    </div>
    \` : ''}
    
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <h3 style="color: #f39c12; margin-bottom: 10px;">هل تعتقد أن هذا خطأ؟</h3>
      <p style="color: #666; font-size: 14px;">
        إذا كنت تعتقد أنك تم حظرك بالخطأ، يمكنك التواصل مع إدارة المتجر.
        تأكد من عدم استخدام VPN أو بروكسي.
      </p>
    </div>
    
    <div>
      <button class="btn" onclick="window.location.reload()">
        🔄 إعادة المحاولة
      </button>
      \${blockInfo.redirect_url && blockInfo.redirect_url !== '/blocked' ? \`
      <button class="btn" onclick="window.location.href='\${blockInfo.redirect_url}'">
        🔗 انتقال إلى صفحة أخرى  
      </button>
      \` : ''}
    </div>
    
    <div class="footer-info">
      🛡️ محمي بواسطة CodForm Security System<br>
      جميع محاولات الوصول يتم تسجيلها ومراقبتها
    </div>
  </div>
</body>
</html>
    \`;
  }
  
  // تشغيل الحماية عند تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activateProtection);
  } else {
    activateProtection();
  }
  
  // تشغيل إضافي للتأكد
  setTimeout(activateProtection, 500);
  
  console.log('[CodForm] 🚀 Protection system initialized for:', SHOP_DOMAIN);
  
})();
</script>
`;
}

async function testShopProtection(shopDomain: string, supabaseClient: any) {
  try {
    // التحقق من وجود المتجر في قاعدة البيانات
    const { data: storeData, error: storeError } = await supabaseClient
      .from('shopify_stores')
      .select('shop, is_active')
      .eq('shop', shopDomain)
      .single()
    
    if (storeError || !storeData) {
      return {
        status: 'error',
        message: 'المتجر غير موجود في قاعدة البيانات'
      }
    }
    
    // التحقق من وجود عناصر محظورة
    const [ipsResult, countriesResult] = await Promise.all([
      supabaseClient.from('blocked_ips').select('count').eq('shop_id', shopDomain).eq('is_active', true),
      supabaseClient.from('blocked_countries').select('count').eq('shop_id', shopDomain).eq('is_active', true)
    ])
    
    return {
      status: 'success',
      shop_active: storeData.is_active,
      blocked_ips_count: ipsResult.data?.[0]?.count || 0,
      blocked_countries_count: countriesResult.data?.[0]?.count || 0,
      message: 'نظام الحماية جاهز للتفعيل'
    }
    
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    }
  }
}
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
    // إيقاف كل العمليات فوراً
    try {
      window.stop();
    } catch(e) {}
    
    // منع أي تحميل إضافي
    if (window.addEventListener) {
      window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        e.returnValue = '';
      });
    }
    
    // تحضير البيانات
    const blockTypeText = blockInfo.block_type === 'country' ? 'حظر جغرافي' : 'حظر عنوان IP';
    const reason = blockInfo.reason || 'تم حظر الوصول من موقعك';
    const currentTime = new Date().toLocaleString('ar-SA');
    const locationInfo = blockInfo.visitor_country ? 
      '<div style="background: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 10px; margin: 15px 0; text-align: center;"><div style="color: #1976d2; font-size: 14px; font-weight: 600;">موقعك الجغرافي: ' + blockInfo.visitor_country + '</div></div>' : '';
    const redirectButton = (blockInfo.redirect_url && blockInfo.redirect_url !== '/blocked') ? 
      '<button style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin: 8px; transition: all 0.3s ease; text-decoration: none; display: inline-block; min-width: 120px;" onclick="window.location.href=\'' + blockInfo.redirect_url + '\'">🔗 انتقال إلى صفحة أخرى</button>' : '';
    
    // إزالة كامل محتوى الصفحة بقوة
    setTimeout(function() {
      try {
        // مسح الصفحة بالكامل
        document.documentElement.innerHTML = '';
        
        // إعادة كتابة الصفحة من الصفر
        document.documentElement.innerHTML = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>تم حظر الوصول - Access Blocked</title><style>*{margin:0!important;padding:0!important;box-sizing:border-box!important}html,body{width:100%!important;height:100vh!important;overflow:hidden!important;position:fixed!important;top:0!important;left:0!important;font-family:"Segoe UI",Tahoma,Geneva,Verdana,sans-serif!important;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)!important;display:flex!important;align-items:center!important;justify-content:center!important;direction:rtl!important;padding:20px!important}.blocked-container{background:white!important;border-radius:20px!important;padding:40px!important;max-width:500px!important;width:100%!important;text-align:center!important;box-shadow:0 25px 50px rgba(0,0,0,0.25)!important;animation:slideIn 0.8s ease-out!important;position:relative!important;z-index:999999!important}@keyframes slideIn{from{opacity:0;transform:translateY(-30px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}.shield-icon{width:70px!important;height:70px!important;background:#ff4757!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0 auto 25px!important;font-size:35px!important;animation:pulse 2s infinite!important}@keyframes pulse{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}h1{color:#2c3e50!important;margin-bottom:15px!important;font-size:24px!important;font-weight:bold!important}.subtitle{color:#7f8c8d!important;font-size:16px!important;margin-bottom:25px!important;line-height:1.5!important}.reason-box{background:#fff5f5!important;padding:20px!important;border-radius:12px!important;margin:20px 0!important;border:1px solid #fed7d7!important;text-align:right!important}.reason-text{color:#c53030!important;font-weight:600!important;font-size:14px!important}.info-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;margin:20px 0!important}.info-item{background:#f8f9fa!important;padding:15px!important;border-radius:10px!important;text-align:center!important;border:1px solid #e9ecef!important}.info-label{font-size:12px!important;color:#6c757d!important;font-weight:600!important;text-transform:uppercase!important;margin-bottom:5px!important}.info-value{color:#495057!important;font-size:14px!important;font-weight:600!important}.blocked-type{color:#dc3545!important}.btn{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)!important;color:white!important;padding:12px 24px!important;border:none!important;border-radius:8px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;margin:8px!important;transition:all 0.3s ease!important;text-decoration:none!important;display:inline-block!important;min-width:120px!important}.btn:hover{transform:translateY(-2px)!important;box-shadow:0 5px 15px rgba(0,0,0,0.2)!important}.warning-box{background:#fff9e6!important;border:1px solid #ffe066!important;padding:20px!important;border-radius:10px!important;margin:20px 0!important;text-align:right!important}.warning-title{color:#b7791f!important;margin-bottom:8px!important;font-weight:bold!important;font-size:14px!important}.warning-text{color:#8d6e63!important;font-size:13px!important;line-height:1.4!important}.footer-info{margin-top:25px!important;padding-top:20px!important;border-top:1px solid #e9ecef!important;font-size:11px!important;color:#adb5bd!important;line-height:1.4!important}</style></head><body><div class="blocked-container"><div class="shield-icon">🛡️</div><h1>تم حظر الوصول</h1><p class="subtitle">عذراً، لا يمكنك الوصول إلى هذا المتجر في الوقت الحالي</p><div class="reason-box"><span class="reason-text">السبب: ' + reason + '</span></div><div class="info-grid"><div class="info-item"><div class="info-label">نوع الحظر</div><div class="info-value blocked-type">' + blockTypeText + '</div></div><div class="info-item"><div class="info-label">الوقت</div><div class="info-value">' + currentTime + '</div></div></div>' + locationInfo + '<div class="warning-box"><div class="warning-title">هل تعتقد أن هذا خطأ؟</div><div class="warning-text">إذا كنت تعتقد أنك تم حظرك بالخطأ، يمكنك التواصل مع إدارة المتجر. تأكد من عدم استخدام VPN أو بروكسي.</div></div><div><button class="btn" onclick="window.location.reload()">🔄 إعادة المحاولة</button>' + redirectButton + '</div><div class="footer-info">🛡️ محمي بواسطة CodForm Security System<br>جميع محاولات الوصول يتم تسجيلها ومراقبتها</div></div><script>history.replaceState(null,"",location.href);window.addEventListener("popstate",function(e){e.preventDefault();history.replaceState(null,"",location.href)});document.addEventListener("wheel",function(e){e.preventDefault()},{passive:false});document.addEventListener("touchmove",function(e){e.preventDefault()},{passive:false});document.addEventListener("keydown",function(e){if([32,33,34,35,36,37,38,39,40].includes(e.keyCode)){e.preventDefault()}});setInterval(function(){if(document.body.children.length>1){while(document.body.children.length>1){document.body.removeChild(document.body.children[1])}}},100);</script></body></html>';
      } catch(e) {
        // في حالة فشل الطريقة الأولى، استخدم document.write
        document.open();
        document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>تم حظر الوصول</title><style>*{margin:0!important;padding:0!important;box-sizing:border-box!important}body{font-family:Arial,sans-serif!important;background:linear-gradient(135deg,#667eea,#764ba2)!important;min-height:100vh!important;display:flex!important;align-items:center!important;justify-content:center!important;direction:rtl!important;padding:20px!important}.container{background:white!important;border-radius:20px!important;padding:40px!important;max-width:500px!important;text-align:center!important;box-shadow:0 25px 50px rgba(0,0,0,0.3)!important}.icon{width:70px!important;height:70px!important;background:#ff4757!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0 auto 25px!important;font-size:35px!important}h1{color:#2c3e50!important;margin-bottom:15px!important;font-size:24px!important}.reason{background:#fff5f5!important;padding:20px!important;border-radius:12px!important;margin:20px 0!important;border:1px solid #fed7d7!important;color:#c53030!important;font-weight:600!important}.btn{background:#667eea!important;color:white!important;padding:12px 24px!important;border:none!important;border-radius:8px!important;cursor:pointer!important;margin:8px!important}</style></head><body><div class="container"><div class="icon">🛡️</div><h1>تم حظر الوصول</h1><p>عذراً، لا يمكنك الوصول إلى هذا المتجر</p><div class="reason">السبب: ' + reason + '</div><button class="btn" onclick="location.reload()">🔄 إعادة المحاولة</button></div></body></html>');
        document.close();
      }
    }, 50);
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
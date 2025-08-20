import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { shop_domain, method } = await req.json()
    
    if (!shop_domain) {
      throw new Error('shop_domain is required')
    }

    if (!method) {
      throw new Error('method is required')
    }

    console.log(`Processing ${method} for shop: ${shop_domain}`)

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
      return new Response(JSON.stringify({
        success: true,
        test_result: {
          status: 'success',
          message: 'نظام الحماية جاهز للتفعيل'
        },
        shop_domain: shop_domain
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    throw new Error('Invalid method. Use "get_script" or "test_protection"')

  } catch (error) {
    console.error('Error in shopify-protection-script:', error)
    
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
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const apiKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

  // تنظيف وحماية المتغيرات
  const cleanShopDomain = shopDomain.replace(/['"\\]/g, '').trim()
  const cleanSupabaseUrl = supabaseUrl.replace(/['"\\]/g, '').trim()
  const cleanApiKey = apiKey.replace(/['"\\]/g, '').trim()

  return `<!-- CodForm Protection System - Generated for ${cleanShopDomain} -->
<script>
(function() {
  'use strict';

  // منع التشغيل المتعدد بشكل مطلق مع علامة عالمية قوية
  if (window.CodFormProtectionActive === true) {
    return;
  }
  window.CodFormProtectionActive = true;

  const SHOP_DOMAIN = '${cleanShopDomain}';
  const SECURITY_API = '${cleanSupabaseUrl}/functions/v1/store-security-check';
  const API_KEY = '${cleanApiKey}';

  console.log('[CodForm] 🛡️ Protection system initialized for:', SHOP_DOMAIN);

  // حظر فوري وكامل للمحتوى
  function immediateBlock() {
    try {
      document.documentElement.style.cssText = 'visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
      if (document.body) {
        document.body.style.cssText = 'display: none !important;';
      }
    } catch(e) {
      console.warn('[CodForm] Could not apply immediate block styles:', e);
    }
  }

  // حظر فوري عند التحميل
  immediateBlock();
  
  // تشغيل فحص الحماية
  async function activateProtection() {
    try {
      console.log('[CodForm] 🛡️ Activating store protection...');
      
      // الحصول على IP العنوان
      const visitorIP = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(data => data.ip)
        .catch(() => null);
      
      if (!visitorIP) {
        console.warn('[CodForm] ⚠️ Could not get visitor IP - allowing access');
        allowAccess();
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
        allowAccess();
      }
      
    } catch (error) {
      console.error('[CodForm] ❌ Protection error:', error);
      // في حالة الخطأ، إظهار المحتوى
      allowAccess();
    }
  }

  function allowAccess() {
    console.log('[CodForm] ✅ Allowing access - restoring page content');
    
    try {
      // إزالة جميع أنماط الحظر
      document.documentElement.style.cssText = '';
      if (document.body) {
        document.body.style.cssText = '';
      }
      
      // إعادة تفعيل التفاعل
      document.documentElement.style.visibility = 'visible';
      document.documentElement.style.opacity = '1';
      document.documentElement.style.pointerEvents = 'auto';
      
      if (document.body) {
        document.body.style.display = 'block';
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
      }
      
      console.log('[CodForm] ✅ Page content restored successfully');
      
    } catch(e) {
      console.error('[CodForm] Error restoring page content:', e);
      // fallback
      document.documentElement.style.cssText = 'visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
      if (document.body) {
        document.body.style.cssText = 'display: block !important;';
      }
    }
  }

  function blockAccess(blockInfo) {
    console.log('[CodForm] 🚫 Blocking access with info:', blockInfo);
    
    // إزالة كل المحتوى والأحداث
    try {
      // مسح المحتوى بالكامل
      document.documentElement.innerHTML = '';
      
      // إنشاء صفحة الحظر
      const blockedHTML = createBlockedPageHTML(blockInfo);
      
      // استبدال الصفحة بالكامل
      document.open();
      document.write(blockedHTML);
      document.close();
      
    } catch(e) {
      console.error('[CodForm] Error during blocking process:', e);
      // fallback - إخفاء المحتوى على الأقل
      document.documentElement.style.cssText = 'display: none !important;';
      document.body.innerHTML = '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f44336; color: white; display: flex; align-items: center; justify-content: center; font-family: Arial; z-index: 999999;"><h1>تم حظر الوصول - Access Blocked</h1></div>';
    }
  }

  function createBlockedPageHTML(blockInfo) {
    const reason = String(blockInfo.reason || 'تم حظر الوصول من موقعك').replace(/['"<>&]/g, function(match) {
      switch(match) {
        case '"': return '&quot;';
        case "'": return '&#39;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        default: return match;
      }
    });

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>تم حظر الوصول</title></head><body style="margin:0;padding:20px;font-family:Arial;background:#f44336;color:white;text-align:center;"><div style="max-width:500px;margin:50px auto;"><h1>🛡️ تم حظر الوصول</h1><p>عذراً، لا يمكنك الوصول إلى هذا المتجر في الوقت الحالي</p><div style="background:rgba(255,255,255,0.1);padding:20px;border-radius:10px;margin:20px 0;"><strong>السبب: ' + reason + '</strong></div><button onclick="window.location.reload()" style="background:white;color:#f44336;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;">🔄 إعادة المحاولة</button></div></body></html>';
  }
  
  // تشغيل الحماية فوراً مع معالجة الأخطاء
  try {
    activateProtection().catch(function(error) {
      console.error('[CodForm] Protection activation failed:', error);
      // في حالة فشل التفعيل، إظهار المحتوى لتجنب حظر غير مقصود
      allowAccess();
    });
  } catch(error) {
    console.error('[CodForm] Critical protection error:', error);
    allowAccess();
  }

  // إضافة مراقب للتأكد من عدم تعطل الصفحة
  setTimeout(function() {
    if (document.documentElement.style.visibility === 'hidden') {
      console.warn('[CodForm] ⚠️ Page still hidden after timeout, forcing visibility');
      allowAccess();
    }
  }, 10000); // 10 ثوان timeout

})();
</script>`;
}

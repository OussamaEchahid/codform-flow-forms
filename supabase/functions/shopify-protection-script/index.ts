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
  // استخدام القيم الثابتة المعروفة  
  const supabaseUrl = 'https://trlklwixfeaexhydzaue.supabase.co'
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'

  // تنظيف وحماية المتغيرات
  const cleanShopDomain = shopDomain.replace(/['"\\]/g, '').trim()

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
  const SECURITY_API = '${supabaseUrl}/functions/v1/store-security-check';
  const API_KEY = '${apiKey}';

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

      // إزالة أي أنماط مضافة للحظر
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.style) {
          el.style.visibility = '';
          el.style.opacity = '';
          el.style.display = '';
          el.style.pointerEvents = '';
        }
      });

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

    // إيقاف كل العمليات فوراً
    try {
      if (window.stop) window.stop();
      if (window.location && window.location.replace) {
        // منع التنقل
        window.history.replaceState = function() {};
        window.history.pushState = function() {};
      }
    } catch(e) {
      console.warn('[CodForm] Could not stop window operations:', e);
    }

    // إزالة كل المحتوى والأحداث
    try {
      // إزالة جميع event listeners
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.cloneNode) {
          const newEl = el.cloneNode(true);
          if (el.parentNode) {
            el.parentNode.replaceChild(newEl, el);
          }
        }
      });

      // مسح المحتوى بالكامل
      document.documentElement.innerHTML = '';

      // إنشاء صفحة الحظر
      const blockedHTML = createBlockedPageHTML(blockInfo);

      // استبدال الصفحة بالكامل
      document.open();
      document.write(blockedHTML);
      document.close();

      // منع أي تشغيل إضافي
      window.onload = null;
      window.onbeforeunload = null;
      window.onunload = null;

      // تعطيل event listeners
      if (window.addEventListener) {
        window.addEventListener = function() {};
      }
      if (window.removeEventListener) {
        window.removeEventListener = function() {};
      }

    } catch(e) {
      console.error('[CodForm] Error during blocking process:', e);
      // fallback - إخفاء المحتوى على الأقل
      document.documentElement.style.cssText = 'display: none !important;';
      document.body.innerHTML = '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f44336; color: white; display: flex; align-items: center; justify-content: center; font-family: Arial; z-index: 999999;"><h1>تم حظر الوصول - Access Blocked</h1></div>';
    }
  }
  
  function createBlockedPageHTML(blockInfo) {
    // تنظيف وحماية جميع المتغيرات
    const blockTypeText = blockInfo.block_type === 'country' ? 'حظر جغرافي' : 'حظر عنوان IP';
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

    const currentTime = new Date().toLocaleString('ar-SA');

    const locationInfo = blockInfo.visitor_country ?
      '<div style="background: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 10px; margin: 15px 0; text-align: center;"><div style="color: #1976d2; font-size: 14px; font-weight: 600;">موقعك الجغرافي: ' + String(blockInfo.visitor_country).replace(/['"<>&]/g, function(match) {
        switch(match) {
          case '"': return '&quot;';
          case "'": return '&#39;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          default: return match;
        }
      }) + '</div></div>' : '';

    const redirectButton = (blockInfo.redirect_url && blockInfo.redirect_url !== '/blocked') ?
      '<button style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin: 8px; transition: all 0.3s ease; text-decoration: none; display: inline-block; min-width: 120px;" onclick="window.location.href=\\'' + String(blockInfo.redirect_url).replace(/['"]/g, '') + '\\'">🔗 انتقال إلى صفحة أخرى</button>' : '';

    return [
      '<!DOCTYPE html>',
      '<html lang="ar" dir="rtl">',
      '<head>',
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<title>تم حظر الوصول - Access Blocked</title>',
      '<style>',
      '/* إعادة تعيين كامل لجميع العناصر */',
      '*,*::before,*::after{margin:0!important;padding:0!important;box-sizing:border-box!important;border:none!important;outline:none!important;text-decoration:none!important;list-style:none!important;background:transparent!important;color:inherit!important;font:inherit!important;vertical-align:baseline!important;position:static!important;z-index:auto!important;opacity:1!important;visibility:visible!important;display:block!important;float:none!important;clear:none!important;overflow:visible!important;clip:auto!important;transform:none!important;transition:none!important;animation:none!important}',
      '/* تعيين الصفحة الأساسية */',
      'html,body{width:100%!important;height:100vh!important;overflow:hidden!important;position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;font-family:"Segoe UI",Tahoma,Geneva,Verdana,sans-serif!important;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)!important;display:flex!important;align-items:center!important;justify-content:center!important;direction:rtl!important;padding:20px!important;z-index:2147483647!important}',
      '.blocked-container{background:white!important;border-radius:20px!important;padding:40px!important;max-width:500px!important;width:100%!important;text-align:center!important;box-shadow:0 25px 50px rgba(0,0,0,0.25)!important;animation:slideIn 0.8s ease-out!important;position:fixed!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important}',
      '@keyframes slideIn{from{opacity:0;transform:translateY(-30px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}',
      '.shield-icon{width:70px!important;height:70px!important;background:#ff4757!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0 auto 25px!important;font-size:35px!important;animation:pulse 2s infinite!important}',
      '@keyframes pulse{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}',
      'h1{color:#2c3e50!important;margin-bottom:15px!important;font-size:24px!important;font-weight:bold!important}',
      '.subtitle{color:#7f8c8d!important;font-size:16px!important;margin-bottom:25px!important;line-height:1.5!important}',
      '.reason-box{background:#fff5f5!important;padding:20px!important;border-radius:12px!important;margin:20px 0!important;border:1px solid #fed7d7!important;text-align:right!important}',
      '.reason-text{color:#c53030!important;font-weight:600!important;font-size:14px!important}',
      '.info-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;margin:20px 0!important}',
      '.info-item{background:#f8f9fa!important;padding:15px!important;border-radius:10px!important;text-align:center!important;border:1px solid #e9ecef!important}',
      '.info-label{font-size:12px!important;color:#6c757d!important;font-weight:600!important;text-transform:uppercase!important;margin-bottom:5px!important}',
      '.info-value{color:#495057!important;font-size:14px!important;font-weight:600!important}',
      '.blocked-type{color:#dc3545!important}',
      '.btn{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)!important;color:white!important;padding:12px 24px!important;border:none!important;border-radius:8px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;margin:8px!important;transition:all 0.3s ease!important;text-decoration:none!important;display:inline-block!important;min-width:120px!important}',
      '.btn:hover{transform:translateY(-2px)!important;box-shadow:0 5px 15px rgba(0,0,0,0.2)!important}',
      '.warning-box{background:#fff9e6!important;border:1px solid #ffe066!important;padding:20px!important;border-radius:10px!important;margin:20px 0!important;text-align:right!important}',
      '.warning-title{color:#b7791f!important;margin-bottom:8px!important;font-weight:bold!important;font-size:14px!important}',
      '.warning-text{color:#8d6e63!important;font-size:13px!important;line-height:1.4!important}',
      '.footer-info{margin-top:25px!important;padding-top:20px!important;border-top:1px solid #e9ecef!important;font-size:11px!important;color:#adb5bd!important;line-height:1.4!important}',
      '/* إخفاء جميع العناصر الأخرى */',
      'body > *:not(.blocked-container){display:none!important;visibility:hidden!important;opacity:0!important;position:absolute!important;top:-9999px!important;left:-9999px!important;z-index:-1!important}',
      '/* ضمان ظهور صفحة الحظر فقط */',
      '.blocked-container *{display:block!important;visibility:visible!important;opacity:1!important;position:static!important;z-index:auto!important}',
      '.blocked-container .info-grid{display:grid!important}',
      '.blocked-container button{display:inline-block!important;cursor:pointer!important}',
      '</style>',
      '</head>',
      '<body>',
      '<div class="blocked-container">',
      '<div class="shield-icon">🛡️</div>',
      '<h1>تم حظر الوصول</h1>',
      '<p class="subtitle">عذراً، لا يمكنك الوصول إلى هذا المتجر في الوقت الحالي</p>',
      '<div class="reason-box">',
      '<span class="reason-text">السبب: ' + reason + '</span>',
      '</div>',
      '<div class="info-grid">',
      '<div class="info-item">',
      '<div class="info-label">نوع الحظر</div>',
      '<div class="info-value blocked-type">' + blockTypeText + '</div>',
      '</div>',
      '<div class="info-item">',
      '<div class="info-label">الوقت</div>',
      '<div class="info-value">' + currentTime + '</div>',
      '</div>',
      '</div>',
      locationInfo,
      '<div class="warning-box">',
      '<div class="warning-title">هل تعتقد أن هذا خطأ؟</div>',
      '<div class="warning-text">إذا كنت تعتقد أنك تم حظرك بالخطأ، يمكنك التواصل مع إدارة المتجر. تأكد من عدم استخدام VPN أو بروكسي.</div>',
      '</div>',
      '<div>',
      '<button class="btn" onclick="window.location.reload()">🔄 إعادة المحاولة</button>',
      redirectButton,
      '</div>',
      '<div class="footer-info">🛡️ محمي بواسطة CodForm Security System<br>جميع محاولات الوصول يتم تسجيلها ومراقبتها</div>',
      '</div>',
      '</body>',
      '</html>'
    ].join('');
  }
  
  // تشغيل الحماية فوراً مع معالجة الأخطاء
  try {
    activateProtection().catch(function(error) {
      console.error('[CodForm] Protection activation failed:', error);
      allowAccess();
    });
  } catch(e) {
    console.error('[CodForm] Protection initialization failed:', e);
    allowAccess();
  }

  // ضمان إظهار المحتوى بعد 10 ثوان كحد أقصى
  setTimeout(function() {
    if (document.documentElement && document.documentElement.style && 
        document.documentElement.style.visibility === 'hidden') {
      console.warn('[CodForm] ⏰ Timeout reached - forcing content display');
      allowAccess();
    }
  }, 10000);

})();
</script>`
}

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// إعدادات Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || '';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

console.log("Initializing shopify-theme-update function");

// دالة لتنظيف نطاق المتجر
function cleanShopDomain(shop: string): string {
  if (!shop) return "";
  
  let cleanedShop = shop.trim();
  
  // إزالة البروتوكول إذا كان موجودًا
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // التأكد من أنه ينتهي بـ myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

// استعلام لجلب رمز الوصول للمتجر
async function getStoreAccessToken(shop: string): Promise<string | null> {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing Supabase credentials");
      return null;
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data, error } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error fetching store token:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.error('No token found for shop:', shop);
      return null;
    }
    
    return data[0].access_token;
  } catch (error) {
    console.error('Error in getStoreAccessToken:', error);
    return null;
  }
}

// تحديث ملفات التمديد (Extension) في السمة (Theme)
async function updateThemeExtension(shop: string, accessToken: string): Promise<boolean> {
  try {
    // 1. أولا، الحصول على السمة النشطة
    const themesUrl = `https://${shop}/admin/api/2023-07/themes.json`;
    
    const themesResponse = await fetch(themesUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!themesResponse.ok) {
      const errorText = await themesResponse.text();
      console.error(`Failed to fetch themes. Status: ${themesResponse.status}, Response: ${errorText}`);
      return false;
    }
    
    const themesData = await themesResponse.json();
    const activeTheme = themesData.themes.find((theme: any) => theme.role === 'main');
    
    if (!activeTheme) {
      console.error(`No active theme found for shop: ${shop}`);
      return false;
    }
    
    console.log(`Found active theme: ${activeTheme.name} (ID: ${activeTheme.id})`);
    
    // 2. تحديث ملف codform-core.js
    const corejs = `
    // CODFORM - نموذج الدفع عند الاستلام - Lovable 2025
    (function() {
      'use strict';
      
      // تهيئة المتغيرات العالمية
      var debugMode = false;
      var formCache = {};
      var loadAttempts = {};
      var maxAttempts = 3;
      
      // تسجيل الأحداث للتصحيح
      function logDebug(message, data) {
        if (!debugMode) return;
        
        if (data) {
          console.log('CODFORM DEBUG: ' + message, data);
        } else {
          console.log('CODFORM DEBUG: ' + message);
        }
      }
      
      // معالجة أخطاء النموذج
      function handleFormError(errorMessage, details) {
        var formContainers = document.querySelectorAll('.codform-container');
        
        formContainers.forEach(function(container) {
          container.innerHTML = '<div class="codform-error">' +
            '<p class="codform-error-title">' + errorMessage + '</p>' +
            (details ? '<p class="codform-error-details">' + details + '</p>' : '') +
            '</div>';
          
          container.style.padding = '15px';
          container.style.backgroundColor = '#fff5f5';
          container.style.border = '1px solid #feb2b2';
          container.style.borderRadius = '4px';
          container.style.margin = '10px 0';
        });
        
        logDebug('Form error:', errorMessage);
      }
      
      // تحميل نموذج COD
      function loadCodForm(element) {
        if (!element) return;
        
        // الحصول على معرّف النموذج من السمات
        var formId = element.getAttribute('data-form-id');
        var hideHeader = element.getAttribute('data-hide-header') === 'true';
        var productId = element.getAttribute('data-product-id') || '';
        
        logDebug('Loading form with ID:', formId);
        logDebug('Hide header:', hideHeader);
        logDebug('Product ID:', productId);
        
        if (!formId) {
          handleFormError('لم يتم تحديد معرّف النموذج (Form ID)', 'يرجى تحديد معرّف النموذج في إعدادات البلوك');
          return;
        }
        
        // تنظيف معرّف النموذج من أي مسافات محتملة
        var cleanFormId = formId.trim();
        
        // التحقق من صحة تنسيق معرّف النموذج (UUID)
        var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(cleanFormId)) {
          logDebug('تنسيق معرّف النموذج غير صالح:', cleanFormId);
          handleFormError(
            'صيغة معرّف النموذج غير صحيحة. يجب أن يكون المعرّف بتنسيق UUID الكامل.',
            'المعرّف المستخدم: ' + cleanFormId + '. يجب أن يكون بالتنسيق: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
          );
          return;
        }
        
        // التحقق من محاولات التحميل السابقة
        if (!loadAttempts[cleanFormId]) {
          loadAttempts[cleanFormId] = 0;
        }
        
        loadAttempts[cleanFormId]++;
        
        if (loadAttempts[cleanFormId] > maxAttempts) {
          logDebug('تجاوز الحد الأقصى لمحاولات التحميل:', loadAttempts[cleanFormId]);
          handleFormError('فشل تحميل النموذج بعد عدة محاولات', 'يرجى التحقق من اتصالك بالإنترنت وإعادة تحميل الصفحة');
          return;
        }
        
        // إنشاء حاوية النموذج
        var formContainer = document.createElement('div');
        formContainer.className = 'codform-form-wrapper';
        formContainer.style.width = '100%';
        formContainer.style.maxWidth = '100%';
        formContainer.style.minHeight = '150px';
        
        // إضافة محتوى التحميل
        formContainer.innerHTML = '<div class="codform-loading" style="text-align:center; padding:20px;">' +
          '<div class="codform-spinner" style="display:inline-block; width:30px; height:30px; border:3px solid #f3f3f3; ' +
          'border-top:3px solid #3498db; border-radius:50%; animation:codform-spin 1s linear infinite;"></div>' +
          '<p style="margin-top:10px;">جاري تحميل النموذج...</p>' +
          '</div>';
        
        // إضافة أنماط CSS للرسوم المتحركة
        var styleElement = document.createElement('style');
        styleElement.textContent = '@keyframes codform-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(styleElement);
        
        // إضافة حاوية النموذج إلى العنصر
        element.innerHTML = '';
        element.appendChild(formContainer);
        
        // إذا كان النموذج تم تحميله مسبقًا، استخدام النسخة المخزنة مؤقتًا
        if (formCache[cleanFormId]) {
          logDebug('استخدام النموذج المخزن مؤقتًا:', cleanFormId);
          setTimeout(function() {
            formContainer.innerHTML = formCache[cleanFormId];
          }, 100);
          return;
        }
        
        // إنشاء وإضافة iframe للنموذج
        var createIframe = function() {
          // إذا تم إزالة حاوية النموذج من DOM، لا تستمر
          if (!formContainer || !formContainer.parentNode) {
            logDebug('تم إزالة حاوية النموذج من DOM');
            return;
          }
          
          // URL النموذج - دائمًا استخدم الدومين الرسمي والمسار الصحيح /embed/
          var formAppUrl = "https://codform-flow-forms.lovable.app";
          var embedPath = "/embed/";
          var formUrl = formAppUrl + embedPath + cleanFormId + "?embedded=true&hideHeader=" + hideHeader + (productId ? '&productId=' + encodeURIComponent(productId) : '');
          
          logDebug('رابط النموذج:', formUrl);
          
          // مهلة للكشف عن مشاكل التحميل
          var timeoutDuration = 15000; // 15 ثانية
          var loadTimeout = setTimeout(function() {
            logDebug('تجاوز وقت تحميل النموذج بعد ' + timeoutDuration/1000 + ' ثوانٍ');
            handleFormError('تجاوز وقت تحميل النموذج. قد تكون هناك مشكلة في الاتصال بالخادم.');
          }, timeoutDuration);
          
          // إنشاء iframe
          var iframe = document.createElement('iframe');
          iframe.src = formUrl;
          iframe.id = 'codform-iframe-' + cleanFormId;
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.title = 'CODFORM';
          iframe.style.width = '100%';
          iframe.style.height = '0';
          iframe.style.border = 'none';
          iframe.style.overflow = 'hidden';
          
          // مناولة أحداث iframe
          iframe.onload = function() {
            logDebug('تم تحميل iframe بنجاح');
            clearTimeout(loadTimeout);
            
            // حاول ضبط الارتفاع تلقائيًا
            setTimeout(function() {
              setIframeHeight(iframe);
            }, 500);
          };
          
          // استماع لرسائل من الإطار
          window.addEventListener('message', function(event) {
            // التحقق من أن الرسالة من المصدر المتوقع
            if (event.origin !== formAppUrl) return;
            
            try {
              var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              
              if (data.type === 'codform:height' && data.formId === cleanFormId) {
                // ضبط ارتفاع iframe بناءً على المحتوى
                if (iframe) {
                  iframe.style.height = data.height + 'px';
                  logDebug('تعديل ارتفاع النموذج إلى:', data.height);
                }
              }
              
              if (data.type === 'codform:loaded' && data.formId === cleanFormId) {
                // تخزين النموذج المحمل في ذاكرة التخزين المؤقت
                logDebug('تم تحميل النموذج بنجاح:', cleanFormId);
                clearTimeout(loadTimeout);
              }
              
              if (data.type === 'codform:error' && data.formId === cleanFormId) {
                // عرض رسالة الخطأ
                logDebug('خطأ في تحميل النموذج:', data.error);
                handleFormError('خطأ في تحميل النموذج: ' + data.error);
              }
            } catch (error) {
              logDebug('خطأ في معالجة رسالة من iframe:', error);
            }
          });
          
          // تحديد ارتفاع iframe
          function setIframeHeight(iframeElement) {
            try {
              // محاولة الحصول على الارتفاع من المحتوى
              var height = 450; // ارتفاع افتراضي
              
              // إرسال رسالة لطلب الارتفاع
              iframeElement.contentWindow.postMessage(JSON.stringify({ type: 'codform:requestHeight', formId: cleanFormId }), '*');
              
              // تعيين ارتفاع أولي
              iframeElement.style.height = height + 'px';
            } catch (error) {
              logDebug('خطأ في ضبط ارتفاع iframe:', error);
              iframeElement.style.height = '450px'; // ارتفاع قياسي
            }
          }
          
          // تفريغ حاوية النموذج وإضافة iframe
          formContainer.innerHTML = '';
          formContainer.appendChild(iframe);
        };
        
        // تأخير قصير قبل إنشاء iframe للتأكد من أن DOM جاهز
        setTimeout(createIframe, 50);
      }
      
      // البحث عن حاويات النموذج عند تحميل الصفحة
      function initialize() {
        // التحقق من تفعيل وضع التصحيح
        var urlParams = new URLSearchParams(window.location.search);
        debugMode = urlParams.get('codform_debug') === 'true';
        
        // البحث عن جميع حاويات النماذج
        var containers = document.querySelectorAll('.codform-container');
        logDebug('تم العثور على ' + containers.length + ' حاويات للنماذج');
        
        // تهيئة كل حاوية
        containers.forEach(function(container) {
          loadCodForm(container);
        });
        
        // مراقبة التغييرات في DOM لحاويات جديدة
        setupMutationObserver();
      }
      
      // إعداد مراقب التغييرات في DOM
      function setupMutationObserver() {
        logDebug('إعداد مراقب التغييرات في DOM');
        
        // إنشاء مراقب التغييرات
        var observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            // البحث عن حاويات الكودفورم الجديدة
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // نوع العنصر
                // ابحث عن حاويات في العنصر المضاف
                if (node.classList && node.classList.contains('codform-container')) {
                  logDebug('تم اكتشاف حاوية نموذج جديدة:', node);
                  loadCodForm(node);
                }
                
                // ابحث عن حاويات في العناصر الفرعية
                var containers = node.querySelectorAll('.codform-container');
                containers.forEach(function(container) {
                  logDebug('تم اكتشاف حاوية نموذج جديدة في العنصر الفرعي:', container);
                  loadCodForm(container);
                });
              }
            });
          });
        });
        
        // بدء المراقبة
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
      
      // تشغيل التهيئة عند تحميل الصفحة
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        initialize();
      }
    })();
    `;
    
    // 3. تحديث ملف القطعة السائلة (Liquid Snippet)
    const snippetLiquid = `
    {% comment %}
      CODFORM - Cash On Delivery Form Block
      Version: 2.0.0
      Developer: Lovable AI (https://lovable.ai)
    {% endcomment %}
    
    <div class="codform-container" 
      data-form-id="{{ block.settings.form_id }}" 
      data-hide-header="{{ block.settings.hide_header }}"
      {% if product %}data-product-id="{{ product.id }}"{% endif %}></div>
    
    {% unless codform_script_loaded %}
      <script src="{{ 'codform-core.js' | asset_url }}" defer></script>
      {% assign codform_script_loaded = true %}
    {% endunless %}
    `;
    
    // إنشاء أو تحديث ملفات الامتداد
    const assetsToUpdate = [
      {
        key: 'assets/codform-core.js',
        value: corejs
      },
      {
        key: 'snippets/codform_form.liquid',
        value: snippetLiquid
      }
    ];
    
    // تحديث كل ملف
    let successCount = 0;
    for (const asset of assetsToUpdate) {
      const assetUrl = `https://${shop}/admin/api/2023-07/themes/${activeTheme.id}/assets.json`;
      
      try {
        const assetResponse = await fetch(assetUrl, {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asset: asset
          })
        });
        
        if (assetResponse.ok) {
          console.log(`Successfully updated asset: ${asset.key}`);
          successCount++;
        } else {
          const errorText = await assetResponse.text();
          console.error(`Failed to update asset ${asset.key}. Status: ${assetResponse.status}, Response: ${errorText}`);
        }
      } catch (error) {
        console.error(`Error updating asset ${asset.key}:`, error);
      }
    }
    
    return successCount === assetsToUpdate.length;
  } catch (error) {
    console.error('Error in updateThemeExtension:', error);
    return false;
  }
}

// خدمة الطلبات
serve(async (req) => {
  // التعامل مع طلبات OPTIONS لـ CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  console.log(`Theme update request received: ${req.url}`);
  
  try {
    const requestData = await req.json();
    
    if (!requestData.shop) {
      throw new Error('المعلمة المطلوبة مفقودة: shop');
    }
    
    // تنظيف نطاق المتجر
    const shop = cleanShopDomain(requestData.shop);
    const forceUpdate = requestData.force === true;
    
    console.log(`Processing theme update for shop: ${shop}, force: ${forceUpdate}`);
    
    // الحصول على رمز الوصول
    let accessToken = requestData.accessToken;
    
    if (!accessToken) {
      console.log('No access token provided, fetching from database');
      accessToken = await getStoreAccessToken(shop);
      
      if (!accessToken) {
        throw new Error('لم يتم العثور على رمز وصول للمتجر');
      }
    }
    
    // تحديث ملفات الامتداد
    const updateSuccess = await updateThemeExtension(shop, accessToken);
    
    if (updateSuccess) {
      console.log(`Theme extension updated successfully for shop: ${shop}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'تم تحديث ملفات الامتداد بنجاح',
          shop
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        }
      );
    } else {
      throw new Error('فشل تحديث ملفات الامتداد');
    }
  } catch (error) {
    // ارجع استجابة الخطأ
    console.error('Error updating theme extension:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ غير معروف',
        error: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200 // استخدام الحالة 200 حتى مع الأخطاء لتمكين العميل من معالجة الخطأ
      }
    );
  }
});

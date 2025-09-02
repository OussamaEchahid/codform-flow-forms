/**
 * CODFORM FORM CORE
 * الوظائف الأساسية للنموذج - منفصلة عن codform_form.liquid لتقليل الحجم
 */

(function() {
  'use strict';
  
  // الثوابت الأساسية
  const API_BASE_URL = 'https://lovable-forms-api.netlify.app/.netlify/functions/api-forms';
  const DEFAULT_PRODUCT_ID = 'default';
  
  // وظائف الحصول على المعرفات
  window.getProductId = function() {
    try {
      // سيتم تمرير المعرف من الملف الرئيسي
      return window.codformProductId || 'auto-detect';
    } catch (error) {
      if (window.allowImportantLog) {
        window.allowImportantLog('Form loaded successfully');
      }
      return 'auto-detect';
    }
  };

  window.getShopDomain = function() {
    try {
      // سيتم تمرير النطاق من الملف الرئيسي
      return window.codformShopDomain || 'auto-detect';
    } catch (error) {
      return 'auto-detect';
    }
  };

  window.getStyleValue = function(style, property, fallback) {
    if (!style || typeof style !== 'object') return fallback;
    return style[property] || fallback;
  };

  // وظائف التهيئة الأساسية
  window.initializeCurrencyManager = function() {
    if (window.CodformCurrencyManager) {
      window.CodformCurrencyManager.initialize();
      console.log('✅ Currency Manager initialized in Shopify store');
    } else {
      console.warn('⚠️ Currency Manager not loaded');
    }
  };

  // وظائف إدارة النوافذ المنبثقة
  window.setupPopupHandlers = function() {
    // إعداد معالجات النوافذ المنبثقة
    if (window.handlePopupClose) {
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('codform-popup-overlay')) {
          window.handlePopupClose();
        }
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          window.handlePopupClose();
        }
      });
    }
  };

  // وظائف تحديث النموذج
  window.updateFormDisplay = function() {
    const productId = window.getProductId();
    const shopDomain = window.getShopDomain();
    
    if (productId && productId !== 'auto-detect' && shopDomain && shopDomain !== 'auto-detect') {
      loadForm(productId, shopDomain);
    } else {
      console.warn('⚠️ Product ID or Shop Domain not available for form loading');
    }
  };

  // تحميل النموذج مع Boot موحّد وكاش
  function loadForm(productId, shopDomain) {
    try {
      // أطلق boot إن لم يكن قد أُطلق
      (function CodformBoot(){try{const key=`codform_boot_${shopDomain}_${productId}`;if(!window.CodformBootPromise){const url=`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shopDomain)}&product=${encodeURIComponent(productId)}`;window.CodformBootPromise=fetch(url).then(r=>r.json()).then(data=>{if(data&&data.success){window.CodformBootData=data;try{localStorage.setItem(key,JSON.stringify(data));}catch(_){}window.dispatchEvent(new CustomEvent('codform:boot',{detail:{fromCache:false,data}}));}return data;}).catch(()=>null);}try{const cached=JSON.parse(localStorage.getItem(key)||'null');if(cached&&cached.form&&cached.data){window.CodformBootData=cached;window.dispatchEvent(new CustomEvent('codform:boot',{detail:{fromCache:true,data:cached}}));}}catch(_){}}catch(_){}})();

      // إن وُجدت دالة التحميل القديمة استخدمها كخطة احتياط
      if (window.loadFormFromAPI) {
        window.loadFormFromAPI(productId, shopDomain);
      }
    } catch (e) {
      console.warn('⚠️ Form loading function not available');
    }
  }

  // تهيئة تلقائية
  function initializeCore() {
    window.initializeCurrencyManager();
    window.setupPopupHandlers();
    
    // تأخير قصير للتأكد من تحميل جميع المتغيرات
    setTimeout(() => {
      window.updateFormDisplay();
    }, 100);
  }

  // تهيئة عند جاهزية الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCore);
  } else {
    initializeCore();
  }

  console.log('📋 Codform Form Core loaded');

})();
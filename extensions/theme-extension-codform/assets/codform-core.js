
/**
 * CODFORM - نظام نماذج الدفع عند الاستلام
 * هذا الملف يحتوي على الكود الأساسي لعمل النماذج في المتجر
 */

(function() {
  // عند تحميل الصفحة، ابحث عن جميع النماذج وقم بتهيئتها
  document.addEventListener('DOMContentLoaded', function() {
    // البحث عن جميع حاويات النماذج في الصفحة
    const containers = document.querySelectorAll('.codform-container');
    
    if (containers.length === 0) {
      console.log('CODFORM: لم يتم العثور على أي نماذج في الصفحة');
      return;
    }
    
    console.log(`CODFORM: تم العثور على ${containers.length} نموذج، جاري التهيئة...`);
    
    containers.forEach(function(container) {
      initializeForm(container);
    });
  });
  
  // وظيفة تهيئة النموذج
  function initializeForm(container) {
    // الحصول على المعرفات والبيانات
    const blockId = container.id.replace('codform-container-', '');
    const formId = container.getAttribute('data-form-id');
    const productId = container.getAttribute('data-product-id');
    const hideHeader = container.getAttribute('data-hide-header') === 'true';
    
    // تعريف المعرفات الكاملة للعناصر
    const loaderId = `codform-form-loader-${blockId}`;
    const formContainerId = `codform-form-${blockId}`;
    const errorContainerId = `codform-error-${blockId}`;
    const errorMessageId = `codform-error-message-${blockId}`;
    const errorDetailsId = `codform-error-details-${blockId}`;
    const retryButtonId = `codform-retry-${blockId}`;
    const successContainerId = `codform-success-${blockId}`;
    
    // البحث عن العناصر
    const loader = document.getElementById(loaderId);
    const formContainer = document.getElementById(formContainerId);
    const errorContainer = document.getElementById(errorContainerId);
    const errorMessage = document.getElementById(errorMessageId);
    const errorDetails = document.getElementById(errorDetailsId);
    const successContainer = document.getElementById(successContainerId);
    
    // وظيفة لإضافة معلومات التصحيح إلى وحدة التحكم
    function logDebug(message, data) {
      console.log(`CODFORM [${blockId}]: ${message}`, data || '');
    }
    
    // وظيفة للتحقق من وجود عنصر
    function ensureElement(element, id) {
      if (!element) {
        logDebug(`عنصر غير موجود: ${id}`);
        return false;
      }
      return true;
    }
    
    // التحقق من العناصر الأساسية
    if (!ensureElement(loader, loaderId) || 
        !ensureElement(formContainer, formContainerId) || 
        !ensureElement(errorContainer, errorContainerId)) {
      logDebug('فشل العثور على العناصر الأساسية، توقف التنفيذ');
      return;
    }
    
    // الحصول على زر إعادة المحاولة أو إنشائه إذا لم يكن موجوداً
    let retryButton = document.getElementById(retryButtonId);
    if (!retryButton && errorContainer) {
      retryButton = document.createElement('button');
      retryButton.id = retryButtonId;
      retryButton.className = 'codform-button';
      retryButton.textContent = 'إعادة المحاولة';
      errorContainer.appendChild(retryButton);
    }
    
    // التحقق من معرّف النموذج
    logDebug('بدء تهيئة النموذج', { formId, productId });
    
    if (!formId || formId.trim() === '') {
      logDebug('معرّف النموذج مفقود في إعدادات البلوك');
      handleFormError('لم يتم تعيين معرّف النموذج. يرجى إضافة معرّف النموذج في إعدادات البلوك.');
      return;
    }
    
    // تنظيف معرّف النموذج من أي مسافات محتملة
    const cleanFormId = formId.trim();
    
    // التحقق من صحة تنسيق معرّف النموذج (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanFormId)) {
      logDebug(`تنسيق معرّف النموذج غير صالح: ${cleanFormId}`);
      handleFormError(
        'صيغة معرّف النموذج غير صحيحة. يجب أن يكون المعرّف بتنسيق UUID الكامل.',
        `المعرّف المستخدم: ${cleanFormId}. يجب أن يكون بالتنسيق: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
      );
      return;
    }
    
    // تتبع محاولات التحميل
    let loadAttempts = parseInt(localStorage.getItem(`codform_load_attempts_${blockId}`) || '0');
    const maxAttempts = 3;
    
    loadAttempts++;
    localStorage.setItem(`codform_load_attempts_${blockId}`, loadAttempts.toString());
    
    // إعادة ضبط المحاولات بعد ساعة
    setTimeout(function() {
      localStorage.removeItem(`codform_load_attempts_${blockId}`);
    }, 60 * 60 * 1000);
    
    // وظيفة معالجة أخطاء النموذج
    function handleFormError(message, details) {
      logDebug(`حدث خطأ: ${message}`);
      
      if (loader) {
        loader.style.display = 'none';
      }
      
      if (errorContainer) {
        errorContainer.style.display = 'block';
        
        if (errorMessage) {
          errorMessage.textContent = message || 'حدث خطأ أثناء تحميل النموذج. يرجى المحاولة مرة أخرى.';
        }
        
        if (errorDetails && details) {
          errorDetails.textContent = details;
          errorDetails.style.display = 'block';
        }
      }
      
      // إظهار زر إعادة المحاولة
      if (retryButton) {
        if (loadAttempts < maxAttempts) {
          retryButton.textContent = `إعادة المحاولة (${loadAttempts}/${maxAttempts})`;
          retryButton.style.display = 'inline-block';
        } else {
          retryButton.textContent = 'تحديث الصفحة';
        }
      }
    }
    
    // وظيفة تحميل النموذج
    function loadForm() {
      logDebug('بدء محاولة تحميل النموذج');
      
      // إخفاء أي أخطاء سابقة وإظهار شاشة التحميل
      if (errorContainer) {
        errorContainer.style.display = 'none';
      }
      
      if (successContainer) {
        successContainer.style.display = 'none';
      }
      
      if (loader) {
        loader.style.display = 'flex';
      }
      
      if (formContainer) {
        formContainer.style.display = 'none';
      }
      
      // URL النموذج - دائمًا استخدم الدومين الرسمي والمسار الصحيح /embed/
      const formAppUrl = "https://codform-flow-forms.lovable.app";
      const embedPath = "/embed/";
      const formUrl = `${formAppUrl}${embedPath}${cleanFormId}?embedded=true&hideHeader=${hideHeader}${productId ? '&productId=' + encodeURIComponent(productId) : ''}`;
      
      logDebug('رابط النموذج:', formUrl);
      
      // مهلة للكشف عن مشاكل التحميل
      const timeoutDuration = 15000; // 15 ثانية
      let loadTimeout = setTimeout(function() {
        logDebug(`تجاوز وقت تحميل النموذج بعد ${timeoutDuration/1000} ثوانٍ`);
        handleFormError('تجاوز وقت تحميل النموذج. قد تكون هناك مشكلة في الاتصال بالخادم.');
      }, timeoutDuration);
      
      // وظيفة نجاح تحميل النموذج
      function onFormLoaded() {
        clearTimeout(loadTimeout);
        logDebug('تم تحميل النموذج بنجاح');
        
        if (loader) {
          loader.style.display = 'none';
        }
        
        if (formContainer) {
          formContainer.style.display = 'block';
        }
        
        // إعادة ضبط عداد المحاولات
        localStorage.removeItem(`codform_load_attempts_${blockId}`);
      }
      
      try {
        // إنشاء إطار iframe للنموذج
        const iframe = document.createElement('iframe');
        iframe.src = formUrl;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        iframe.style.overflowY = 'auto';
        iframe.setAttribute('title', 'نموذج الدفع عند الاستلام');
        iframe.setAttribute('id', `codform-iframe-${blockId}`);
        iframe.onload = onFormLoaded;
        
        // مسح المحتوى السابق وإضافة الإطار الجديد
        if (formContainer) {
          formContainer.innerHTML = '';
          formContainer.appendChild(iframe);
        }
        
        logDebug('تم إنشاء iframe للنموذج');
      } catch (e) {
        clearTimeout(loadTimeout);
        logDebug('خطأ أثناء تهيئة النموذج:', e);
        handleFormError(e.message || 'حدث خطأ أثناء تهيئة النموذج');
      }
    }
    
    // إضافة مستمع لزر إعادة المحاولة
    if (retryButton) {
      retryButton.addEventListener('click', function() {
        logDebug('تم النقر على زر إعادة المحاولة');
        
        if (loadAttempts >= maxAttempts) {
          window.location.reload();
          return;
        }
        
        loadForm();
      });
    }
    
    // إضافة مستمع لرسائل من النموذج
    window.addEventListener('message', function(event) {
      // التحقق من أمان المصدر
      if (event.origin !== 'https://codform-flow-forms.lovable.app' && 
          event.origin !== 'https://mtyfuwdsshlzqwjujavp.supabase.co') {
        return;
      }
      
      logDebug('تم استلام رسالة من النموذج:', event.data);
      
      // معالجة أحداث النموذج
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'codform:loaded':
            onFormLoaded();
            break;
            
          case 'codform:submitted':
            logDebug('تم إرسال النموذج بنجاح');
            
            if (formContainer) {
              formContainer.style.display = 'none';
            }
            
            if (successContainer) {
              successContainer.style.display = 'block';
            }
            break;
            
          case 'codform:error':
            logDebug('تم استلام خطأ من النموذج:', event.data.error);
            handleFormError(event.data.error || 'حدث خطأ في النموذج');
            break;
        }
      }
    });
    
    // بدء تحميل النموذج تلقائيًا
    loadForm();
  }
})();

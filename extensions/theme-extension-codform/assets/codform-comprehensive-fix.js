
/**
 * CODFORM COMPREHENSIVE FIX - Enhanced Quantity Offers Handler v4.0
 * حل شامل نهائي لإصلاح عرض quantity offers وإدارة النماذج
 */

(function() {
  'use strict';
  
  console.log("🚀 COMPREHENSIVE FIX v4.0 - Loading final enhanced handler");

  // تأكد من أن النص موجه لليمين للعربية
  const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

  // دالة عرض quantity offers محسنة ونهائية - مع ضمان الظهور داخل النموذج
  function displayQuantityOffers(quantityOffersData, blockId, productId) {
    console.log("🎁 COMPREHENSIVE FIX v4.0 - Displaying quantity offers:", quantityOffersData);
    
    if (!quantityOffersData) {
      console.log("❌ No quantity offers data provided");
      return false;
    }

    // تنظيف شامل لجميع العروض الموجودة في الصفحة لمنع التكرار
    const allExistingOffers = document.querySelectorAll(
      '.quantity-offers-list, .codform-quantity-offers-wrapper, .quantity-offer-item, [class*="quantity-offer"], [id*="quantity-offers"]'
    );
    
    if (allExistingOffers.length > 0) {
      console.log(`🧹 Removing ${allExistingOffers.length} existing offers to prevent duplication`);
      allExistingOffers.forEach(element => {
        element.remove();
      });
    }

    // التحقق من بنية البيانات المحسنة
    let offers = [];
    let styling = {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      tagColor: '#22c55e', 
      priceColor: '#ef4444'
    };
    let position = 'inside_form'; // فرض الموضع داخل النموذج

    // استخراج البيانات بطريقة أكثر مرونة
    if (quantityOffersData.offers && Array.isArray(quantityOffersData.offers)) {
      offers = quantityOffersData.offers;
      styling = quantityOffersData.styling || styling;
      position = quantityOffersData.position || 'inside_form';
      console.log("✅ Found offers in structured data:", offers.length);
    } else if (Array.isArray(quantityOffersData)) {
      offers = quantityOffersData;
      console.log("✅ Found offers as direct array:", offers.length);
    } else {
      console.log("❌ Unexpected data structure:", typeof quantityOffersData);
      return false;
    }
    
    if (!offers.length) {
      console.log("❌ No offers found in data");
      return false;
    }

    // البحث عن حاوي النموذج الرئيسي
    const formContainer = document.getElementById(`codform-container-${blockId}`);
    if (!formContainer) {
      console.error("❌ Form container not found:", `codform-container-${blockId}`);
      return false;
    }

    console.log("✅ Form container found, creating offers container inside it");

    // إنشاء حاوي العروض داخل النموذج مباشرة
    let offersContainer = document.getElementById(`quantity-offers-inside-${blockId}`);
    if (!offersContainer) {
      offersContainer = document.createElement('div');
      offersContainer.id = `quantity-offers-inside-${blockId}`;
      offersContainer.className = 'quantity-offers-container-inside-form';
      
      // البحث عن أفضل مكان لوضع العروض داخل النموذج
      const formTitle = formContainer.querySelector('.form-title-field, [data-field-type="form-title"]');
      const firstField = formContainer.querySelector('.mb-4:not(.form-title-field), [class*="field"]:not([data-field-type="form-title"])');
      
      if (formTitle && firstField) {
        // وضع العروض بين العنوان والحقل الأول
        formTitle.parentNode.insertBefore(offersContainer, firstField);
        console.log("📍 Placed offers between title and first field");
      } else if (firstField) {
        // وضع العروض قبل أول حقل
        firstField.parentNode.insertBefore(offersContainer, firstField);
        console.log("📍 Placed offers before first field");
      } else {
        // وضع العروض في بداية النموذج
        formContainer.insertBefore(offersContainer, formContainer.firstChild);
        console.log("📍 Placed offers at form beginning");
      }
    }

    // تنظيف الحاوي وإعداده
    offersContainer.innerHTML = '';
    offersContainer.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      margin: 20px 0;
      position: relative;
      z-index: 1;
    `;

    console.log(`🎨 Using styling:`, styling);
    console.log(`🔢 Rendering ${offers.length} offers inside form`);

    // إنشاء wrapper للعروض بتصميم متطابق مع المعاينة
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-2 mb-4';
    wrapper.style.cssText = `
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: ltr;
      text-align: left;
      margin: 0 0 16px 0;
      padding: 0;
    `;

    offers.forEach((offer, index) => {
      console.log(`🎁 Processing offer ${index + 1}:`, offer);
      
      const isHighlighted = index === 1; // تمييز العرض الثاني
      
      const offerElement = document.createElement('div');
      offerElement.className = 'p-3 rounded-lg border-2 flex items-center justify-between transition-all cursor-pointer hover:shadow-md';
      offerElement.style.cssText = `
        padding: 12px;
        border-radius: 8px;
        border-width: 2px;
        border-style: solid;
        border-color: ${isHighlighted ? '#22c55e' : '#d1d5db'};
        background: ${isHighlighted ? '#f0fdf4' : '#ffffff'};
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        box-shadow: ${isHighlighted ? '0 1px 3px 0 rgba(34, 197, 94, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'};
        transition: all 0.3s ease;
        cursor: pointer;
      `;

      // تأثير hover
      offerElement.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.boxShadow = isHighlighted ? '0 1px 3px 0 rgba(34, 197, 94, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
      });

      // الجزء الأيسر - الأيقونة والمحتوى
      const leftContent = document.createElement('div');
      leftContent.className = 'flex items-center space-x-3';
      leftContent.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
      `;

      // الأيقونة
      const iconContainer = document.createElement('div');
      iconContainer.className = 'w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center';
      iconContainer.style.cssText = `
        width: 48px;
        height: 48px;
        background-color: #f3f4f6;
        border-radius: 8px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      iconContainer.innerHTML = `
        <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20" style="width: 32px; height: 32px; color: #9ca3af;">
          <path fill-rule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clip-rule="evenodd" />
        </svg>
      `;

      // المحتوى النصي
      const textContainer = document.createElement('div');
      
      const mainText = document.createElement('div');
      mainText.className = 'font-semibold';
      mainText.style.cssText = `
        font-weight: 600;
        color: ${styling.textColor || '#1f2937'};
        margin-bottom: 4px;
        font-size: 15px;
        line-height: 1.3;
      `;
      mainText.textContent = offer.text || `اشترِ ${offer.quantity} واحصل على ${offer.quantity} مجاناً`;

      const tagContainer = document.createElement('div');
      if (offer.tag) {
        const tagElement = document.createElement('div');
        tagElement.className = 'inline-block px-2 py-1 rounded text-xs font-medium text-white mt-1';
        tagElement.style.cssText = `
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          background-color: ${styling.tagColor || '#22c55e'};
          margin-top: 4px;
        `;
        tagElement.textContent = offer.tag;
        tagContainer.appendChild(tagElement);
      }

      textContainer.appendChild(mainText);
      textContainer.appendChild(tagContainer);
      leftContent.appendChild(iconContainer);
      leftContent.appendChild(textContainer);

      // الجزء الأيمن - السعر
      const rightContent = document.createElement('div');
      rightContent.className = 'text-right';
      rightContent.style.cssText = `
        text-align: right;
        margin-left: 12px;
      `;

      // حساب السعر
      const basePrice = 100; // سعر افتراضي
      let totalPrice = basePrice * offer.quantity;
      const originalPrice = basePrice * offer.quantity;
      const isDiscounted = offer.discountType && offer.discountType !== 'none' && offer.discountValue > 0;

      if (isDiscounted) {
        if (offer.discountType === 'fixed') {
          totalPrice = originalPrice - offer.discountValue;
        } else if (offer.discountType === 'percentage') {
          const discount = (originalPrice * offer.discountValue) / 100;
          totalPrice = originalPrice - discount;
        }

        // عرض السعر الأصلي مشطوب
        const originalPriceElement = document.createElement('div');
        originalPriceElement.className = 'text-sm line-through text-gray-400';
        originalPriceElement.style.cssText = `
          font-size: 14px;
          color: #9ca3af;
          text-decoration: line-through;
          margin-bottom: 2px;
        `;
        originalPriceElement.textContent = `$${originalPrice.toFixed(2)}`;
        rightContent.appendChild(originalPriceElement);
      }

      const finalPriceElement = document.createElement('div');
      finalPriceElement.className = 'font-bold text-lg';
      finalPriceElement.style.cssText = `
        font-weight: 700;
        font-size: 18px;
        color: ${styling.priceColor || '#1f2937'};
      `;
      finalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
      rightContent.appendChild(finalPriceElement);

      // تجميع العناصر
      offerElement.appendChild(leftContent);
      offerElement.appendChild(rightContent);
      wrapper.appendChild(offerElement);
    });

    // إضافة العناصر للحاوي لكن إخفاؤها في البداية
    offersContainer.appendChild(wrapper);
    
    // إخفاء العروض تماماً حتى يكتمل تحميل النموذج
    offersContainer.style.cssText += `
      opacity: 0 !important;
      visibility: hidden !important;
      transform: translateY(20px);
      transition: all 0.5s ease-out;
    `;

    console.log("✅ Offers rendered but hidden, waiting for form completion");

    return offersContainer;
  }

  // دالة تحميل البيانات من API محسنة ونهائية
  async function loadFormAndOffers(blockId) {
    console.log("🔍 COMPREHENSIVE FIX v4.0 - Loading form and offers for block:", blockId);
    
    try {
      const container = document.getElementById(`codform-container-${blockId}`);
      if (!container) {
        throw new Error(`Container not found: codform-container-${blockId}`);
      }

      const productId = container.getAttribute('data-product-id');
      const shop = window.Shopify?.shop || window.location.hostname.replace('www.', '');

      if (!productId || !shop) {
        throw new Error(`Missing data - productId: ${productId}, shop: ${shop}`);
      }

      console.log("📊 API Request details:", { shop, productId, blockId });

      const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}&blockId=${encodeURIComponent(blockId)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📦 API Response received:", data);

      // عرض quantity offers إذا كانت موجودة
      if (data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
        console.log("🎁 Processing quantity offers with", data.quantity_offers.offers.length, "offers");
        
        // عرض العروض داخل النموذج وإرجاع الحاوي
        const offersContainer = displayQuantityOffers(data.quantity_offers, blockId, productId);
        
        if (offersContainer) {
          console.log("🎉 Offers container created successfully, now showing with smooth animation");
          
          // إظهار العروض بعد تأخير قصير لضمان استقرار النموذج
          setTimeout(() => {
            offersContainer.style.opacity = '1';
            offersContainer.style.visibility = 'visible';
            offersContainer.style.transform = 'translateY(0)';
            console.log("✅ Offers now visible with smooth animation");
          }, 300);
        } else {
          console.warn("⚠️ Failed to create offers container");
        }
      } else {
        console.log("ℹ️ No quantity offers found or offers array is empty");
      }

      return {
        success: true,
        data: data,
        hasOffers: !!(data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0)
      };

    } catch (error) {
      console.error("❌ COMPREHENSIVE FIX v4.0 - Error loading data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // دالة التشخيص المطورة
  function debugComprehensiveFix(blockId, productId) {
    console.log("🔧 COMPREHENSIVE FIX v4.0 - Enhanced debug mode activated");
    
    const container = document.getElementById(`codform-container-${blockId}`);
    
    console.log("🔍 Debug Information:", {
      blockId,
      productId,
      containerExists: !!container,
      shopifyShop: window.Shopify?.shop,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent
    });

    if (productId) {
      return loadFormAndOffers(blockId);
    } else if (container) {
      const detectedProductId = container.getAttribute('data-product-id');
      console.log("🎯 Using detected product ID:", detectedProductId);
      return loadFormAndOffers(blockId);
    } else {
      return Promise.resolve({ 
        success: false, 
        error: "No container or product ID found" 
      });
    }
  }

  // إتاحة الدوال عالمياً
  window.CodformComprehensiveFix = {
    displayOffers: displayQuantityOffers,
    loadData: loadFormAndOffers,
    debug: debugComprehensiveFix
  };

  // دالة تشخيص عامة محسنة
  window.debugCodformComprehensive = function(blockId, productId) {
    return debugComprehensiveFix(blockId, productId);
  };

  // دالة انتظار اكتمال تحميل النموذج
  function waitForFormToLoad(container) {
    return new Promise((resolve) => {
      // التحقق من وجود عناصر النموذج الأساسية
      const checkFormReady = () => {
        const formFields = container.querySelectorAll('input, textarea, select, button');
        const formContainer = container.querySelector('[class*="form"], form');
        const hasContent = container.children.length > 0;
        
        return formFields.length > 0 && formContainer && hasContent;
      };
      
      if (checkFormReady()) {
        console.log("✅ Form already loaded");
        resolve();
        return;
      }
      
      // مراقبة تغييرات DOM لحين اكتمال تحميل النموذج
      const observer = new MutationObserver((mutations) => {
        let formReady = false;
        
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches && (node.matches('input, textarea, select, button') || 
                  node.querySelector && node.querySelector('input, textarea, select, button'))) {
                formReady = true;
              }
            }
          });
        });
        
        if (formReady && checkFormReady()) {
          console.log("✅ Form loading completed, ready for offers");
          observer.disconnect();
          // تأخير إضافي قصير لضمان استقرار التخطيط
          setTimeout(resolve, 200);
        }
      });
      
      observer.observe(container, {
        childList: true,
        subtree: true
      });
      
      // timeout احتياطي
      setTimeout(() => {
        console.log("⏰ Form loading timeout, proceeding anyway");
        observer.disconnect();
        resolve();
      }, 3000);
    });
  }

  // تشغيل تلقائي محسن عند تحميل الصفحة
  async function initializeOffers() {
    console.log("🔄 COMPREHENSIVE FIX v4.0 - Initializing offers with proper timing...");
    
    const containers = document.querySelectorAll('[id*="codform-container-"]');
    console.log(`Found ${containers.length} form containers`);
    
    for (const container of containers) {
      const blockId = container.id.replace('codform-container-', '');
      const productId = container.getAttribute('data-product-id');
      
      if (blockId && productId) {
        console.log(`🔄 Waiting for form to load for container:`, { blockId, productId });
        
        try {
          // انتظار اكتمال تحميل النموذج أولاً
          await waitForFormToLoad(container);
          
          console.log(`✅ Form loaded, now loading offers for:`, { blockId, productId });
          
          // تحميل العروض بعد اكتمال النموذج
          await loadFormAndOffers(blockId);
          
        } catch (error) {
          console.error(`❌ Error initializing offers for ${blockId}:`, error);
        }
      } else {
        console.warn(`⚠️ Missing data for container:`, { blockId, productId });
      }
    }
  }

  // تشغيل التهيئة مع تأخيرات متدرجة لضمان تحميل DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeOffers, 1000);
    });
  } else {
    setTimeout(initializeOffers, 1000);
  }

  // أيضاً عند تحميل النافذة كاملة
  window.addEventListener('load', () => {
    setTimeout(initializeOffers, 1500);
  });

  // إضافة observer لمراقبة إضافة نماذج جديدة ديناميكياً
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.id && node.id.includes('codform-container-')) {
          const blockId = node.id.replace('codform-container-', '');
          const productId = node.getAttribute('data-product-id');
          
          if (blockId && productId) {
            console.log('🔄 New form detected, loading offers:', { blockId, productId });
            setTimeout(() => {
              loadFormAndOffers(blockId);
            }, 500);
          }
        }
      });
    });
  });

  // بدء مراقبة التغييرات
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log("✅ COMPREHENSIVE FIX v4.0 - Final enhanced handler loaded successfully with DOM observer");

})();


/**
 * CODFORM Quantity Offers Handler - FINAL FIX VERSION
 * معالج العروض الكمية - النسخة النهائية المصححة
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // نظام منع التكرار المحسن
  const processedOffers = new Set();
  const displayedContainers = new Set();

  // دالة التحقق من التكرار
  function isAlreadyProcessed(blockId, productId) {
    const key = `${blockId}-${productId}`;
    return processedOffers.has(key);
  }

  // دالة تسجيل المعالجة
  function markAsProcessed(blockId, productId) {
    const key = `${blockId}-${productId}`;
    processedOffers.add(key);
    console.log(`✅ FINAL FIX - Marked as processed: ${key}`);
  }

  // تنظيف شامل لجميع العروض
  function cleanupAllOffers() {
    console.log("🧹 FINAL FIX - Starting comprehensive cleanup...");
    
    const offerSelectors = [
      '.quantity-offers-container',
      '[id*="quantity-offers"]',
      '.codform-quantity-offers',
      '[class*="quantity-offers"]'
    ];
    
    offerSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        console.log(`🧹 FINAL FIX - Removing: ${element.id || element.className}`);
        element.remove();
      });
    });

    console.log("✅ FINAL FIX - Comprehensive cleanup completed");
  }

  // دالة البحث عن النموذج الفعلي - إصلاح جذري للمشكلة
  function findActualFormContainer(blockId) {
    console.log(`🎯 RADICAL FIX - Looking for CORRECT form with blockId: ${blockId}`);
    
    // أولاً: البحث عن حاوي النموذج المحدد بـ blockId
    const specificContainer = document.querySelector(`#codform-container-${blockId}`);
    if (specificContainer) {
      console.log(`✅ RADICAL FIX - Found specific container:`, specificContainer);
      const form = specificContainer.querySelector('form');
      if (form) {
        console.log(`✅ RADICAL FIX - Found form inside specific container:`, form);
        return form;
      }
      console.log(`⚠️ RADICAL FIX - Using specific container as form:`, specificContainer);
      return specificContainer;
    }
    
    // ثانياً: البحث عن النموذج باستخدام data attributes
    const codformElements = [
      document.querySelector('[data-codform="true"]'),
      document.querySelector('.codform-form'),
      document.querySelector('[data-codform]')
    ];
    
    for (let element of codformElements) {
      if (element) {
        console.log(`📦 RADICAL FIX - Found codform element:`, element);
        if (element.tagName === 'FORM') {
          console.log(`✅ RADICAL FIX - Element is a form:`, element);
          return element;
        }
        const form = element.querySelector('form');
        if (form) {
          console.log(`✅ RADICAL FIX - Found form inside codform element:`, form);
          return form;
        }
        console.log(`⚠️ RADICAL FIX - Using codform element as form:`, element);
        return element;
      }
    }
    
    // ثالثاً: تجنب نماذج السلة والتنقل والبحث
    const forms = document.getElementsByTagName('form');
    console.log(`🔍 RADICAL FIX - Found ${forms.length} forms, filtering correct one`);
    
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const formId = form.id || '';
      const formClass = form.className || '';
      
      console.log(`📋 RADICAL FIX - Checking Form ${i}: ID="${formId}", Class="${formClass}"`);
      
      // تجنب النماذج غير المرغوبة
      const skipPatterns = [
        'cart', 'Cart', 'CART',
        'search', 'Search', 'SEARCH', 
        'nav', 'Nav', 'NAV',
        'login', 'Login', 'LOGIN',
        'newsletter', 'Newsletter',
        'drawer', 'Drawer', 'DRAWER'
      ];
      
      const shouldSkip = skipPatterns.some(pattern => 
        formId.includes(pattern) || formClass.includes(pattern)
      );
      
      if (shouldSkip) {
        console.log(`⚠️ RADICAL FIX - Skipping unwanted form ${i}: ${formId}`);
        continue;
      }
      
      // البحث عن النموذج الذي يحتوي على حقول الإدخال الفعلية
      const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
      if (inputs.length >= 2) {
        console.log(`✅ RADICAL FIX - Found form with ${inputs.length} input fields:`, form);
        return form;
      }
    }
    
    console.error(`❌ RADICAL FIX - No suitable form found`);
    return null;
  }

  // دالة البحث عن مكان الإدراج الصحيح داخل النموذج
  function findInsertionPointInForm(formContainer) {
    console.log(`🎯 FINAL FIX - Finding insertion point inside form`);
    
    // البحث عن العنوان الحقيقي في النموذج
    const titleSelectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      '.form-title',
      '.product-title',
      '[data-field-type="form-title"]',
      '.title',
      '.heading'
    ];
    
    for (const selector of titleSelectors) {
      const title = formContainer.querySelector(selector);
      if (title) {
        console.log(`✅ FINAL FIX - Found title element: ${selector}`, title);
        return { element: title, position: 'before' };
      }
    }
    
    // البحث عن أول حقل في النموذج
    const fieldSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'textarea',
      'select',
      '.form-field',
      '.input-field',
      '[data-field-type]'
    ];
    
    for (const selector of fieldSelectors) {
      const field = formContainer.querySelector(selector);
      if (field) {
        console.log(`✅ FINAL FIX - Found first field: ${selector}`, field);
        return { element: field, position: 'before' };
      }
    }
    
    // كآخر حل، في أول النموذج
    console.log(`⚠️ FINAL FIX - No specific element found, inserting at form beginning`);
    return { element: formContainer.firstElementChild, position: 'before' };
  }

  // إنشاء العرض في المكان الصحيح
  function createOfferInCorrectPosition(quantityOffersData, blockId, productId, productData, position) {
    console.log(`📍 FINAL FIX - Creating offer for position: ${position}`);
    
    const formContainer = findActualFormContainer(blockId);
    if (!formContainer) {
      console.error(`❌ FINAL FIX - Form container not found`);
      return;
    }

    // إنشاء العرض
    const offerContainer = document.createElement('div');
    offerContainer.id = `quantity-offers-${blockId}`;
    offerContainer.className = 'quantity-offers-container';
    offerContainer.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      margin: 15px 0;
      position: relative;
      z-index: 10;
      width: 100%;
      background-color: transparent;
    `;

    // تحديد مكان الإدراج حسب الموضع
    let insertionSuccess = false;
    
    if (position === 'inside_form') {
      // داخل النموذج - البحث عن المكان الصحيح
      const insertionPoint = findInsertionPointInForm(formContainer);
      if (insertionPoint && insertionPoint.element) {
        if (insertionPoint.position === 'before') {
          insertionPoint.element.parentNode.insertBefore(offerContainer, insertionPoint.element);
        } else {
          insertionPoint.element.parentNode.insertBefore(offerContainer, insertionPoint.element.nextSibling);
        }
        insertionSuccess = true;
        console.log(`✅ FINAL FIX - Inserted INSIDE form at correct position`);
      } else {
        // كآخر حل، في أول النموذج
        formContainer.insertBefore(offerContainer, formContainer.firstElementChild);
        insertionSuccess = true;
        console.log(`✅ FINAL FIX - Inserted INSIDE form at beginning as fallback`);
      }
    } else if (position === 'before_form') {
      // قبل النموذج
      const parentElement = formContainer.parentElement;
      if (parentElement) {
        parentElement.insertBefore(offerContainer, formContainer);
        insertionSuccess = true;
        console.log(`✅ FINAL FIX - Inserted BEFORE form`);
      }
    } else if (position === 'after_form') {
      // بعد النموذج
      const parentElement = formContainer.parentElement;
      if (parentElement) {
        if (formContainer.nextSibling) {
          parentElement.insertBefore(offerContainer, formContainer.nextSibling);
        } else {
          parentElement.appendChild(offerContainer);
        }
        insertionSuccess = true;
        console.log(`✅ FINAL FIX - Inserted AFTER form`);
      }
    }

    if (!insertionSuccess) {
      console.error(`❌ FINAL FIX - Failed to insert offer at position: ${position}`);
      offerContainer.remove();
      return;
    }

    // منع التكرار
    if (displayedContainers.has(offerContainer.id)) {
      console.log(`⚠️ FINAL FIX - Container already has offers: ${offerContainer.id}`);
      offerContainer.remove();
      return;
    }

    // عرض العروض
    displayOffersContent(offerContainer, quantityOffersData, productData);
    
    // تسجيل المعالجة
    markAsProcessed(blockId, productId);
    displayedContainers.add(offerContainer.id);
    
    console.log(`✅ FINAL FIX - Offer successfully displayed at position: ${position}`);
  }

  // عرض محتوى العروض
  function displayOffersContent(container, quantityOffersData, productData) {
    const offers = quantityOffersData.offers || [];
    if (offers.length === 0) {
      console.log("ℹ️ FINAL FIX - No offers to display");
      return;
    }

    // التحقق من صحة بيانات المنتج
    if (!productData || !productData.price || productData.price <= 0) {
      console.error("❌ FINAL FIX - Invalid product data:", productData);
      return;
    }

    const realPrice = parseFloat(productData.price);
    const currency = productData.currency || 'USD';
    const productImage = productData.image;
    const productTitle = productData.title || 'المنتج';

    console.log("💰 FINAL FIX - Using REAL product data:", {
      realPrice,
      currency,
      productTitle,
      hasImage: !!productImage
    });

    // استخدام التنسيق من البيانات
    const styling = quantityOffersData.styling || {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      tagColor: '#22c55e',
      priceColor: '#ef4444'
    };

    // رمز العملة الصحيح
    const currencySymbol = currency === 'USD' ? '$' : 
                          currency === 'SAR' ? 'ر.س' : 
                          currency === 'MAD' ? 'د.م' : 
                          currency;

    // عرض العروض
    offers.forEach((offer, index) => {
      const offerElement = document.createElement('div');
      offerElement.style.cssText = `
        background-color: ${styling.backgroundColor};
        border: 2px solid ${index === 1 ? '#22c55e' : '#e5e7eb'};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Cairo', system-ui, Arial, sans-serif;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        cursor: pointer;
        ${index === 1 ? 'background-color: #f0fdf4;' : ''}
      `;

      // الجزء الأيسر
      const leftSection = document.createElement('div');
      leftSection.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1;';

      // صورة المنتج الحقيقية
      const imageElement = document.createElement('img');
      imageElement.style.cssText = `
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        display: block;
        background-color: #f9fafb;
        flex-shrink: 0;
      `;
      
      if (productImage && productImage.trim() !== '') {
        imageElement.src = productImage;
        imageElement.alt = productTitle;
        
        imageElement.onerror = function() {
          console.error('❌ FINAL FIX - Failed to load product image:', productImage);
          this.style.display = 'none';
          const fallbackIcon = document.createElement('div');
          fallbackIcon.style.cssText = `
            width: 60px;
            height: 60px;
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          `;
          fallbackIcon.innerHTML = `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          `;
          this.parentNode.insertBefore(fallbackIcon, this);
        };
      } else {
        imageElement.style.display = 'none';
        const fallbackIcon = document.createElement('div');
        fallbackIcon.style.cssText = `
          width: 60px;
          height: 60px;
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        `;
        fallbackIcon.innerHTML = `
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        `;
        leftSection.appendChild(fallbackIcon);
      }
      
      if (imageElement.src) {
        leftSection.appendChild(imageElement);
      }

      // محتوى النص
      const textContent = document.createElement('div');
      textContent.style.cssText = 'flex: 1;';

      // النص الرئيسي
      const mainText = document.createElement('div');
      mainText.style.cssText = `
        font-weight: 600;
        font-size: 15px;
        color: ${styling.textColor};
        margin-bottom: 6px;
      `;
      mainText.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة`;

      // العلامات
      const tagsContainer = document.createElement('div');
      tagsContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';

      if (offer.tag) {
        const tagElement = document.createElement('span');
        tagElement.style.cssText = `
          background-color: ${styling.tagColor};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        `;
        tagElement.textContent = offer.tag;
        tagsContainer.appendChild(tagElement);
      }

      // حساب السعر النهائي
      let totalPrice = realPrice * (offer.quantity || 1);
      let originalPrice = totalPrice;
      let savingsPercentage = 0;

      if (offer.discountType === 'percentage' && offer.discountValue > 0) {
        const discount = (originalPrice * offer.discountValue) / 100;
        totalPrice = originalPrice - discount;
        savingsPercentage = offer.discountValue;
      } else if (offer.discountType === 'fixed' && offer.discountValue > 0) {
        totalPrice = originalPrice - offer.discountValue;
        savingsPercentage = Math.round((offer.discountValue / originalPrice) * 100);
      }

      if (savingsPercentage > 0) {
        const savingsElement = document.createElement('span');
        savingsElement.style.cssText = `
          background-color: #22c55e;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        `;
        savingsElement.textContent = `وفر ${savingsPercentage}%`;
        tagsContainer.appendChild(savingsElement);
      }

      textContent.appendChild(mainText);
      textContent.appendChild(tagsContainer);
      leftSection.appendChild(textContent);

      // الجزء الأيمن: الأسعار
      const priceSection = document.createElement('div');
      priceSection.style.cssText = 'text-align: center; min-width: 100px;';

      // السعر الأصلي (إذا كان هناك خصم)
      if (savingsPercentage > 0) {
        const originalPriceElement = document.createElement('div');
        originalPriceElement.style.cssText = `
          font-size: 12px;
          color: #6b7280;
          text-decoration: line-through;
          margin-bottom: 4px;
        `;
        originalPriceElement.textContent = `${originalPrice.toFixed(2)} ${currencySymbol}`;
        priceSection.appendChild(originalPriceElement);
      }

      // السعر النهائي
      const finalPriceElement = document.createElement('div');
      finalPriceElement.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: ${styling.priceColor};
      `;
      finalPriceElement.textContent = `${totalPrice.toFixed(2)} ${currencySymbol}`;
      priceSection.appendChild(finalPriceElement);

      // السعر لكل قطعة
      if (offer.quantity > 1) {
        const perItemElement = document.createElement('div');
        perItemElement.style.cssText = `
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        `;
        perItemElement.textContent = `${realPrice.toFixed(2)} ${currencySymbol} × ${offer.quantity}`;
        priceSection.appendChild(perItemElement);
      }

      // تجميع العناصر
      offerElement.appendChild(leftSection);
      offerElement.appendChild(priceSection);
      container.appendChild(offerElement);

      console.log(`✅ FINAL FIX - Offer displayed: ${offer.text}, Price: ${totalPrice.toFixed(2)} ${currencySymbol}`);
    });
  }

  // دالة عرض العروض الحقيقية - النسخة النهائية المصححة
  function displayRealQuantityOffers(quantityOffersData, blockId, productId, productData = null) {
    console.log("🎯 FINAL FIX - Starting final corrected display");
    
    // التحقق من التكرار
    if (isAlreadyProcessed(blockId, productId)) {
      console.log("⚠️ FINAL FIX - Already processed, skipping...");
      return;
    }

    // تنظيف شامل أولاً
    cleanupAllOffers();

    // التحقق من صحة البيانات
    if (!quantityOffersData || !quantityOffersData.offers || !Array.isArray(quantityOffersData.offers)) {
      console.log("❌ FINAL FIX - Invalid or missing offers data");
      return;
    }

    if (!productData || !productData.price || productData.price <= 0) {
      console.log("❌ FINAL FIX - Missing or invalid product price data");
      return;
    }

    // الحصول على الموضع من البيانات (افتراضي: داخل النموذج)
    const position = quantityOffersData.position || 'inside_form';
    console.log(`📍 FINAL FIX - Using position: ${position}`);

    // إنشاء العرض في المكان الصحيح
    createOfferInCorrectPosition(quantityOffersData, blockId, productId, productData, position);
  }

  // دالة تحميل وعرض العروض من API
  async function loadAndDisplayRealOffers(blockId, productId, shop) {
    if (isAlreadyProcessed(blockId, productId)) {
      console.log("⚠️ FINAL FIX - Load already processed, skipping...");
      return { success: false, message: "Already processed" };
    }

    try {
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
      
      if (data.success && data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
        console.log("✅ FINAL FIX - Found real offers and product data");
        
        // التحقق من بيانات المنتج
        if (!data.product || !data.product.price || data.product.price <= 0) {
          console.error("❌ FINAL FIX - Invalid product data from API");
          return { success: false, message: "Invalid product data" };
        }
        
        displayRealQuantityOffers(
          data.quantity_offers, 
          blockId, 
          productId, 
          data.product
        );
        
        return { success: true, offers: data.quantity_offers };
      } else {
        console.log("ℹ️ FINAL FIX - No offers found");
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error("❌ FINAL FIX - Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة إعادة تعيين التكرار
  function resetDuplicateCheck() {
    processedOffers.clear();
    displayedContainers.clear();
    cleanupAllOffers();
    console.log("🔄 FINAL FIX - Reset completed with cleanup");
  }

  // Public API
  return {
    display: displayRealQuantityOffers,
    load: loadAndDisplayRealOffers,
    reset: resetDuplicateCheck,
    cleanup: cleanupAllOffers
  };
})();

// دالة إعادة تعيين للتشخيص
window.resetQuantityOffers = function() {
  return window.CodformQuantityOffers.reset();
};

// دالة تنظيف للتشخيص
window.cleanupQuantityOffers = function() {
  return window.CodformQuantityOffers.cleanup();
};

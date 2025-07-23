
/**
 * CODFORM Quantity Offers Handler - REAL DATA ONLY - POSITION BASED
 * معالج العروض الكمية - البيانات الحقيقية فقط - حسب الموضع المحدد
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
    console.log(`✅ POSITION BASED - Marked as processed: ${key}`);
  }

  // تنظيف شامل لجميع العروض
  function cleanupAllOffers() {
    console.log("🧹 POSITION CLEANUP - Starting comprehensive cleanup...");
    
    // حذف جميع العروض الموجودة
    const offerSelectors = [
      '.quantity-offers-container',
      '[id*="quantity-offers"]',
      '.codform-quantity-offers',
      '[class*="quantity-offers"]'
    ];
    
    offerSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        console.log(`🧹 POSITION CLEANUP - Removing: ${element.id || element.className}`);
        element.remove();
      });
    });

    console.log("✅ POSITION CLEANUP - Comprehensive cleanup completed");
  }

  // إنشاء العرض بناءً على الموضع المحدد
  function createOfferByPosition(quantityOffersData, blockId, productId, productData, position) {
    console.log(`📍 POSITION BASED - Creating offer for position: ${position}`);
    
    const container = document.getElementById(`codform-container-${blockId}`);
    if (!container) {
      console.error(`❌ POSITION BASED - Container not found: codform-container-${blockId}`);
      return;
    }

    let targetElement = null;
    let offerContainer = null;

    // إنشاء العرض أولاً
    offerContainer = document.createElement('div');
    offerContainer.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      margin: 20px 0;
      position: relative;
      z-index: 999;
      width: 100%;
      background: #fff3cd !important;
      border: 3px solid #ffc107 !important;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    // تحديد الموضع والإدراج
    switch (position) {
      case 'before_form':
        console.log(`📍 POSITION BASED - Placing BEFORE form`);
        offerContainer.id = `quantity-offers-before-${blockId}`;
        offerContainer.className = 'quantity-offers-container-before-form';
        
        // إدراج قبل النموذج مباشرة
        container.parentNode.insertBefore(offerContainer, container);
        console.log(`✅ POSITION BASED - Inserted BEFORE container`);
        break;
        
      case 'after_form':
        console.log(`📍 POSITION BASED - Placing AFTER form`);
        offerContainer.id = `quantity-offers-after-${blockId}`;
        offerContainer.className = 'quantity-offers-container-after-form';
        
        // إدراج بعد النموذج مباشرة
        if (container.nextSibling) {
          container.parentNode.insertBefore(offerContainer, container.nextSibling);
        } else {
          container.parentNode.appendChild(offerContainer);
        }
        console.log(`✅ POSITION BASED - Inserted AFTER container`);
        break;
        
      case 'inside_form':
      default:
        console.log(`📍 POSITION BASED - Placing INSIDE form`);
        offerContainer.id = `quantity-offers-inside-${blockId}`;
        offerContainer.className = 'quantity-offers-container-inside-form';
        
        // إدراج داخل النموذج
        const formTitle = container.querySelector('.form-title-field, [data-field-type="form-title"]');
        const firstField = container.querySelector('.mb-4:not(.form-title-field), [class*="field"]:not([data-field-type="form-title"]):not(.quantity-offers-container-inside-form)');
        
        if (formTitle && firstField) {
          formTitle.parentNode.insertBefore(offerContainer, firstField);
        } else if (firstField) {
          firstField.parentNode.insertBefore(offerContainer, firstField);
        } else {
          container.appendChild(offerContainer);
        }
        console.log(`✅ POSITION BASED - Inserted INSIDE container`);
        break;
    }

    if (!offerContainer.parentNode) {
      console.error(`❌ POSITION BASED - Failed to insert offer container`);
      return;
    }

    // منع التكرار في نفس الحاوي
    if (displayedContainers.has(offerContainer.id)) {
      console.log(`⚠️ POSITION BASED - Container already has offers: ${offerContainer.id}`);
      return;
    }

    // عرض العروض
    displayOffersContent(offerContainer, quantityOffersData, productData);
    
    // تسجيل المعالجة
    markAsProcessed(blockId, productId);
    displayedContainers.add(offerContainer.id);

    console.log(`✅ POSITION BASED - Offer displayed successfully at position: ${position}`);
  }

  // عرض محتوى العروض
  function displayOffersContent(container, quantityOffersData, productData) {
    const offers = quantityOffersData.offers || [];
    if (offers.length === 0) {
      console.log("ℹ️ POSITION BASED - No offers to display");
      return;
    }

    // التحقق من صحة بيانات المنتج
    if (!productData || !productData.price || productData.price <= 0) {
      console.error("❌ POSITION BASED - Invalid product data:", productData);
      return;
    }

    const realPrice = parseFloat(productData.price);
    const currency = productData.currency || 'USD';
    const productImage = productData.image;
    const productTitle = productData.title || 'المنتج';

    console.log("💰 POSITION BASED - Using REAL product data:", {
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
          console.error('❌ POSITION BASED - Failed to load product image:', productImage);
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

      console.log(`✅ POSITION BASED - Offer displayed: ${offer.text}, Price: ${totalPrice.toFixed(2)} ${currencySymbol}`);
    });
  }

  // دالة عرض العروض الحقيقية بناءً على الموضع
  function displayRealQuantityOffers(quantityOffersData, blockId, productId, productData = null) {
    console.log("🎯 POSITION BASED - Starting display with position respect");
    
    // التحقق من التكرار
    if (isAlreadyProcessed(blockId, productId)) {
      console.log("⚠️ POSITION BASED - Already processed, skipping...");
      return;
    }

    // تنظيف شامل أولاً
    cleanupAllOffers();

    // التحقق من صحة البيانات
    if (!quantityOffersData || !quantityOffersData.offers || !Array.isArray(quantityOffersData.offers)) {
      console.log("❌ POSITION BASED - Invalid or missing offers data");
      return;
    }

    if (!productData || !productData.price || productData.price <= 0) {
      console.log("❌ POSITION BASED - Missing or invalid product price data");
      return;
    }

    // الحصول على الموضع من البيانات
    const position = quantityOffersData.position || 'inside_form';
    console.log(`📍 POSITION BASED - Using position: ${position}`);

    // إنشاء العرض في الموضع المحدد
    createOfferByPosition(quantityOffersData, blockId, productId, productData, position);
  }

  // دالة تحميل وعرض العروض من API
  async function loadAndDisplayRealOffers(blockId, productId, shop) {
    if (isAlreadyProcessed(blockId, productId)) {
      console.log("⚠️ POSITION BASED - Load already processed, skipping...");
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
        console.log("✅ POSITION BASED - Found real offers and product data");
        
        // التحقق من بيانات المنتج
        if (!data.product || !data.product.price || data.product.price <= 0) {
          console.error("❌ POSITION BASED - Invalid product data from API");
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
        console.log("ℹ️ POSITION BASED - No offers found");
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error("❌ POSITION BASED - Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة إعادة تعيين التكرار
  function resetDuplicateCheck() {
    processedOffers.clear();
    displayedContainers.clear();
    cleanupAllOffers();
    console.log("🔄 POSITION BASED - Reset completed with cleanup");
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

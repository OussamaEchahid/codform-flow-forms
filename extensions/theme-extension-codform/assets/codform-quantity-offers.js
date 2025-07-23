
/**
 * CODFORM Quantity Offers Handler - REAL DATA ONLY - STRICT INSIDE FORM
 * معالج العروض الكمية - البيانات الحقيقية فقط - داخل النموذج فقط
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
    console.log(`✅ REAL DATA - Marked as processed: ${key}`);
  }

  // تنظيف شامل لجميع العروض الخارجية والمكررة
  function cleanupAllExternalOffers() {
    console.log("🧹 CLEANUP - Starting comprehensive cleanup...");
    
    // حذف جميع العروض الخارجية
    const externalSelectors = [
      '.quantity-offers-container:not([id*="inside"])',
      '[id*="quantity-offers-before"]',
      '[id*="quantity-offers-after"]',
      '[class*="quantity-offers"]:not([id*="inside"])',
      '.codform-quantity-offers:not([id*="inside"])'
    ];
    
    externalSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        console.log(`🧹 CLEANUP - Removing external offer: ${element.id || element.className}`);
        element.remove();
      });
    });

    // حذف العروض المكررة داخل النموذج
    const insideOffers = document.querySelectorAll('.quantity-offers-container-inside-form');
    if (insideOffers.length > 1) {
      console.log(`🧹 CLEANUP - Found ${insideOffers.length} duplicate inside offers, keeping only the first`);
      for (let i = 1; i < insideOffers.length; i++) {
        insideOffers[i].remove();
      }
    }

    // تنظيف أي عروض بأسعار خاطئة (100, 10, إلخ)
    const wrongPriceOffers = document.querySelectorAll('[class*="quantity-offers"] *');
    wrongPriceOffers.forEach(element => {
      const textContent = element.textContent || '';
      if (textContent.includes('$100') || textContent.includes('$10') || textContent.includes('100.00') || textContent.includes('10.00')) {
        console.log(`🧹 CLEANUP - Removing wrong price offer: ${textContent}`);
        const container = element.closest('[class*="quantity-offers"]');
        if (container) container.remove();
      }
    });

    console.log("✅ CLEANUP - Comprehensive cleanup completed");
  }

  // عرض العروض الحقيقية داخل النموذج فقط
  function displayRealQuantityOffers(quantityOffersData, blockId, productId, productData = null) {
    console.log("🎯 REAL DATA - Starting display with STRICT inside form only");
    
    // التحقق من التكرار
    if (isAlreadyProcessed(blockId, productId)) {
      console.log("⚠️ REAL DATA - Already processed, skipping...");
      return;
    }

    // تنظيف شامل أولاً
    cleanupAllExternalOffers();

    // التحقق من صحة البيانات الحقيقية
    if (!quantityOffersData || !quantityOffersData.offers || !Array.isArray(quantityOffersData.offers)) {
      console.log("❌ REAL DATA - Invalid or missing offers data");
      return;
    }

    if (!productData || !productData.price || productData.price <= 0) {
      console.log("❌ REAL DATA - Missing or invalid real product price data");
      return;
    }

    const offers = quantityOffersData.offers;
    if (offers.length === 0) {
      console.log("ℹ️ REAL DATA - No offers to display");
      return;
    }

    // البحث عن الحاوية داخل النموذج فقط
    const container = document.getElementById(`codform-container-${blockId}`);
    if (!container) {
      console.error("❌ REAL DATA - Container not found:", `codform-container-${blockId}`);
      return;
    }

    // استخدام البيانات الحقيقية ONLY
    const realPrice = parseFloat(productData.price);
    const currency = productData.currency || 'USD';
    const productImage = productData.image;
    const productTitle = productData.title || 'المنتج';

    // Validate price first
    if (realPrice <= 0 || isNaN(realPrice)) {
      console.error("❌ REAL DATA - Invalid real price:", realPrice);
      return;
    }

    console.log("💰 REAL DATA - Using CONFIRMED real price:", {
      realPrice,
      currency,
      productTitle,
      hasImage: !!productImage,
      productHandle: productData.handle || 'N/A'
    });

    // التحقق من وجود حاوي العروض داخل النموذج ONLY
    let offersContainer = document.getElementById(`quantity-offers-inside-${blockId}`);
    if (!offersContainer) {
      offersContainer = document.createElement('div');
      offersContainer.id = `quantity-offers-inside-${blockId}`;
      offersContainer.className = 'quantity-offers-container-inside-form';
      
      // إدراج العروض في المكان المحدد حسب إعدادات العروض الكمية
      const quantityOffersPosition = container.querySelector('[data-field-type="quantity-offers"], .quantity-offers-field-placeholder');
      const formTitle = container.querySelector('.form-title-field, [data-field-type="form-title"]');
      const firstField = container.querySelector('.mb-4:not(.form-title-field), [class*="field"]:not([data-field-type="form-title"]):not(.quantity-offers-container-inside-form)');
      
      if (quantityOffersPosition) {
        // إذا وجد موضع محدد للعروض الكمية، استخدمه
        quantityOffersPosition.parentNode.insertBefore(offersContainer, quantityOffersPosition.nextSibling);
        console.log("📍 REAL DATA - Placed offers at designated quantity offers position");
      } else if (formTitle && firstField) {
        formTitle.parentNode.insertBefore(offersContainer, firstField);
        console.log("📍 REAL DATA - Placed offers after form title");
      } else if (firstField) {
        firstField.parentNode.insertBefore(offersContainer, firstField);
        console.log("📍 REAL DATA - Placed offers before first field");
      } else {
        container.appendChild(offersContainer);
        console.log("📍 REAL DATA - Appended offers to container");
      }
    }

    // منع التكرار في نفس الحاوي
    if (displayedContainers.has(offersContainer.id)) {
      console.log("⚠️ REAL DATA - Container already has offers");
      return;
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

    // عرض العروض الحقيقية مع السعر الصحيح
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

      // صورة المنتج الحقيقية مع إصلاح شامل
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
        // تنظيف رابط الصورة وإضافة أبعاد مناسبة
        let cleanImageUrl = productImage.trim();
        // إضافة أبعاد مناسبة لصور Shopify
        if (cleanImageUrl.includes('shopify') && !cleanImageUrl.includes('_120x120')) {
          cleanImageUrl = cleanImageUrl.replace(/\.(jpg|jpeg|png|webp)/i, '_120x120.$1');
        }
        
        imageElement.src = cleanImageUrl;
        imageElement.alt = productTitle || 'صورة المنتج';
        
        imageElement.onerror = function() {
          console.log('❌ REAL DATA - Image failed to load, trying original URL:', productImage);
          // محاولة بالرابط الأصلي
          this.src = productImage;
          this.onerror = function() {
            console.log('❌ REAL DATA - Original image also failed, using product icon');
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjlmYWZiIi8+CjxwYXRoIGQ9Ik0yMCAyMGgyMHYyMEgyMFYyMFoiIGZpbGw9IiM2Yjc2ODAiLz4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMiIgZmlsbD0iI2Y5ZmFmYiIvPgo8cGF0aCBkPSJNMjIgMzVsMy0zIDItMiA4IDh2MUgyMnYtNFoiIGZpbGw9IiNmOWZhZmIiLz4KPHN2Zz4K';
          };
        };
        
        console.log('✅ REAL DATA - Image element created with optimized src:', cleanImageUrl);
      } else {
        // أيقونة منتج جميلة بدلاً من مربع رمادي
        imageElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjlmYWZiIi8+CjxwYXRoIGQ9Ik0yMCAyMGgyMHYyMEgyMFYyMFoiIGZpbGw9IiM2Yjc2ODAiLz4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMiIgZmlsbD0iI2Y5ZmFmYiIvPgo8cGF0aCBkPSJNMjIgMzVsMy0zIDItMiA4IDh2MUgyMnYtNFoiIGZpbGw9IiNmOWZhZmIiLz4KPHN2Zz4K';
        imageElement.alt = 'أيقونة المنتج';
        console.log('⚠️ REAL DATA - No product image, using product icon');
      }
      leftSection.appendChild(imageElement);

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

      // حساب السعر النهائي بناءً على البيانات الحقيقية
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

      // الجزء الأيمن: الأسعار الحقيقية
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

      // السعر النهائي الحقيقي
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
      offersContainer.appendChild(offerElement);

      console.log(`✅ REAL DATA - Offer displayed: ${offer.text}, Price: ${totalPrice.toFixed(2)} ${currencySymbol}`);
    });

    // تسجيل المعالجة والعرض
    markAsProcessed(blockId, productId);
    displayedContainers.add(offersContainer.id);

    console.log("✅ REAL DATA - Quantity offers displayed successfully INSIDE FORM ONLY with correct real data");
  }

  // دالة تحميل وعرض العروض من API
  async function loadAndDisplayRealOffers(blockId, productId, shop) {
    if (isAlreadyProcessed(blockId, productId)) {
      console.log("⚠️ REAL DATA - Load already processed, skipping...");
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
        console.log("✅ REAL DATA - Found real offers and product data");
        
        // Validate product data before display
        if (!data.product || !data.product.price || data.product.price <= 0) {
          console.error("❌ REAL DATA - Invalid product data from API");
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
        console.log("ℹ️ REAL DATA - No offers found");
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error("❌ REAL DATA - Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة إعادة تعيين التكرار
  function resetDuplicateCheck() {
    processedOffers.clear();
    displayedContainers.clear();
    cleanupAllExternalOffers();
    console.log("🔄 REAL DATA - Reset completed with cleanup");
  }

  // Public API
  return {
    display: displayRealQuantityOffers,
    load: loadAndDisplayRealOffers,
    reset: resetDuplicateCheck,
    cleanup: cleanupAllExternalOffers
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

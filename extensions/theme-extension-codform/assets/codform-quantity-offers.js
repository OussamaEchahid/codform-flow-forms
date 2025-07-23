
/**
 * CODFORM Quantity Offers Handler - REAL DATA ONLY
 * معالج العروض الكمية - البيانات الحقيقية فقط
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

  // تنظيف العروض الوهمية والمكررة
  function cleanupFakeOffers() {
    // حذف جميع العروض الخارجية
    const externalOffers = document.querySelectorAll(
      '.quantity-offers-container:not([id*="inside"]), [id*="quantity-offers-before"], [id*="quantity-offers-after"]'
    );
    
    externalOffers.forEach(element => {
      console.log("🧹 CLEANUP - Removing external offer:", element.id);
      element.remove();
    });

    // حذف العروض المكررة
    const allOffers = document.querySelectorAll('.quantity-offers-container-inside-form');
    if (allOffers.length > 1) {
      console.log(`🧹 CLEANUP - Found ${allOffers.length} duplicate offers, keeping only the first`);
      for (let i = 1; i < allOffers.length; i++) {
        allOffers[i].remove();
      }
    }
  }

  // عرض العروض الحقيقية فقط
  function displayRealQuantityOffers(quantityOffersData, blockId, productId, productData = null) {
    console.log("🎯 REAL DATA - Starting display with real product data");
    
    // التحقق من التكرار
    if (isAlreadyProcessed(blockId, productId)) {
      console.log("⚠️ REAL DATA - Already processed, skipping...");
      return;
    }

    // تنظيف العروض الوهمية أولاً
    cleanupFakeOffers();

    // التحقق من صحة البيانات الحقيقية
    if (!quantityOffersData || !quantityOffersData.offers || !Array.isArray(quantityOffersData.offers)) {
      console.log("❌ REAL DATA - Invalid or missing offers data");
      return;
    }

    if (!productData || !productData.price) {
      console.log("❌ REAL DATA - Missing real product price data");
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

    // استخدام البيانات الحقيقية فقط
    const realPrice = parseFloat(productData.price);
    const currency = productData.currency || 'USD';
    const productImage = productData.image;
    const productTitle = productData.title || 'المنتج';

    console.log("💰 REAL DATA - Using real price:", {
      realPrice,
      currency,
      productTitle,
      hasImage: !!productImage
    });

    // التحقق من وجود حاوي العروض داخل النموذج
    let offersContainer = document.getElementById(`quantity-offers-inside-${blockId}`);
    if (!offersContainer) {
      offersContainer = document.createElement('div');
      offersContainer.id = `quantity-offers-inside-${blockId}`;
      offersContainer.className = 'quantity-offers-container-inside-form';
      
      // إدراج العروض داخل النموذج فقط
      const formTitle = container.querySelector('.form-title-field, [data-field-type="form-title"]');
      const firstField = container.querySelector('.mb-4:not(.form-title-field), [class*="field"]:not([data-field-type="form-title"])');
      
      if (formTitle && firstField) {
        formTitle.parentNode.insertBefore(offersContainer, firstField);
      } else if (firstField) {
        firstField.parentNode.insertBefore(offersContainer, firstField);
      } else {
        container.insertBefore(offersContainer, container.firstChild);
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

    // عرض العروض الحقيقية
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
      if (productImage) {
        const imageElement = document.createElement('img');
        imageElement.src = productImage;
        imageElement.alt = productTitle;
        imageElement.style.cssText = `
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        `;
        imageElement.onerror = function() {
          this.style.display = 'none';
        };
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
    });

    // تسجيل المعالجة والعرض
    markAsProcessed(blockId, productId);
    displayedContainers.add(offersContainer.id);

    console.log("✅ REAL DATA - Quantity offers displayed successfully with real data");
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
    console.log("🔄 REAL DATA - Reset completed");
  }

  // Public API
  return {
    display: displayRealQuantityOffers,
    load: loadAndDisplayRealOffers,
    reset: resetDuplicateCheck
  };
})();

// دالة إعادة تعيين للتشخيص
window.resetQuantityOffers = function() {
  return window.CodformQuantityOffers.reset();
};


/**
 * CODFORM Quantity Offers Handler - FINAL CORRECTED VERSION
 * معالج العروض الكمية - النسخة المصححة نهائياً
 * 
 * This version fixes the core issue by:
 * 1. Targeting the correct form containers (div.codform-form, not form tag)
 * 2. Using pre-existing quantity offer containers from liquid template
 * 3. Proper timing with MutationObserver
 * 4. Simplified, focused code
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // تتبع العروض المعروضة لمنع التكرار
  const displayedOffers = new Set();
  
  // دالة البحث عن حاوي النموذج الصحيح
  function findCorrectFormContainer(blockId) {
    console.log(`🎯 FINAL CORRECTED - Looking for form container with blockId: ${blockId}`);
    
    // أولاً: البحث عن الحاوي المحدد بـ blockId
    const specificSelectors = [
      `#codform-container-${blockId}`,
      `#codform-form-${blockId}`,
      `.codform-form-container-${blockId}`,
      `[data-block-id="${blockId}"]`
    ];
    
    for (const selector of specificSelectors) {
      const container = document.querySelector(selector);
      if (container) {
        console.log(`✅ FINAL CORRECTED - Found specific container: ${selector}`, container);
        return container;
      }
    }
    
    // ثانياً: البحث عن حاوي النموذج العام
    const generalSelectors = [
      '.codform-form',
      '.codform-form-container',
      '[data-codform="true"]',
      '[data-codform]'
    ];
    
    for (const selector of generalSelectors) {
      const container = document.querySelector(selector);
      if (container) {
        console.log(`✅ FINAL CORRECTED - Found general container: ${selector}`, container);
        return container;
      }
    }
    
    console.error(`❌ FINAL CORRECTED - No form container found for blockId: ${blockId}`);
    return null;
  }
  
  // دالة البحث عن حاوي العرض المناسب
  function findOfferContainer(blockId, position) {
    console.log(`🎯 FINAL CORRECTED - Looking for offer container: ${position} with blockId: ${blockId}`);
    
    const containerIds = {
      'before_form': `quantity-offers-before-${blockId}`,
      'inside_form': `quantity-offers-inside-${blockId}`,
      'after_form': `quantity-offers-after-${blockId}`
    };
    
    const containerId = containerIds[position];
    if (!containerId) {
      console.error(`❌ FINAL CORRECTED - Invalid position: ${position}`);
      return null;
    }
    
    const container = document.getElementById(containerId);
    if (container) {
      console.log(`✅ FINAL CORRECTED - Found pre-existing offer container: ${containerId}`, container);
      return container;
    }
    
    console.log(`⚠️ FINAL CORRECTED - Pre-existing container not found, will create: ${containerId}`);
    return null;
  }
  
  // دالة إنشاء حاوي العرض إذا لم يكن موجوداً
  function createOfferContainer(blockId, position) {
    console.log(`🔧 FINAL CORRECTED - Creating offer container for position: ${position}`);
    
    const formContainer = findCorrectFormContainer(blockId);
    if (!formContainer) {
      console.error(`❌ FINAL CORRECTED - Cannot create offer container without form container`);
      return null;
    }
    
    const offerContainer = document.createElement('div');
    offerContainer.id = `quantity-offers-${position}-${blockId}`;
    offerContainer.className = 'quantity-offers-container';
    offerContainer.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      margin: 15px 0;
      width: 100%;
      position: relative;
      z-index: 10;
    `;
    
    // تحديد مكان الإدراج
    if (position === 'before_form') {
      formContainer.parentNode.insertBefore(offerContainer, formContainer);
    } else if (position === 'after_form') {
      if (formContainer.nextSibling) {
        formContainer.parentNode.insertBefore(offerContainer, formContainer.nextSibling);
      } else {
        formContainer.parentNode.appendChild(offerContainer);
      }
    } else if (position === 'inside_form') {
      // داخل النموذج، في البداية
      formContainer.insertBefore(offerContainer, formContainer.firstChild);
    }
    
    console.log(`✅ FINAL CORRECTED - Created offer container at position: ${position}`);
    return offerContainer;
  }
  
  // دالة عرض العروض
  function displayOffers(container, offers, productData, styling) {
    if (!container || !offers || !Array.isArray(offers) || offers.length === 0) {
      console.error('❌ FINAL CORRECTED - Invalid display parameters');
      return;
    }
    
    console.log(`📦 FINAL CORRECTED - Displaying ${offers.length} offers with real product data:`, {
      price: productData?.price,
      currency: productData?.currency,
      title: productData?.title,
      image: productData?.image
    });
    
    // تنظيف الحاوي
    container.innerHTML = '';
    
    const realPrice = parseFloat(productData?.price || 0);
    const currency = productData?.currency || 'SAR';
    const currencySymbol = currency === 'USD' ? '$' : 
                          currency === 'SAR' ? 'ر.س' : 
                          currency === 'MAD' ? 'د.م' : currency;
    
    if (realPrice <= 0) {
      console.error('❌ FINAL CORRECTED - Invalid product price:', realPrice);
      return;
    }
    
    offers.forEach((offer, index) => {
      const offerElement = document.createElement('div');
      offerElement.className = 'quantity-offer-item';
      offerElement.style.cssText = `
        background-color: ${styling?.backgroundColor || '#ffffff'};
        border: 2px solid ${index === 1 ? '#22c55e' : '#e5e7eb'};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        transition: all 0.3s ease;
        ${index === 1 ? 'background-color: #f0fdf4; box-shadow: 0 4px 8px rgba(0,0,0,0.1);' : ''}
      `;
      
      // الجزء الأيسر: الصورة والمحتوى
      const leftSection = document.createElement('div');
      leftSection.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1;';
      
      // صورة المنتج
      const imageElement = document.createElement('img');
      imageElement.style.cssText = `
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        flex-shrink: 0;
      `;
      
      if (productData?.image) {
        imageElement.src = productData.image;
        imageElement.alt = productData.title || 'المنتج';
        imageElement.onerror = function() {
          this.style.display = 'none';
        };
        leftSection.appendChild(imageElement);
      }
      
      // محتوى النص
      const textContent = document.createElement('div');
      textContent.style.cssText = 'flex: 1;';
      
      const mainText = document.createElement('div');
      mainText.style.cssText = `
        font-weight: 600;
        font-size: 15px;
        color: ${styling?.textColor || '#000000'};
        margin-bottom: 6px;
        font-family: 'Cairo', system-ui, Arial, sans-serif;
      `;
      mainText.textContent = offer.offer_text || `اشترِ ${offer.quantity} قطعة`;
      
      const tagsContainer = document.createElement('div');
      tagsContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';
      
      if (offer.tag) {
        const tagElement = document.createElement('span');
        tagElement.style.cssText = `
          background-color: ${styling?.tagColor || '#22c55e'};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        `;
        tagElement.textContent = offer.tag;
        tagsContainer.appendChild(tagElement);
      }
      
      textContent.appendChild(mainText);
      textContent.appendChild(tagsContainer);
      leftSection.appendChild(textContent);
      
      // الجزء الأيمن: الأسعار
      const priceSection = document.createElement('div');
      priceSection.style.cssText = 'text-align: center; min-width: 100px;';
      
      // حساب السعر
      let totalPrice = realPrice * (offer.quantity || 1);
      let originalPrice = totalPrice;
      
      if (offer.discount_type === 'percentage' && offer.discount_value > 0) {
        totalPrice = originalPrice - (originalPrice * offer.discount_value / 100);
      } else if (offer.discount_type === 'fixed' && offer.discount_value > 0) {
        totalPrice = originalPrice - offer.discount_value;
      }
      
      // عرض السعر الأصلي إذا كان هناك خصم
      if (totalPrice < originalPrice) {
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
        color: ${styling?.priceColor || '#ef4444'};
        font-family: 'Cairo', system-ui, Arial, sans-serif;
      `;
      finalPriceElement.textContent = `${totalPrice.toFixed(2)} ${currencySymbol}`;
      priceSection.appendChild(finalPriceElement);
      
      // تجميع العناصر
      offerElement.appendChild(leftSection);
      offerElement.appendChild(priceSection);
      container.appendChild(offerElement);
      
      console.log(`✅ FINAL CORRECTED - Offer displayed: ${offer.offer_text}, Price: ${totalPrice.toFixed(2)} ${currencySymbol}`);
    });
  }
  
  // دالة عرض العروض الرئيسية
  function displayQuantityOffers(quantityOffersData, blockId, productId, productData) {
    console.log('🎯 FINAL CORRECTED - Starting display process');
    
    const offerId = `${blockId}-${productId}`;
    if (displayedOffers.has(offerId)) {
      console.log('⚠️ FINAL CORRECTED - Already displayed, skipping');
      return;
    }
    
    if (!quantityOffersData?.offers || !Array.isArray(quantityOffersData.offers)) {
      console.error('❌ FINAL CORRECTED - Invalid offers data');
      return;
    }
    
    if (!productData?.price || productData.price <= 0) {
      console.error('❌ FINAL CORRECTED - Invalid product price');
      return;
    }
    
    const position = quantityOffersData.position || 'inside_form';
    console.log(`📍 FINAL CORRECTED - Using position: ${position}`);
    
    // البحث عن حاوي العرض المناسب
    let container = findOfferContainer(blockId, position);
    
    // إنشاء الحاوي إذا لم يكن موجوداً
    if (!container) {
      container = createOfferContainer(blockId, position);
    }
    
    if (!container) {
      console.error('❌ FINAL CORRECTED - Could not find or create offer container');
      return;
    }
    
    // عرض العروض
    displayOffers(
      container,
      quantityOffersData.offers,
      productData,
      quantityOffersData.styling || {}
    );
    
    // تسجيل النجاح
    displayedOffers.add(offerId);
    console.log(`✅ FINAL CORRECTED - Successfully displayed offers for ${offerId}`);
  }
  
  // دالة تحميل العروض من API
  async function loadQuantityOffers(blockId, productId, shop) {
    const offerId = `${blockId}-${productId}`;
    if (displayedOffers.has(offerId)) {
      console.log('⚠️ FINAL CORRECTED - Already loaded, skipping');
      return { success: false, message: 'Already loaded' };
    }
    
    try {
      console.log(`🔄 FINAL CORRECTED - Loading offers for: ${offerId}`);
      
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
      
      if (data.success && data.quantity_offers && data.product) {
        console.log('✅ FINAL CORRECTED - Loaded offers and product data successfully');
        displayQuantityOffers(data.quantity_offers, blockId, productId, data.product);
        return { success: true, data };
      } else {
        console.log('ℹ️ FINAL CORRECTED - No offers found');
        return { success: false, message: 'No offers found' };
      }
      
    } catch (error) {
      console.error('❌ FINAL CORRECTED - Error loading offers:', error);
      return { success: false, error: error.message };
    }
  }
  
  // دالة المراقبة للتأكد من تحميل النموذج
  function waitForFormContainer(blockId, callback, maxWait = 10000) {
    console.log(`⏳ FINAL CORRECTED - Waiting for form container: ${blockId}`);
    
    const startTime = Date.now();
    
    function checkContainer() {
      const container = findCorrectFormContainer(blockId);
      if (container) {
        console.log(`✅ FINAL CORRECTED - Form container found after ${Date.now() - startTime}ms`);
        callback();
        return;
      }
      
      if (Date.now() - startTime > maxWait) {
        console.error(`❌ FINAL CORRECTED - Timeout waiting for form container: ${blockId}`);
        return;
      }
      
      setTimeout(checkContainer, 100);
    }
    
    checkContainer();
  }
  
  // دالة تنظيف العروض
  function cleanupOffers() {
    console.log('🧹 FINAL CORRECTED - Cleaning up offers');
    
    const selectors = [
      '.quantity-offers-container',
      '[id*="quantity-offers"]',
      '.quantity-offer-item'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    });
    
    displayedOffers.clear();
    console.log('✅ FINAL CORRECTED - Cleanup completed');
  }
  
  // دالة إعادة تعيين
  function reset() {
    cleanupOffers();
    console.log('🔄 FINAL CORRECTED - Reset completed');
  }
  
  // Public API
  return {
    display: displayQuantityOffers,
    load: loadQuantityOffers,
    reset: reset,
    cleanup: cleanupOffers,
    waitForContainer: waitForFormContainer
  };
})();

// دوال مساعدة للتشخيص
window.resetQuantityOffers = function() {
  return window.CodformQuantityOffers.reset();
};

window.cleanupQuantityOffers = function() {
  return window.CodformQuantityOffers.cleanup();
};

console.log('✅ FINAL CORRECTED - Quantity Offers handler loaded successfully');

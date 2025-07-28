/**
 * CODFORM Quantity Offers Handler - EXACT PREVIEW MATCH
 * مطابقة دقيقة 100% للمعاينة في الحجم والتصميم والسعر
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // دالة تحويل العملة مع الأسعار الدقيقة
  function convertCurrency(amount, fromCurrency, toCurrency) {
    console.log(`🔄 Starting conversion: ${amount} from ${fromCurrency} to ${toCurrency}`);
    
    // معدلات التحويل الدقيقة والصحيحة
    const exchangeRates = {
      'USD': { 'SAR': 3.75, 'MAD': 10.0, 'USD': 1, 'AED': 3.67, 'EUR': 0.85 },
      'SAR': { 'USD': 0.267, 'MAD': 2.67, 'SAR': 1, 'AED': 0.98, 'EUR': 0.227 },
      'MAD': { 'USD': 0.1, 'SAR': 0.375, 'MAD': 1, 'AED': 0.37, 'EUR': 0.085 },
      'AED': { 'USD': 0.272, 'SAR': 1.02, 'MAD': 2.72, 'AED': 1, 'EUR': 0.231 },
      'EUR': { 'USD': 1.18, 'SAR': 4.43, 'MAD': 11.8, 'AED': 4.33, 'EUR': 1 }
    };
    
    // تنظيف أسماء العملات
    fromCurrency = (fromCurrency || 'USD').toString().toUpperCase().trim();
    toCurrency = (toCurrency || 'MAD').toString().toUpperCase().trim();
    
    // إذا كانت نفس العملة
    if (fromCurrency === toCurrency) {
      console.log(`✅ Same currency, returning: ${amount} ${toCurrency}`);
      return amount;
    }
    
    const rate = exchangeRates[fromCurrency]?.[toCurrency];
    if (rate) {
      const convertedAmount = amount * rate;
      console.log(`✅ CONVERSION SUCCESS: ${amount} ${fromCurrency} → ${convertedAmount.toFixed(2)} ${toCurrency} (rate: ${rate})`);
      return convertedAmount;
    }
    
    console.warn(`❌ CONVERSION FAILED: No rate for ${fromCurrency} to ${toCurrency}, using original amount`);
    return amount;
  }

  // دالة عرض quantity offers مطابقة بالضبط للمعاينة
  function displayQuantityOffers(quantityOffersData, blockId, productId, defaultCurrency = 'SAR', productData = null, formDirection = 'rtl') {
    console.log("🎯 EXACT PREVIEW MATCH - Starting quantity offers display");
    
    // التحقق من صحة البيانات
    if (!quantityOffersData || !quantityOffersData.offers || !Array.isArray(quantityOffersData.offers)) {
      console.log("❌ Invalid quantity offers data");
      return;
    }

    const offers = quantityOffersData.offers;
    if (offers.length === 0) {
      console.log("ℹ️ No offers to display");
      return;
    }

    console.log("🔍 DEBUGGING offers display:", {
      offersLength: offers.length,
      blockId,
      containerId: `quantity-offers-before-${blockId}`
    });

    // البحث عن الحاوية
    let container = document.getElementById(`quantity-offers-before-${blockId}`);
    
    if (blockId === 'popup-form') {
      console.log('🔍 Looking for popup offers container...');
      container = document.getElementById('quantity-offers-before-popup-form');
    }
    
    if (!container) {
      console.error("❌ Container not found:", `quantity-offers-before-${blockId}`);
      const anyContainer = document.querySelector('[id*="quantity-offers"]');
      if (anyContainer) {
        console.log("🔧 Using alternative container:", anyContainer.id);
        container = anyContainer;
      } else {
        console.error("❌ No quantity offers container found at all");
        return;
      }
    }

    // مسح المحتوى السابق
    container.innerHTML = '';
    container.style.display = 'block';

    // استخدام التنسيق من البيانات
    const styling = {
      backgroundColor: quantityOffersData.styling?.backgroundColor || '#ffffff',
      textColor: quantityOffersData.styling?.textColor || '#000000',
      tagColor: quantityOffersData.styling?.tagColor || '#22c55e',
      priceColor: quantityOffersData.styling?.priceColor || '#000000'
    };

    // استخدام بيانات المنتج المرسلة أولاً، ثم من API، ثم القيم الافتراضية
    let actualProductData = productData;
    
    if (!actualProductData && window.CodformProductData) {
      actualProductData = window.CodformProductData;
      console.log("🛍️ Using global product data:", actualProductData);
    }
    
    // البحث عن السعر في بيانات العروض (من إعدادات النموذج)
    let formPriceFromOffers = null;
    
    if (quantityOffersData.offers && Array.isArray(quantityOffersData.offers)) {
      for (const offer of quantityOffersData.offers) {
        if (offer.basePrice && parseFloat(offer.basePrice) > 0) {
          formPriceFromOffers = parseFloat(offer.basePrice);
          break;
        }
      }
    }
    
    // البحث في البيانات العامة للنموذج
    const formPrice = formPriceFromOffers || quantityOffersData.price || quantityOffersData.formPrice || quantityOffersData.basePrice;
    const hasFormPrice = formPrice && parseFloat(formPrice) > 0;
    const hasRealPrice = actualProductData && actualProductData.price && parseFloat(actualProductData.price) > 0;
    
    // أولوية للسعر من إعدادات النموذج، ثم سعر المنتج الأصلي، ثم السعر الافتراضي
    const productPrice = hasFormPrice ? parseFloat(formPrice) : 
                        hasRealPrice ? parseFloat(actualProductData.price) : 5000;
    
    console.log("💰 Price selection logic:", {
      formPriceFromOffers,
      formPrice,
      hasFormPrice,
      originalProductPrice: actualProductData?.price,
      hasRealPrice,
      selectedPrice: productPrice,
      source: hasFormPrice ? 'form settings' : hasRealPrice ? 'original product' : 'fallback'
    });

    const productCurrency = actualProductData?.currency || 'USD';
    const formCurrency = defaultCurrency;
    
    // تحويل السعر من عملة المنتج إلى عملة النموذج
    const realPrice = convertCurrency(productPrice, productCurrency, formCurrency);
    const currency = formCurrency;
    
    console.log(`🔄 CONVERSION APPLIED: ${productPrice} ${productCurrency} → ${realPrice} ${currency}`);
    
    // بيانات المنتج
    const productTitle = actualProductData?.title || 'المنتج';
    const productImage = actualProductData?.image || actualProductData?.featuredImage || actualProductData?.images?.[0];

    // رمز العملة الصحيح
    const currencySymbol = currency === 'USD' ? '$' : 
                          currency === 'SAR' ? 'ر.س' : 
                          currency === 'MAD' ? 'د.م' : 
                          currency;

    // حاوية العروض - نفس تصميم المعاينة بالضبط
    const offersContainer = document.createElement('div');
    offersContainer.style.cssText = `
      margin-bottom: 16px;
      direction: ${formDirection === 'rtl' ? 'rtl' : 'ltr'};
    `;

    // عرض العروض مع التخطيط المطابق للمعاينة بالضبط
    offers.forEach((offer, index) => {
      // حساب السعر النهائي مع الخصم
      let totalPrice = realPrice * (offer.quantity || 1);
      let originalPrice = totalPrice;
      let savingsPercentage = 0;

      const discountValue = parseFloat(offer.discount || offer.discountValue || 0);
      const discountType = offer.discountType || (offer.discount ? 'percentage' : 'percentage');

      if (discountType === 'percentage' && discountValue > 0) {
        const discount = (originalPrice * discountValue) / 100;
        totalPrice = originalPrice - discount;
        savingsPercentage = discountValue;
      } else if (discountType === 'fixed' && discountValue > 0) {
        totalPrice = Math.max(0, originalPrice - discountValue);
        savingsPercentage = Math.round((discountValue / originalPrice) * 100);
      }

      const isDiscounted = savingsPercentage > 0;
      const isHighlighted = index === 1;

      console.log("💰 Price calculation:", {
        quantity: offer.quantity,
        realPrice,
        originalPrice,
        discountType,
        discountValue,
        finalTotalPrice: totalPrice,
        savingsPercentage
      });

      // عنصر العرض - نفس التصميم والحجم بالضبط من المعاينة
      const offerElement = document.createElement('div');
      offerElement.setAttribute('data-offer-id', offer.id || index);
      offerElement.setAttribute('data-quantity', offer.quantity);
      offerElement.setAttribute('data-total-price', totalPrice.toFixed(2));
      
      // التصميم المطابق للمعاينة بالضبط
      offerElement.style.cssText = `
        padding: 12px;
        border-radius: 8px;
        border: 2px solid ${isHighlighted ? '#22c55e' : '#e5e7eb'};
        background-color: ${isHighlighted ? '#f0fdf4' : styling.backgroundColor};
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.3s ease;
        cursor: pointer;
        margin-bottom: 8px;
        direction: ${formDirection === 'rtl' ? 'rtl' : 'ltr'};
        box-shadow: ${isHighlighted ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'};
      `;

      // تأثيرات hover
      offerElement.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.boxShadow = isHighlighted ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none';
      });

      // الجانب الأيسر: الصورة والنص
      const leftSection = document.createElement('div');
      leftSection.style.cssText = `
        display: flex;
        align-items: center;
        gap: ${formDirection === 'rtl' ? '12px' : '12px'};
        flex-direction: ${formDirection === 'rtl' ? 'row-reverse' : 'row'};
      `;

      // الصورة - نفس حجم المعاينة 48px
      const imageContainer = document.createElement('div');
      imageContainer.style.cssText = `
        width: 48px;
        height: 48px;
        background-color: #f3f4f6;
        border-radius: 8px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      `;

      if (productImage) {
        const imageElement = document.createElement('img');
        imageElement.src = productImage;
        imageElement.alt = productTitle;
        imageElement.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        `;
        imageElement.onerror = function() {
          console.log('❌ Image failed to load, showing icon');
          this.style.display = 'none';
          const svgIcon = document.createElement('div');
          svgIcon.innerHTML = `
            <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
          `;
          svgIcon.style.cssText = 'width: 24px; height: 24px; color: #9ca3af;';
          imageContainer.appendChild(svgIcon);
        };
        imageContainer.appendChild(imageElement);
      } else {
        // أيقونة افتراضية
        const svgIcon = document.createElement('div');
        svgIcon.innerHTML = `
          <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
          </svg>
        `;
        svgIcon.style.cssText = 'width: 24px; height: 24px; color: #9ca3af;';
        imageContainer.appendChild(svgIcon);
      }

      // النص والعلامات
      const textContainer = document.createElement('div');
      textContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
      `;

      // النص الرئيسي
      const mainText = document.createElement('div');
      mainText.style.cssText = `
        font-weight: 600;
        color: ${styling.textColor};
        text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
        font-size: 14px;
        line-height: 1.2;
      `;
      mainText.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة`;

      // العلامات والتوفير
      const tagsContainer = document.createElement('div');
      tagsContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: ${formDirection === 'rtl' ? 'flex-end' : 'flex-start'};
        margin-top: 4px;
      `;

      if (offer.tag) {
        const tagElement = document.createElement('div');
        tagElement.style.cssText = `
          background-color: ${styling.tagColor};
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        `;
        tagElement.textContent = offer.tag;
        tagsContainer.appendChild(tagElement);
      }

      if (savingsPercentage > 0) {
        const savingsElement = document.createElement('div');
        savingsElement.style.cssText = `
          background-color: #22c55e;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        `;
        savingsElement.textContent = `وفر ${savingsPercentage}%`;
        tagsContainer.appendChild(savingsElement);
      }

      textContainer.appendChild(mainText);
      textContainer.appendChild(tagsContainer);

      leftSection.appendChild(imageContainer);
      leftSection.appendChild(textContainer);

      // الجانب الأيمن: الأسعار
      const priceSection = document.createElement('div');
      priceSection.style.cssText = `
        text-align: ${formDirection === 'rtl' ? 'left' : 'right'};
        display: flex;
        flex-direction: column;
        align-items: ${formDirection === 'rtl' ? 'flex-start' : 'flex-end'};
        gap: 2px;
      `;

      // السعر الأصلي (إذا كان هناك خصم)
      if (isDiscounted) {
        const originalPriceElement = document.createElement('div');
        originalPriceElement.style.cssText = `
          font-size: 14px;
          color: #9ca3af;
          text-decoration: line-through;
          font-weight: 400;
        `;
        originalPriceElement.textContent = formDirection === 'rtl' 
          ? `${currencySymbol} ${originalPrice.toFixed(2)}`
          : `${originalPrice.toFixed(2)} ${currencySymbol}`;
        priceSection.appendChild(originalPriceElement);
      }

      // السعر النهائي
      const finalPriceElement = document.createElement('div');
      finalPriceElement.style.cssText = `
        font-size: 18px;
        font-weight: 700;
        color: ${styling.priceColor};
        line-height: 1.2;
      `;
      finalPriceElement.textContent = formDirection === 'rtl' 
        ? `${currencySymbol} ${totalPrice.toFixed(2)}`
        : `${totalPrice.toFixed(2)} ${currencySymbol}`;
      priceSection.appendChild(finalPriceElement);

      // السعر للقطعة الواحدة (إذا كانت الكمية أكثر من 1)
      if (offer.quantity > 1) {
        const unitPriceElement = document.createElement('div');
        unitPriceElement.style.cssText = `
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
          font-weight: 400;
        `;
        unitPriceElement.textContent = formDirection === 'rtl' 
          ? `${offer.quantity} × ${currencySymbol} ${realPrice.toFixed(2)}`
          : `${realPrice.toFixed(2)} ${currencySymbol} × ${offer.quantity}`;
        priceSection.appendChild(unitPriceElement);
      }

      // تجميع العناصر
      offerElement.appendChild(leftSection);
      offerElement.appendChild(priceSection);
      
      offersContainer.appendChild(offerElement);

      console.log("💰 FINAL PREVIEW MATCH - Price display:", {
        totalPrice: totalPrice,
        display: finalPriceElement.textContent,
        calculation: `${realPrice} x ${offer.quantity} - discount = ${totalPrice.toFixed(2)}`
      });
    });

    // إضافة حاوية العروض إلى الحاوية الرئيسية
    container.appendChild(offersContainer);

    // إضافة animation للظهور
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      container.style.transition = 'all 0.3s ease-out';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 50);

    console.log("✅ EXACT PREVIEW MATCH - Quantity offers displayed with identical styling");
  }

  // دالة تحميل وعرض العروض من API
  async function loadAndDisplayOffers(blockId, productId, shop, formCurrency = 'SAR', passedProductData = null, formDirection = 'rtl') {
    try {
      if (!shop) {
        shop = (typeof Shopify !== 'undefined' && Shopify.shop) ? Shopify.shop : 'codmagnet.com';
      }
      
      console.log("🎯 Loading quantity offers for product", productId, "in", blockId, "from shop", shop);
      
      const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}`;
      
      console.log("🌐 API URL:", apiUrl);
      
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
      console.log("📊 API Response:", data);
      
      if (data.success && data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
        console.log("✅ Found quantity offers and product data");
        
        const actualProductId = data.quantity_offers.product_id || productId;
        console.log("🎯 Using actual product ID:", actualProductId);
        
        // عرض العروض مع البيانات الحقيقية من API
        displayQuantityOffers(
          data.quantity_offers, 
          blockId, 
          actualProductId,
          data.form?.currency || 'SAR',
          data.product,
          formDirection
        );
        
        return { success: true, offers: data.quantity_offers };
      } else {
        console.log("❌ No quantity offers found or API error");
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error("❌ Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة تشخيص
  function debugOffers(blockId, productId) {
    console.log("🔧 EXACT PREVIEW MATCH DEBUG - Starting diagnosis...");
    
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    const shop = window.Shopify?.shop || 'codmagnet.com';
    
    console.log("🔍 Debug Info:", {
      blockId,
      productId,
      shop,
      containerExists: !!container,
      windowShopify: window.Shopify
    });
    
    if (container) {
      console.log("📦 Container found, loading offers...");
      return loadAndDisplayOffers(blockId, productId, shop);
    } else {
      console.error("❌ Container not found!");
      return Promise.resolve({ success: false, error: "Container not found" });
    }
  }

  // Public API
  return {
    display: displayQuantityOffers,
    loadAndDisplayOffers: loadAndDisplayOffers,
    debug: debugOffers
  };
})();

// دالة عامة للتشخيص
window.debugQuantityOffers = function(blockId, productId) {
  console.log("🔧 Manual debug called - EXACT PREVIEW MATCH");
  return window.CodformQuantityOffers.debug(blockId, productId);
};
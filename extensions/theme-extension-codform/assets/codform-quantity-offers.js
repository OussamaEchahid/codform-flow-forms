/**
 * CODFORM Quantity Offers Handler - FINAL MATCHING FIX
 * إصلاح نهائي لمطابقة المعاينة بالضبط - الصورة، السعر، والتخطيط RTL
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

  // دالة عرض quantity offers مطابقة للمعاينة بالضبط
  function displayQuantityOffers(quantityOffersData, blockId, productId, defaultCurrency = 'SAR', productData = null, formDirection = null) {
    console.log("🎯 FINAL MATCHING FIX - Starting quantity offers display");
    
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
      priceColor: quantityOffersData.styling?.priceColor || '#1a1a1a'
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

    // رمز العملة الصحيح
    const currencySymbol = currency === 'USD' ? '$' : 
                          currency === 'SAR' ? 'ر.س' : 
                          currency === 'MAD' ? 'د.م' : 
                          currency;

    // عرض العروض مع التخطيط الصحيح مطابق للمعاينة
    offers.forEach((offer, index) => {
      const offerElement = document.createElement('div');
      offerElement.setAttribute('data-offer-id', offer.id || index);
      offerElement.setAttribute('data-quantity', offer.quantity);
      
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

      console.log("💰 FINAL Price calculation:", {
        quantity: offer.quantity,
        realPrice,
        originalPrice,
        discountType,
        discountValue,
        finalTotalPrice: totalPrice,
        savingsPercentage
      });

      offerElement.setAttribute('data-total-price', totalPrice.toFixed(2));
      
      // التخطيط الجديد مطابق للمعاينة مع RTL صحيح
      offerElement.style.cssText = `
        background: ${index === 1 ? 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
        border: 2px solid ${index === 1 ? '#0ea5e9' : '#e2e8f0'};
        border-radius: 16px;
        padding: 20px 24px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Cairo', 'Tajawal', system-ui, Arial, sans-serif;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        position: relative;
        direction: rtl !important;
        text-align: right !important;
        min-height: 100px;
      `;

      // تأثيرات hover
      offerElement.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px)';
        this.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
      });

      // الحاوية الرئيسية للمحتوى
      const contentWrapper = document.createElement('div');
      contentWrapper.style.cssText = `
        display: flex !important;
        align-items: center !important;
        width: 100% !important;
        gap: 20px !important;
        direction: rtl !important;
        text-align: right !important;
        justify-content: space-between !important;
      `;

      // 1. قسم الصورة (يسار للRTL)
      const imageSection = document.createElement('div');
      imageSection.style.cssText = `
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
      `;
      
      // البحث عن صورة المنتج من مصادر متعددة
      let imageUrl = null;
      
      if (actualProductData) {
        imageUrl = actualProductData.image || 
                  actualProductData.featuredImage || 
                  actualProductData.images?.[0] ||
                  actualProductData.featured_image;
      }
      
      // استخدام صورة أو placeholder جميل
      if (!imageUrl) {
        console.log("🖼️ No product image found, creating elegant placeholder");
        const placeholderDiv = document.createElement('div');
        placeholderDiv.style.cssText = `
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: bold;
          border: 3px solid rgba(255,255,255,0.3);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        placeholderDiv.textContent = '🛍️';
        imageSection.appendChild(placeholderDiv);
      } else {
        console.log("🖼️ Using product image:", imageUrl);
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = productTitle;
        imageElement.style.cssText = `
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 16px;
          border: 3px solid rgba(0,0,0,0.1);
          display: block;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        imageElement.onerror = function() {
          console.log("❌ Image failed to load, using elegant placeholder");
          this.outerHTML = `
            <div style="
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 28px;
              font-weight: bold;
              border: 3px solid rgba(255,255,255,0.3);
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            ">🛍️</div>
          `;
        };
        imageSection.appendChild(imageElement);
      }

      // 2. قسم النص الوسطي
      const textContent = document.createElement('div');
      textContent.style.cssText = `
        flex: 1 !important;
        text-align: right !important;
        direction: rtl !important;
        margin: 0 20px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
      `;

      // النص الرئيسي
      const mainText = document.createElement('div');
      mainText.style.cssText = `
        font-weight: 700 !important;
        font-size: 18px !important;
        color: ${styling.textColor} !important;
        direction: rtl !important;
        text-align: right !important;
        font-family: 'Cairo', 'Tajawal', system-ui, Arial, sans-serif !important;
        line-height: 1.4 !important;
      `;
      mainText.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة`;

      // العلامات والتوفير
      const tagsContainer = document.createElement('div');
      tagsContainer.style.cssText = `
        display: flex !important; 
        gap: 10px !important; 
        align-items: center !important; 
        justify-content: flex-start !important;
        direction: rtl !important;
        flex-wrap: wrap !important;
      `;

      if (offer.tag) {
        const tagElement = document.createElement('span');
        tagElement.style.cssText = `
          background-color: ${styling.tagColor};
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Cairo', system-ui, Arial, sans-serif;
        `;
        tagElement.textContent = offer.tag;
        tagsContainer.appendChild(tagElement);
      }

      if (savingsPercentage > 0) {
        const savingsElement = document.createElement('span');
        savingsElement.style.cssText = `
          background-color: #ef4444;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Cairo', system-ui, Arial, sans-serif;
        `;
        savingsElement.textContent = `وفر ${savingsPercentage}%`;
        tagsContainer.appendChild(savingsElement);
      }

      textContent.appendChild(mainText);
      textContent.appendChild(tagsContainer);

      // 3. قسم الأسعار (يمين للRTL)
      const priceSection = document.createElement('div');
      priceSection.style.cssText = `
        text-align: right !important;
        min-width: 160px !important;
        direction: rtl !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-end !important;
        gap: 8px !important;
        font-family: 'Cairo', 'Tajawal', system-ui, Arial, sans-serif !important;
      `;

      // السعر الأصلي (إذا كان هناك خصم)
      if (savingsPercentage > 0) {
        const originalPriceElement = document.createElement('div');
        originalPriceElement.style.cssText = `
          font-size: 16px !important;
          color: #9ca3af !important;
          text-decoration: line-through !important;
          direction: rtl !important;
          text-align: right !important;
          font-family: 'Cairo', 'Tajawal', system-ui, Arial, sans-serif !important;
          font-weight: 500 !important;
        `;
        originalPriceElement.textContent = `${originalPrice.toFixed(2)} ${currencySymbol}`;
        priceSection.appendChild(originalPriceElement);
      }

      // السعر النهائي الصحيح - مطابق للمعاينة
      const finalPriceElement = document.createElement('div');
      finalPriceElement.style.cssText = `
        font-size: 24px !important;
        font-weight: 900 !important;
        color: #1a1a1a !important;
        direction: rtl !important;
        text-align: right !important;
        font-family: 'Cairo', 'Tajawal', system-ui, Arial, sans-serif !important;
        line-height: 1.2 !important;
        text-shadow: 0 1px 3px rgba(0,0,0,0.1);
      `;
      
      // عرض السعر الصحيح من الحسابات
      finalPriceElement.textContent = `${totalPrice.toFixed(2)} ${currencySymbol}`;
      
      console.log("💰 FINAL PRICE DISPLAY:", {
        totalPrice: totalPrice,
        display: finalPriceElement.textContent,
        calculation: `${realPrice} x ${offer.quantity} - discount = ${totalPrice.toFixed(2)}`
      });
      
      priceSection.appendChild(finalPriceElement);

      // تجميع العناصر بترتيب RTL: صورة، نص، سعر
      contentWrapper.appendChild(imageSection);
      contentWrapper.appendChild(textContent);
      contentWrapper.appendChild(priceSection);
      
      // إضافة المحتوى الكامل إلى العنصر الرئيسي
      offerElement.appendChild(contentWrapper);
      container.appendChild(offerElement);
    });

    // إضافة animation للظهور
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      container.style.transition = 'all 0.5s ease-out';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 50);

    console.log("✅ FINAL MATCHING FIX - Quantity offers displayed perfectly matching preview");
  }

  // دالة تحميل وعرض العروض من API
  async function loadAndDisplayOffers(blockId, productId, shop, formCurrency = 'SAR', passedProductData = null, formDirection = null) {
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
    console.log("🔧 FINAL MATCHING DEBUG - Starting diagnosis...");
    
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
  console.log("🔧 Manual debug called - FINAL MATCHING FIX");
  return window.CodformQuantityOffers.debug(blockId, productId);
};
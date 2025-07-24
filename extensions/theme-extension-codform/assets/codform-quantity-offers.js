
/**
 * CODFORM Quantity Offers Handler - PRECISE FIX
 * إصلاح دقيق لعرض عروض الكمية بدون تخريب النموذج
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // دالة تحويل العملة
  function convertCurrency(amount, fromCurrency, toCurrency) {
    // معدلات التحويل المبسطة (يمكن تحسينها لاحقاً بـ API حقيقي)
    const exchangeRates = {
      'USD': { 'SAR': 3.75, 'MAD': 10.0, 'USD': 1 },
      'SAR': { 'USD': 0.27, 'MAD': 2.67, 'SAR': 1 },
      'MAD': { 'USD': 0.10, 'SAR': 0.375, 'MAD': 1 }
    };
    
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const rate = exchangeRates[fromCurrency]?.[toCurrency];
    if (rate) {
      return amount * rate;
    }
    
    // إذا لم يتم العثور على معدل التحويل، إرجاع المبلغ كما هو
    console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    return amount;
  }

  // دالة عرض quantity offers مع استخدام البيانات الصحيحة من API
  function displayQuantityOffers(quantityOffersData, blockId, productId, defaultCurrency = 'SAR', productData = null) {
    console.log("🎯 PRECISE FIX - Starting quantity offers display");
    
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

    // البحث عن الحاوية
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    if (!container) {
      console.error("❌ Container not found:", `quantity-offers-before-${blockId}`);
      return;
    }

    // مسح المحتوى السابق
    container.innerHTML = '';
    container.style.display = 'block';

    // استخدام التنسيق من البيانات مع لون أسود افتراضي للسعر
    const styling = {
      backgroundColor: quantityOffersData.styling?.backgroundColor || '#ffffff',
      textColor: quantityOffersData.styling?.textColor || '#000000',
      tagColor: quantityOffersData.styling?.tagColor || '#22c55e',
      priceColor: quantityOffersData.styling?.priceColor || '#000000' // اللون الافتراضي أسود
    };

      // استخدام بيانات المنتج الحقيقية من API مع التحقق المحسن
      const hasRealPrice = productData && productData.price && parseFloat(productData.price) > 0;
      const productPrice = hasRealPrice ? parseFloat(productData.price) : 5000;
      const productCurrency = productData?.currency || 'USD';
      const formCurrency = defaultCurrency; // عملة النموذج
      
      // تحويل السعر من عملة المنتج إلى عملة النموذج
      const realPrice = convertCurrency(productPrice, productCurrency, formCurrency);
      const currency = formCurrency; // استخدام عملة النموذج
      const productImage = productData?.image || productData?.featuredImage;
      const productTitle = productData?.title || 'المنتج';

      console.log("💰 CURRENCY CONVERSION:", {
        productPrice,
        productCurrency,
        formCurrency,
        convertedPrice: realPrice,
        conversionApplied: productCurrency !== formCurrency
      });

    // استمرار العمل مع السعر (حقيقي أو افتراضي)
    console.log(`💰 Using price: ${realPrice} (${hasRealPrice ? 'real' : 'fallback'})`);

    // رمز العملة الصحيح
    const currencySymbol = currency === 'USD' ? '$' : 
                          currency === 'SAR' ? 'ر.س' : 
                          currency === 'MAD' ? 'د.م' : 
                          currency;

    // عرض العروض مع إمكانية التحديد
    offers.forEach((offer, index) => {
      const offerElement = document.createElement('div');
      offerElement.setAttribute('data-offer-id', offer.id || index);
      offerElement.setAttribute('data-quantity', offer.quantity);
      // حساب السعر النهائي مع الخصم مسبقاً
      const calculatedTotalPrice = (() => {
        let total = realPrice * (offer.quantity || 1);
        const discountValue = parseFloat(offer.discount || offer.discountValue || 0);
        const discountType = offer.discountType || (offer.discount ? 'percentage' : 'percentage');
        
        if (discountType === 'percentage' && discountValue > 0) {
          total = total - (total * discountValue / 100);
        } else if (discountType === 'fixed' && discountValue > 0) {
          total = Math.max(0, total - discountValue);
        }
        
        console.log("💰 Pre-calculated total price:", {
          originalTotal: realPrice * (offer.quantity || 1),
          discountType,
          discountValue,
          finalTotal: total
        });
        
        return total;
      })();
      
      offerElement.setAttribute('data-total-price', calculatedTotalPrice.toFixed(2));
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
        position: relative;
        ${index === 1 ? 'background-color: #f0fdf4;' : ''}
      `;

      // إضافة وظيفة التحديد
      offerElement.addEventListener('click', function() {
        // إزالة التحديد من العروض الأخرى
        const allOffers = container.querySelectorAll('[data-offer-id]');
        allOffers.forEach(el => {
          el.style.borderColor = '#e5e7eb';
          el.style.backgroundColor = styling.backgroundColor;
          el.querySelector('.selected-indicator')?.remove();
        });
        
        // تحديد العرض الحالي
        this.style.borderColor = '#22c55e';
        this.style.backgroundColor = '#f0fdf4';
        
        // إضافة مؤشر التحديد
        const indicator = document.createElement('div');
        indicator.className = 'selected-indicator';
        indicator.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          background-color: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: bold;
        `;
        indicator.innerHTML = '✓';
        this.appendChild(indicator);
        
        // حفظ البيانات المحددة مع السعر المحسوب
        const calculatedPrice = parseFloat(this.getAttribute('data-total-price'));
        window.selectedQuantityOffer = {
          quantity: parseInt(this.getAttribute('data-quantity')),
          totalPrice: calculatedPrice,
          currency: currency,
          text: offer.text,
          originalPrice: realPrice * parseInt(this.getAttribute('data-quantity')),
          savings: savingsPercentage
        };
        
        console.log("✅ Offer selected:", window.selectedQuantityOffer);
      });

      // تأثيرات hover
      offerElement.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      });

      // تخطيط صحيح للعربية - الصورة على اليسار، النص على اليمين، السعر في المنتصف
      const contentWrapper = document.createElement('div');
      contentWrapper.style.cssText = `
        display: flex;
        align-items: center;
        width: 100%;
        gap: 12px;
        direction: rtl;
        cursor: pointer;
      `;

      // الصورة على اليسار (ترتيب 1)
      const imageSection = document.createElement('div');
      imageSection.style.cssText = `
        order: 1;
        flex-shrink: 0;
      `;
      
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
          display: block;
        `;
        imageElement.onerror = function() {
          console.log("❌ Image failed to load:", productImage);
          this.style.display = 'none';
        };
        imageSection.appendChild(imageElement);
      }

      // محتوى النص (ترتيب 2 - على اليمين)
      const textContent = document.createElement('div');
      textContent.style.cssText = `
        flex: 1;
        text-align: right;
        direction: rtl;
        order: 2;
      `;

      // النص الرئيسي
      const mainText = document.createElement('div');
      mainText.style.cssText = `
        font-weight: 600;
        font-size: 16px;
        color: ${styling.textColor};
        margin-bottom: 8px;
        direction: rtl;
        text-align: right;
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

      // حساب الخصم وعرض نسبة التوفير باستخدام السعر الصحيح
      let totalPrice = realPrice * (offer.quantity || 1);
      let originalPrice = totalPrice;
      let savingsPercentage = 0;

      // تحويل قيم الخصم إلى أرقام وتحديد النوع الصحيح
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

      console.log("💰 FIXED Price calculation:", {
        quantity: offer.quantity,
        realPrice,
        originalPrice,
        discountType,
        discountValue,
        calculatedTotalPrice: totalPrice,
        savingsPercentage,
        offerStructure: offer
      });

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

      // قسم الأسعار (ترتيب 3 - في المنتصف)
      const priceSection = document.createElement('div');
      priceSection.style.cssText = `
        text-align: center;
        min-width: 100px;
        direction: ltr;
        order: 3;
      `;

      // السعر الأصلي (إذا كان هناك خصم)
      if (savingsPercentage > 0) {
        const originalPriceElement = document.createElement('div');
        originalPriceElement.style.cssText = `
          font-size: 12px;
          color: #6b7280;
          text-decoration: line-through;
          margin-bottom: 4px;
          direction: ltr;
        `;
        originalPriceElement.textContent = `${originalPrice.toFixed(2)} ${currencySymbol}`;
        priceSection.appendChild(originalPriceElement);
      }

      // السعر النهائي الصحيح
      const finalPriceElement = document.createElement('div');
      finalPriceElement.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: ${styling.priceColor};
        direction: ltr;
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
          direction: ltr;
        `;
        perItemElement.textContent = `${realPrice.toFixed(2)} ${currencySymbol} × ${offer.quantity}`;
        priceSection.appendChild(perItemElement);
      }

      // تجميع العناصر بترتيب صحيح للعربية: صورة، نص، سعر
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

    console.log("✅ PRECISE FIX - Quantity offers displayed with correct pricing");
  }

  // دالة تحميل وعرض العروض من API مع تحسينات
  async function loadAndDisplayOffers(blockId, productId, shop) {
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
      
      // التحقق من وجود العروض والبيانات
      if (data.success && data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
        console.log("✅ Found quantity offers and product data");
        
        // استخدام product_id من بيانات العرض، وليس من URL
        const actualProductId = data.quantity_offers.product_id || productId;
        console.log("🎯 Using product ID from offer data:", actualProductId, "instead of URL product:", productId);
        
        // عرض العروض مع البيانات الحقيقية من API
        displayQuantityOffers(
          data.quantity_offers, 
          blockId, 
          actualProductId, // استخدام معرف المنتج من العرض
          data.form?.currency || 'SAR',
          data.product // البيانات الحقيقية من API
        );
        
        return { success: true, offers: data.quantity_offers };
      } else {
        console.log("ℹ️ No quantity offers found");
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error("❌ Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة تشخيص محسنة
  function debugOffers(blockId, productId) {
    console.log("🔧 PRECISE FIX DEBUG - Starting diagnosis...");
    
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    const shop = window.Shopify?.shop || window.location.hostname.replace('www.', '');
    
    console.log("🔍 Debug Info:", {
      blockId,
      productId,
      shop,
      containerExists: !!container
    });
    
    if (container) {
      console.log("📦 Container found, loading offers...");
      return loadAndDisplayOffers(blockId, productId, shop);
    } else {
      console.error("❌ Container not found!");
      return Promise.resolve({ success: false, error: "Container not found" });
    }
  }

  // Enhanced load function with currency support
  function loadAndDisplayOffersWithCurrency(blockId, productId, shop, formCurrency = 'SAR') {
    console.log("💰 Loading quantity offers with currency:", formCurrency);
    
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    if (!container) {
      console.error("❌ Container not found:", `quantity-offers-before-${blockId}`);
      return;
    }

    const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${shop}&product=${productId}&blockId=${blockId}`;
    
    console.log("🔄 Fetching quantity offers from:", apiUrl);
    
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("✅ Quantity offers data received:", data);
        
        if (data.success && data.quantity_offers && data.product) {
          // استخدام عملة النموذج بدلاً من عملة المنتج الافتراضية
          const productData = {
            ...data.product,
            currency: formCurrency // استخدام عملة النموذج
          };
          
          displayQuantityOffers(data.quantity_offers, blockId, productId, formCurrency, productData);
        } else {
          console.log("ℹ️ No quantity offers found or data incomplete");
        }
      })
      .catch(error => {
        console.error("❌ Error loading quantity offers:", error);
      });
  }

  // Public API
  return {
    display: displayQuantityOffers,
    load: loadAndDisplayOffers,
    loadWithCurrency: loadAndDisplayOffersWithCurrency,
    debug: debugOffers
  };
})();

// دالة عامة للتشخيص
window.debugQuantityOffers = function(blockId, productId) {
  console.log("🔧 Manual debug called - PRECISE FIX");
  return window.CodformQuantityOffers.debug(blockId, productId);
};


/**
 * CODFORM Quantity Offers Handler - PRECISE FIX
 * إصلاح دقيق لعرض عروض الكمية بدون تخريب النموذج
 */

window.CodformQuantityOffers = (function() {
  'use strict';

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

    // استخدام التنسيق من البيانات
    const styling = quantityOffersData.styling || {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      tagColor: '#22c55e',
      priceColor: '#ef4444'
    };

      // استخدام بيانات المنتج الحقيقية من API بدلاً من window.meta.product
      const hasRealPrice = productData && productData.price && productData.price > 0;
      const realPrice = hasRealPrice ? parseFloat(productData.price) : null;
      const currency = productData?.currency || defaultCurrency;
      const productImage = productData?.image;
      const productTitle = productData?.title || 'المنتج';

      console.log("💰 Using API product data:", {
        hasRealPrice,
        realPrice,
        currency,
        productTitle,
        hasImage: !!productImage,
        originalPrice: productData?.price
      });

    console.log("💰 Using API product data:", {
      hasRealPrice,
      realPrice,
      currency,
      productTitle,
      hasImage: !!productImage
    });

    // إذا لم يكن هناك سعر حقيقي، عرض رسالة تحذيرية
    if (!hasRealPrice) {
      console.log("⚠️ No real price available");
      const warningDiv = document.createElement('div');
      warningDiv.style.cssText = `
        background-color: #fef3c7;
        border: 2px dashed #f59e0b;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        text-align: center;
        font-family: 'Cairo', system-ui, Arial, sans-serif;
        color: #92400e;
      `;
      warningDiv.innerHTML = `
        <p style="margin: 0; font-weight: 600;">⚠️ لا توجد بيانات سعر حقيقية للمنتج</p>
        <p style="margin: 4px 0 0 0; font-size: 14px;">يرجى التأكد من ربط المنتج بشكل صحيح</p>
      `;
      container.appendChild(warningDiv);
      return;
    }

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

      // تأثيرات hover
      offerElement.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      });

      // تخطيط محسن للعربية - النص على اليمين، الصورة في المنتصف، السعر على اليسار
      const contentWrapper = document.createElement('div');
      contentWrapper.style.cssText = `
        display: flex;
        align-items: center;
        width: 100%;
        gap: 12px;
        direction: rtl;
      `;

      // محتوى النص (الجانب الأيمن للعربية)
      const textContent = document.createElement('div');
      textContent.style.cssText = `
        flex: 1;
        text-align: right;
        direction: rtl;
        order: 1;
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

      // إضافة الصورة في الوسط (ترتيب 2)
      const imageSection = document.createElement('div');
      imageSection.style.cssText = `
        order: 2;
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

      // قسم الأسعار (الجانب الأيسر للعربية - ترتيب 3)
      const priceSection = document.createElement('div');
      priceSection.style.cssText = `
        text-align: left;
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

      // تجميع العناصر بترتيب مناسب للعربية
      contentWrapper.appendChild(textContent);
      contentWrapper.appendChild(imageSection);
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
        
        // عرض العروض مع البيانات الحقيقية من API
        displayQuantityOffers(
          data.quantity_offers, 
          blockId, 
          productId, 
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

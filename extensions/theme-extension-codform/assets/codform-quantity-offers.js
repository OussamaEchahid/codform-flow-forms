
/**
 * CODFORM Quantity Offers Handler - LOGICAL SOLUTION
 * حل منطقي وبسيط لعرض عروض الكمية
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // دالة عرض quantity offers بطريقة منطقية وبسيطة
  function displayQuantityOffers(quantityOffersData, blockId, productId, defaultCurrency = 'SAR', productData = null) {
    console.log("🎯 LOGICAL SOLUTION - Starting quantity offers display");
    console.log("📦 Data received:", { quantityOffersData, productData, defaultCurrency });
    
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

    console.log("🎨 Using styling:", styling);

    // التحقق من وجود بيانات منتج حقيقية
    const hasRealPrice = productData && productData.price && productData.price > 0;
    const realPrice = hasRealPrice ? parseFloat(productData.price) : null;
    const currency = productData?.currency || defaultCurrency;
    const productImage = productData?.image;
    const productTitle = productData?.title || 'المنتج';

    console.log("💰 Product info:", {
      hasRealPrice,
      realPrice,
      currency,
      hasImage: !!productImage,
      productTitle
    });

    // إذا لم يكن هناك سعر حقيقي، عرض رسالة تحذيرية
    if (!hasRealPrice) {
      console.log("⚠️ No real price available - showing warning");
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

    // رمز العملة
    const currencySymbol = currency === 'USD' ? '$' : 
                          currency === 'SAR' ? 'ر.س' : 
                          currency === 'MAD' ? 'د.م' : 
                          currency;

    // عرض العروض
    offers.forEach((offer, index) => {
      console.log(`🎁 Processing offer ${index + 1}:`, offer);
      
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

      // إضافة تأثيرات hover
      offerElement.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      });

      // الجزء الأيسر: الصورة والنص
      const leftSection = document.createElement('div');
      leftSection.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      `;

      // صورة المنتج
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
          console.log("❌ Image failed to load:", productImage);
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

      // حساب الخصم وعرض نسبة التوفير
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
      priceSection.style.cssText = `
        text-align: center;
        min-width: 100px;
      `;

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

      // السعر لكل قطعة (إذا كان أكثر من قطعة واحدة)
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
    });

    // إضافة animation للظهور
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      container.style.transition = 'all 0.5s ease-out';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 50);

    console.log("✅ LOGICAL SOLUTION - Quantity offers displayed successfully");
  }

  // دالة تحميل وعرض العروض من API
  async function loadAndDisplayOffers(blockId, productId, shop) {
    try {
      console.log("🔍 LOGICAL SOLUTION - Loading offers for:", { blockId, productId, shop });
      
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
      console.log("📦 LOGICAL SOLUTION - API Response:", data);
      
      // التحقق من وجود العروض والبيانات
      if (data.success && data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
        console.log("✅ Found quantity offers and product data");
        
        // عرض العروض فوراً مع البيانات الحقيقية من API
        displayQuantityOffers(
          data.quantity_offers, 
          blockId, 
          productId, 
          data.form?.currency || 'SAR',
          data.product // هذه البيانات الحقيقية من API
        );
        
        return { success: true, offers: data.quantity_offers };
      } else {
        console.log("ℹ️ No quantity offers found for this product");
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error("❌ LOGICAL SOLUTION - Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة تشخيص للاختبار
  function debugOffers(blockId, productId) {
    console.log("🔧 LOGICAL SOLUTION DEBUG - Starting diagnosis...");
    
    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    const shop = window.Shopify?.shop || window.location.hostname.replace('www.', '');
    
    console.log("🔍 Debug Info:", {
      blockId,
      productId,
      shop,
      containerExists: !!container,
      containerId: `quantity-offers-before-${blockId}`
    });
    
    if (container) {
      console.log("📦 Container found, attempting to load offers...");
      return loadAndDisplayOffers(blockId, productId, shop);
    } else {
      console.error("❌ Container not found!");
      return Promise.resolve({ success: false, error: "Container not found" });
    }
  }

  // Public API
  return {
    display: displayQuantityOffers,
    load: loadAndDisplayOffers,
    debug: debugOffers
  };
})();

// دالة عامة للتشخيص - يمكن استدعاؤها من console
window.debugQuantityOffers = function(blockId, productId) {
  console.log("🔧 Manual debug called - LOGICAL SOLUTION");
  return window.CodformQuantityOffers.debug(blockId, productId);
};

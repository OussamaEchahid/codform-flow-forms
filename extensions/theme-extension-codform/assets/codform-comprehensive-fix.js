/**
 * CODFORM COMPREHENSIVE FIX - Quantity Offers & Form Handler
 * حل شامل لإصلاح عرض quantity offers وإدارة النماذج
 */

(function() {
  'use strict';
  
  console.log("🚀 COMPREHENSIVE FIX - Loading comprehensive handler");

  // تأكد من أن النص موجه لليمين للعربية
  const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

  // دالة عرض quantity offers محسنة
  function displayQuantityOffers(quantityOffersData, blockId, productId) {
    console.log("🎁 COMPREHENSIVE FIX - Displaying quantity offers:", quantityOffersData);
    
    if (!quantityOffersData) {
      console.log("❌ No quantity offers data");
      return false;
    }

    // التحقق من بنية البيانات
    let offers = [];
    if (quantityOffersData.offers && Array.isArray(quantityOffersData.offers)) {
      offers = quantityOffersData.offers;
    } else if (Array.isArray(quantityOffersData)) {
      offers = quantityOffersData;
    }

    if (!offers.length) {
      console.log("❌ No offers found in data");
      return false;
    }

    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    if (!container) {
      console.error("❌ Quantity offers container not found:", `quantity-offers-before-${blockId}`);
      return false;
    }

    // مسح المحتوى السابق
    container.innerHTML = '';
    
    // التنسيق
    const styling = quantityOffersData.styling || {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      tagColor: '#22c55e', 
      priceColor: '#ef4444'
    };

    console.log(`🎨 COMPREHENSIVE FIX - Using styling:`, styling);
    console.log(`🔢 COMPREHENSIVE FIX - Rendering ${offers.length} offers`);

    // إنشاء العناصر
    const wrapper = document.createElement('div');
    wrapper.className = 'codform-quantity-offers-wrapper';
    wrapper.style.cssText = `
      margin-bottom: 20px;
      padding: 0;
      font-family: 'Cairo', system-ui, Arial, sans-serif;
    `;

    offers.forEach((offer, index) => {
      const offerElement = document.createElement('div');
      offerElement.className = `codform-quantity-offer-item offer-${index}`;
      offerElement.style.cssText = `
        background: linear-gradient(135deg, ${styling.backgroundColor}f0, ${styling.backgroundColor});
        color: ${styling.textColor};
        border: 2px solid ${styling.tagColor};
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        position: relative;
        overflow: hidden;
      `;

      // تأثير hover
      offerElement.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        this.style.borderColor = styling.priceColor;
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        this.style.borderColor = styling.tagColor;
      });

      // العنصر الأيسر - النص والعلامة
      const leftContent = document.createElement('div');
      leftContent.style.cssText = `
        display: flex;
        align-items: center;
        flex: 1;
        gap: 12px;
      `;

      // أيقونة العرض
      const iconElement = document.createElement('div');
      iconElement.style.cssText = `
        width: 48px;
        height: 48px;
        background: ${styling.tagColor};
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        flex-shrink: 0;
      `;
      iconElement.innerHTML = '🎁';

      // النص الرئيسي
      const textContainer = document.createElement('div');
      textContainer.style.cssText = 'flex: 1;';

      const tagElement = document.createElement('div');
      tagElement.style.cssText = `
        background: ${styling.tagColor};
        color: white;
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: 600;
        display: inline-block;
        margin-bottom: 6px;
        direction: rtl;
        text-align: center;
      `;
      tagElement.textContent = offer.tag || `اشترِ ${offer.quantity || 1} قطعة`;

      const textElement = document.createElement('div');
      textElement.style.cssText = `
        font-size: 16px;
        font-weight: 500;
        line-height: 1.4;
        color: ${styling.textColor};
        direction: rtl;
        text-align: right;
      `;
      textElement.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة واحصل على خصم مميز`;

      textContainer.appendChild(tagElement);
      textContainer.appendChild(textElement);

      leftContent.appendChild(iconElement);
      leftContent.appendChild(textContainer);

      // العنصر الأيمن - السعر/الخصم
      const rightContent = document.createElement('div');
      rightContent.style.cssText = `
        text-align: center;
        min-width: 90px;
        flex-shrink: 0;
      `;

      if (offer.discountType && offer.discountType !== 'none' && offer.discountValue > 0) {
        const discountLabel = document.createElement('div');
        discountLabel.style.cssText = `
          font-size: 12px;
          color: ${styling.textColor};
          opacity: 0.8;
          margin-bottom: 2px;
        `;
        discountLabel.textContent = 'توفير';

        const discountValue = document.createElement('div');
        discountValue.style.cssText = `
          font-size: 18px;
          font-weight: 700;
          color: ${styling.priceColor};
          line-height: 1;
        `;
        
        if (offer.discountType === 'percentage') {
          discountValue.textContent = `${offer.discountValue}%`;
        } else {
          discountValue.textContent = `${offer.discountValue} ر.س`;
        }

        rightContent.appendChild(discountLabel);
        rightContent.appendChild(discountValue);
      } else {
        const specialLabel = document.createElement('div');
        specialLabel.style.cssText = `
          font-size: 14px;
          font-weight: 600;
          color: ${styling.tagColor};
          padding: 8px 12px;
          background: ${styling.tagColor}20;
          border-radius: 20px;
        `;
        specialLabel.textContent = 'عرض خاص';
        rightContent.appendChild(specialLabel);
      }

      // تجميع العناصر
      offerElement.appendChild(leftContent);
      offerElement.appendChild(rightContent);
      wrapper.appendChild(offerElement);
    });

    // إضافة العناصر للحاوي
    container.appendChild(wrapper);
    container.style.display = 'block';

    // تطبيق تأثير الظهور التدريجي
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      wrapper.style.transition = 'all 0.6s ease-out';
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'translateY(0)';
    }, 100);

    console.log("✅ COMPREHENSIVE FIX - Quantity offers displayed successfully");
    return true;
  }

  // دالة تحميل البيانات من API
  async function loadFormAndOffers(blockId) {
    console.log("🔍 COMPREHENSIVE FIX - Loading form and offers for block:", blockId);
    
    try {
      const container = document.getElementById(`codform-container-${blockId}`);
      if (!container) {
        throw new Error("Container not found");
      }

      const productId = container.getAttribute('data-product-id');
      const shop = window.Shopify?.shop || window.location.hostname.replace('www.', '');

      if (!productId || !shop) {
        throw new Error("Missing productId or shop");
      }

      console.log("📊 COMPREHENSIVE FIX - API Request:", { shop, productId, blockId });

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
      console.log("📦 COMPREHENSIVE FIX - API Response:", data);

      // عرض quantity offers
      if (data.quantity_offers) {
        console.log("🎁 COMPREHENSIVE FIX - Processing quantity offers");
        const offersDisplayed = displayQuantityOffers(data.quantity_offers, blockId, productId);
        if (!offersDisplayed) {
          console.warn("⚠️ Failed to display quantity offers");
        }
      } else {
        console.log("ℹ️ COMPREHENSIVE FIX - No quantity offers found");
      }

      return {
        success: true,
        data: data,
        hasOffers: !!data.quantity_offers
      };

    } catch (error) {
      console.error("❌ COMPREHENSIVE FIX - Error loading data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // دالة التشخيص للاختبار
  function debugComprehensiveFix(blockId, productId) {
    console.log("🔧 COMPREHENSIVE FIX - Debug mode activated");
    
    const container = document.getElementById(`codform-container-${blockId}`);
    const offersContainer = document.getElementById(`quantity-offers-before-${blockId}`);
    
    console.log("🔍 Debug Information:", {
      blockId,
      productId,
      containerExists: !!container,
      offersContainerExists: !!offersContainer,
      shopifyShop: window.Shopify?.shop,
      hostname: window.location.hostname
    });

    if (productId) {
      return loadFormAndOffers(blockId);
    } else if (container) {
      const detectedProductId = container.getAttribute('data-product-id');
      console.log("🎯 Using detected product ID:", detectedProductId);
      return loadFormAndOffers(blockId);
    } else {
      return Promise.resolve({ 
        success: false, 
        error: "No container or product ID found" 
      });
    }
  }

  // إتاحة الدوال عالمياً للاستخدام
  window.CodformComprehensiveFix = {
    displayOffers: displayQuantityOffers,
    loadData: loadFormAndOffers,
    debug: debugComprehensiveFix
  };

  // دالة تشخيص عامة
  window.debugCodformComprehensive = function(blockId, productId) {
    return debugComprehensiveFix(blockId, productId);
  };

  // تشغيل تلقائي عند تحميل الصفحة
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      const containers = document.querySelectorAll('[id*="codform-container-"]');
      containers.forEach(container => {
        const blockId = container.id.replace('codform-container-', '');
        const productId = container.getAttribute('data-product-id');
        
        if (blockId && productId) {
          console.log("🔄 Auto-loading for container:", blockId);
          loadFormAndOffers(blockId);
        }
      });
    }, 1000);
  });

  console.log("✅ COMPREHENSIVE FIX - Handler loaded successfully");

})();

/**
 * CODFORM COMPREHENSIVE FIX - Enhanced Quantity Offers Handler v3.0
 * حل شامل محدث لإصلاح عرض quantity offers وإدارة النماذج
 */

(function() {
  'use strict';
  
  console.log("🚀 COMPREHENSIVE FIX v3.0 - Loading enhanced comprehensive handler");

  // تأكد من أن النص موجه لليمين للعربية
  const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

  // دالة عرض quantity offers محسنة ومطورة - مع منع التكرار
  function displayQuantityOffers(quantityOffersData, blockId, productId) {
    console.log("🎁 COMPREHENSIVE FIX v3.0 - Displaying quantity offers:", quantityOffersData);
    
    if (!quantityOffersData) {
      console.log("❌ No quantity offers data provided");
      return false;
    }

    // حذف العنصر المكرر الذي يستخدم .quantity-offers-list
    const duplicateOffers = document.querySelectorAll('.quantity-offers-list');
    if (duplicateOffers.length > 0) {
      console.log(`🗑️ Removing ${duplicateOffers.length} duplicate .quantity-offers-list elements`);
      duplicateOffers.forEach(element => {
        element.remove();
      });
    }

    // منع التكرار - فحص وحذف أي عروض موجودة مسبقاً في الصفحة
    const existingOffers = document.querySelectorAll(
      '.codform-quantity-offers-wrapper, .quantity-offer-item, [class*="quantity-offer"]'
    );
    
    if (existingOffers.length > 0) {
      console.log(`⚠️ Found ${existingOffers.length} existing offers, removing to prevent duplication`);
      existingOffers.forEach(element => {
        element.remove();
      });
    }

    // التحقق من بنية البيانات المحسنة
    let offers = [];
    let styling = {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      tagColor: '#22c55e', 
      priceColor: '#ef4444'
    };
    let position = 'before_form';

    // استخراج البيانات بطريقة أكثر مرونة
    if (quantityOffersData.offers && Array.isArray(quantityOffersData.offers)) {
      offers = quantityOffersData.offers;
      styling = quantityOffersData.styling || styling;
      position = quantityOffersData.position || position;
      console.log("✅ Found offers in structured data:", offers.length);
    } else if (Array.isArray(quantityOffersData)) {
      offers = quantityOffersData;
      console.log("✅ Found offers as direct array:", offers.length);
    } else {
      console.log("❌ Unexpected data structure:", typeof quantityOffersData);
      return false;
    }
    
    if (!offers.length) {
      console.log("❌ No offers found in data");
      return false;
    }

    // البحث عن الحاوي بأولوية داخل النموذج أولاً - مع فرض إنشاء الحاوي إذا لم يكن موجوداً
    const prioritizedSelectors = [
      `quantity-offers-inside-${blockId}`,  // أولوية عالية
      `quantity-offers-before-${blockId}`,  // أولوية متوسطة
      `quantity-offers-after-${blockId}`    // أولوية منخفضة
    ];
    
    let container = null;
    let selectedPosition = null;
    
    // اختيار أول حاوي متاح بحسب الأولوية
    for (const selector of prioritizedSelectors) {
      const potentialContainer = document.getElementById(selector);
      if (potentialContainer) {
        console.log(`✅ Found container: ${selector}`);
        container = potentialContainer;
        selectedPosition = selector;
        break;
      }
    }
    
    // إنشاء حاوي مؤقت إذا لم يتم العثور على أي حاوي
    if (!container) {
      console.log("⚠️ No quantity offers container found, creating temporary container");
      const formContainer = document.getElementById(`codform-container-${blockId}`);
      if (formContainer) {
        container = document.createElement('div');
        container.id = `quantity-offers-inside-${blockId}`;
        // إدراج الحاوي في بداية النموذج
        formContainer.insertBefore(container, formContainer.firstChild);
        selectedPosition = `quantity-offers-inside-${blockId}`;
      }
    }
    
    if (!container) {
      console.error("❌ No quantity offers container found for any position");
      return false;
    }

    console.log("✅ Container found, clearing and setting up content");
    
    // تنظيف الحاوي وإعداده
    container.innerHTML = '';
    container.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      margin: 20px 0;
      position: relative;
      z-index: 1;
    `;

    console.log(`🎨 Using styling:`, styling);
    console.log(`🔢 Rendering ${offers.length} offers`);

    // إنشاء العناصر المحسنة
    const wrapper = document.createElement('div');
    wrapper.className = 'codform-quantity-offers-wrapper';
    wrapper.style.cssText = `
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: rtl;
      text-align: right;
      margin: 0;
      padding: 0;
    `;

    offers.forEach((offer, index) => {
      console.log(`🎁 Processing offer ${index + 1}:`, offer);
      
      const isHighlighted = index === 1; // تمييز العرض الثاني
      
      const offerElement = document.createElement('div');
      offerElement.className = `codform-quantity-offer-item offer-${index} ${isHighlighted ? 'highlighted' : ''}`;
      offerElement.style.cssText = `
        background: ${isHighlighted ? '#f0fdf4' : styling.backgroundColor || '#ffffff'};
        color: ${styling.textColor || '#1f2937'};
        border: 2px solid ${isHighlighted ? '#22c55e' : '#d1d5db'};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: ${isHighlighted ? '0 4px 12px rgba(34, 197, 94, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.08)'};
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        direction: rtl;
        text-align: right;
      `;

      // تأثير hover مبسط ومتناسق
      offerElement.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = isHighlighted ? '0 4px 12px rgba(34, 197, 94, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.08)';
      });

      // إضافة شارة "الأكثر شعبية" للعرض المميز
      if (isHighlighted) {
        const popularBadge = document.createElement('div');
        popularBadge.style.cssText = `
          position: absolute;
          top: 0;
          right: 0;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          padding: 4px 12px;
          font-size: 10px;
          font-weight: 600;
          border-bottom-left-radius: 8px;
          z-index: 10;
        `;
        popularBadge.textContent = 'الأكثر شعبية';
        offerElement.appendChild(popularBadge);
      }

      // المحتوى الأيسر
      const leftContent = document.createElement('div');
      leftContent.style.cssText = `
        display: flex;
        align-items: center;
        flex: 1;
        gap: 15px;
        direction: rtl;
      `;

      // أيقونة العرض المطابقة للمعاينة
      const iconElement = document.createElement('div');
      iconElement.style.cssText = `
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #f8fafc, #e2e8f0);
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      `;
      iconElement.innerHTML = `
        <svg width="26" height="26" fill="#64748b" viewBox="0 0 24 24">
          <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
        </svg>
      `;

      // النص الرئيسي المحسن
      const textContainer = document.createElement('div');
      textContainer.style.cssText = `
        flex: 1;
        direction: rtl;
        text-align: right;
      `;

      const mainTextElement = document.createElement('div');
      mainTextElement.style.cssText = `
        font-weight: 700;
        color: ${styling.textColor || '#1f2937'};
        font-size: 15px;
        margin-bottom: 6px;
        line-height: 1.3;
      `;
      mainTextElement.textContent = offer.text || `اشتر ${offer.quantity} واحصل على ${offer.quantity} مجاناً`;

      const badgesContainer = document.createElement('div');
      badgesContainer.style.cssText = `
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        direction: rtl;
      `;

      if (offer.tag) {
        const tagElement = document.createElement('span');
        tagElement.style.cssText = `
          background: ${styling.tagColor || '#22c55e'};
          color: white;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        `;
        tagElement.textContent = offer.tag;
        badgesContainer.appendChild(tagElement);
      }

      // حساب نسبة التوفير
      let savingsPercentage = 0;
      const basePrice = 100; // سعر افتراضي
      const originalPrice = basePrice * offer.quantity;
      
      if (offer.discountType && offer.discountType !== 'none' && offer.discountValue > 0) {
        if (offer.discountType === 'percentage') {
          savingsPercentage = offer.discountValue;
        } else if (offer.discountType === 'fixed') {
          savingsPercentage = Math.round((offer.discountValue / originalPrice) * 100);
        }
        
        if (savingsPercentage > 0) {
          const savingsBadge = document.createElement('span');
          savingsBadge.style.cssText = `
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
          `;
          savingsBadge.textContent = `وفر ${savingsPercentage}%`;
          badgesContainer.appendChild(savingsBadge);
        }
      }

      textContainer.appendChild(mainTextElement);
      textContainer.appendChild(badgesContainer);

      leftContent.appendChild(iconElement);
      leftContent.appendChild(textContainer);

      // المحتوى الأيمن - السعر
      const rightContent = document.createElement('div');
      rightContent.style.cssText = `
        text-align: right;
        margin-right: 10px;
        direction: rtl;
      `;

      // حساب السعر
      let totalPrice = basePrice * offer.quantity;
      const isDiscounted = offer.discountType && offer.discountType !== 'none' && offer.discountValue > 0;

      if (isDiscounted) {
        if (offer.discountType === 'fixed') {
          totalPrice = originalPrice - offer.discountValue;
        } else if (offer.discountType === 'percentage') {
          const discount = (originalPrice * offer.discountValue) / 100;
          totalPrice = originalPrice - discount;
        }

        // عرض السعر الأصلي مشطوب
        const originalPriceElement = document.createElement('div');
        originalPriceElement.style.cssText = `
          font-size: 13px;
          color: #9ca3af;
          text-decoration: line-through;
          margin-bottom: 4px;
          font-weight: 500;
        `;
        originalPriceElement.textContent = `$${originalPrice.toFixed(2)}`;
        rightContent.appendChild(originalPriceElement);
      }

      const finalPriceElement = document.createElement('div');
      finalPriceElement.style.cssText = `
        font-weight: 800;
        font-size: 18px;
        color: ${styling.priceColor || '#dc2626'};
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      `;
      finalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
      rightContent.appendChild(finalPriceElement);

      // تجميع العناصر
      offerElement.appendChild(leftContent);
      offerElement.appendChild(rightContent);
      wrapper.appendChild(offerElement);

      // إضافة تأثير تمايل خفيف
      setTimeout(() => {
        offerElement.style.animation = `gentle-bounce 6s ease-in-out infinite ${index * 0.2}s`;
      }, index * 100);
    });

    // إضافة CSS للأنيميشن
    if (!document.getElementById('codform-animations')) {
      const style = document.createElement('style');
      style.id = 'codform-animations';
      style.textContent = `
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        .codform-quantity-offers-wrapper {
          animation: fadeInUp 0.8s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // إضافة العناصر للحاوي مع تأثير الظهور
    container.appendChild(wrapper);
    
    // التأكد من الرؤية النهائية
    requestAnimationFrame(() => {
      container.style.display = 'block';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
      
      console.log("✅ COMPREHENSIVE FIX v3.0 - Quantity offers displayed successfully!");
      console.log("✅ Container final state:", {
        display: container.style.display,
        visibility: container.style.visibility,
        opacity: container.style.opacity,
        children: container.children.length
      });
    });

    return true;
  }

  // دالة تحميل البيانات من API محسنة
  async function loadFormAndOffers(blockId) {
    console.log("🔍 COMPREHENSIVE FIX v3.0 - Loading form and offers for block:", blockId);
    
    try {
      const container = document.getElementById(`codform-container-${blockId}`);
      if (!container) {
        throw new Error(`Container not found: codform-container-${blockId}`);
      }

      const productId = container.getAttribute('data-product-id');
      const shop = window.Shopify?.shop || window.location.hostname.replace('www.', '');

      if (!productId || !shop) {
        throw new Error(`Missing data - productId: ${productId}, shop: ${shop}`);
      }

      console.log("📊 API Request details:", { shop, productId, blockId });

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
      console.log("📦 API Response received:", data);

      // عرض quantity offers إذا كانت موجودة - مع حماية من التكرار
      if (data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
        console.log("🎁 Processing quantity offers with", data.quantity_offers.offers.length, "offers");
        
        // التأكد من عدم وجود عروض مكررة في الصفحة كاملة قبل البدء
        const globalExistingOffers = document.querySelectorAll(
          '.quantity-offers-list, .codform-quantity-offers-wrapper, .quantity-offer-item, [class*="quantity-offer"]'
        );
        
        if (globalExistingOffers.length > 0) {
          console.log(`🧹 Removing ${globalExistingOffers.length} existing offers to prevent duplication`);
          globalExistingOffers.forEach(offer => offer.remove());
        }
        
        // عرض العروض في الموضع المحدد (ستتولى الدالة اختيار أفضل موضع)
        const offersDisplayed = displayQuantityOffers(data.quantity_offers, blockId, productId);
        
        if (offersDisplayed) {
          console.log("🎉 Quantity offers displayed successfully within form!");
        } else {
          console.warn("⚠️ Failed to display quantity offers");
        }
      } else {
        console.log("ℹ️ No quantity offers found or offers array is empty");
      }

      return {
        success: true,
        data: data,
        hasOffers: !!(data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0)
      };

    } catch (error) {
      console.error("❌ COMPREHENSIVE FIX v3.0 - Error loading data:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // دالة التشخيص المطورة
  function debugComprehensiveFix(blockId, productId) {
    console.log("🔧 COMPREHENSIVE FIX v3.0 - Enhanced debug mode activated");
    
    const container = document.getElementById(`codform-container-${blockId}`);
    const offersContainers = [
      document.getElementById(`quantity-offers-before-${blockId}`),
      document.getElementById(`quantity-offers-after-${blockId}`),
      document.getElementById(`quantity-offers-inside-${blockId}`)
    ];
    
    console.log("🔍 Debug Information:", {
      blockId,
      productId,
      containerExists: !!container,
      offersContainersFound: offersContainers.filter(c => c).length,
      shopifyShop: window.Shopify?.shop,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent
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

  // إتاحة الدوال عالمياً
  window.CodformComprehensiveFix = {
    displayOffers: displayQuantityOffers,
    loadData: loadFormAndOffers,
    debug: debugComprehensiveFix
  };

  // دالة تشخيص عامة محسنة
  window.debugCodformComprehensive = function(blockId, productId) {
    return debugComprehensiveFix(blockId, productId);
  };

  // تشغيل تلقائي محسن عند تحميل الصفحة
  function initializeOffers() {
    console.log("🔄 COMPREHENSIVE FIX v3.0 - Initializing offers...");
    
    const containers = document.querySelectorAll('[id*="codform-container-"]');
    console.log(`Found ${containers.length} form containers`);
    
    containers.forEach((container, index) => {
      const blockId = container.id.replace('codform-container-', '');
      const productId = container.getAttribute('data-product-id');
      
      if (blockId && productId) {
        console.log(`🔄 Auto-loading for container ${index + 1}:`, { blockId, productId });
        
        // تأخير تدريجي لتجنب تحميل متزامن
        setTimeout(() => {
          loadFormAndOffers(blockId);
        }, index * 200);
      } else {
        console.warn(`⚠️ Missing data for container ${index + 1}:`, { blockId, productId });
      }
    });
  }

  // تشغيل التهيئة مع تأخيرات متدرجة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeOffers, 500);
    });
  } else {
    setTimeout(initializeOffers, 500);
  }

  // أيضاً عند تحميل النافذة كاملة
  window.addEventListener('load', () => {
    setTimeout(initializeOffers, 1000);
  });

  console.log("✅ COMPREHENSIVE FIX v3.0 - Enhanced handler loaded successfully");

})();

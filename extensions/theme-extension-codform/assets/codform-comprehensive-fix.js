
/**
 * CODFORM COMPREHENSIVE FIX - Enhanced Quantity Offers Handler v3.0
 * حل شامل محدث لإصلاح عرض quantity offers وإدارة النماذج
 */

(function() {
  'use strict';
  
  console.log("🚀 COMPREHENSIVE FIX v3.0 - Loading enhanced comprehensive handler");

  // تأكد من أن النص موجه لليمين للعربية
  const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

  // دالة عرض quantity offers محسنة ومطورة
  function displayQuantityOffers(quantityOffersData, blockId, productId) {
    console.log("🎁 COMPREHENSIVE FIX v3.0 - Displaying quantity offers:", quantityOffersData);
    
    if (!quantityOffersData) {
      console.log("❌ No quantity offers data provided");
      return false;
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
    
    // تحويل قيمة position للصيغة المناسبة للـ DOM ID
    const positionMap = {
      'before_form': 'before',
      'inside_form': 'inside',
      'after_form': 'after'
    };
    
    const containerPosition = positionMap[position] || 'before';

    if (!offers.length) {
      console.log("❌ No offers found in data");
      return false;
    }

    // البحث عن الحاوي المحدد حسب الموضع
    console.log(`🔍 Looking for container with position: ${containerPosition} (from ${position})`);
    let container = document.getElementById(`quantity-offers-${containerPosition}-${blockId}`);
    
    // إذا لم نجد الحاوي المطلوب، نختار حاوي بديل ونطبع تحذير
    if (!container) {
      console.warn(`❌ Container for position ${containerPosition} not found, searching alternatives...`);
      
      // محاولة العثور على حاوي بديل
      const alternativeSelectors = [
        `quantity-offers-before-${blockId}`,
        `quantity-offers-inside-${blockId}`,
        `quantity-offers-after-${blockId}`
      ];
      
      for (const selector of alternativeSelectors) {
        const altContainer = document.getElementById(selector);
        if (altContainer) {
          console.log(`✅ Found alternative container: ${selector}`);
          
          // حذف أي عروض موجودة في الحاويات الأخرى لتجنب التكرار
          alternativeSelectors.forEach(otherSelector => {
            if (otherSelector !== selector) {
              const otherContainer = document.getElementById(otherSelector);
              if (otherContainer) {
                otherContainer.innerHTML = '';
                otherContainer.style.display = 'none';
              }
            }
          });
          
          container = altContainer;
          break;
        }
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
      
      const offerElement = document.createElement('div');
      offerElement.className = `codform-quantity-offer-item offer-${index}`;
      offerElement.style.cssText = `
        background: ${styling.backgroundColor};
        color: ${styling.textColor};
        border: 2px solid ${styling.tagColor};
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      `;

      // تأثير hover متقدم
      offerElement.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px) scale(1.02)';
        this.style.boxShadow = '0 16px 48px rgba(0,0,0,0.2)';
        this.style.borderColor = styling.priceColor;
        this.style.borderWidth = '3px';
      });

      offerElement.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
        this.style.borderColor = styling.tagColor;
        this.style.borderWidth = '2px';
      });

      // المحتوى الأيسر
      const leftContent = document.createElement('div');
      leftContent.style.cssText = `
        display: flex;
        align-items: center;
        flex: 1;
        gap: 16px;
        direction: rtl;
      `;

      // أيقونة العرض المحسنة
      const iconElement = document.createElement('div');
      iconElement.style.cssText = `
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, ${styling.tagColor}, ${styling.priceColor});
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        flex-shrink: 0;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      `;
      iconElement.innerHTML = '🎁';

      // النص الرئيسي المحسن
      const textContainer = document.createElement('div');
      textContainer.style.cssText = `
        flex: 1;
        direction: rtl;
        text-align: right;
      `;

      const tagElement = document.createElement('div');
      tagElement.style.cssText = `
        background: linear-gradient(135deg, ${styling.tagColor}, ${styling.priceColor});
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 700;
        display: inline-block;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      `;
      tagElement.textContent = offer.tag || `اشترِ ${offer.quantity || 1} قطعة`;

      const textElement = document.createElement('div');
      textElement.style.cssText = `
        font-size: 18px;
        font-weight: 600;
        line-height: 1.5;
        color: ${styling.textColor};
        margin-top: 4px;
      `;
      textElement.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة واحصل على خصم مميز`;

      textContainer.appendChild(tagElement);
      textContainer.appendChild(textElement);

      leftContent.appendChild(iconElement);
      leftContent.appendChild(textContainer);

      // المحتوى الأيمن المحسن
      const rightContent = document.createElement('div');
      rightContent.style.cssText = `
        text-align: center;
        min-width: 100px;
        flex-shrink: 0;
      `;

      if (offer.discountType && offer.discountType !== 'none' && offer.discountValue > 0) {
        const discountContainer = document.createElement('div');
        discountContainer.style.cssText = `
          background: linear-gradient(135deg, ${styling.priceColor}, #ff6b35);
          color: white;
          padding: 12px 16px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(255, 107, 53, 0.3);
        `;

        const discountLabel = document.createElement('div');
        discountLabel.style.cssText = `
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 4px;
          font-weight: 600;
        `;
        discountLabel.textContent = 'وفر';

        const discountValue = document.createElement('div');
        discountValue.style.cssText = `
          font-size: 24px;
          font-weight: 900;
          line-height: 1;
        `;
        
        if (offer.discountType === 'percentage') {
          discountValue.textContent = `${offer.discountValue}%`;
        } else {
          discountValue.textContent = `${offer.discountValue} ر.س`;
        }

        discountContainer.appendChild(discountLabel);
        discountContainer.appendChild(discountValue);
        rightContent.appendChild(discountContainer);
      } else {
        const specialLabel = document.createElement('div');
        specialLabel.style.cssText = `
          font-size: 16px;
          font-weight: 700;
          color: ${styling.tagColor};
          padding: 12px 16px;
          background: ${styling.tagColor}20;
          border: 2px solid ${styling.tagColor};
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        `;
        specialLabel.textContent = 'عرض خاص';
        rightContent.appendChild(specialLabel);
      }

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

      // عرض quantity offers إذا كانت موجودة
      if (data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
        console.log("🎁 Processing quantity offers with", data.quantity_offers.offers.length, "offers");
        
        // تنظيف جميع الحاويات أولا لتجنب العرض المزدوج
        const containers = [
          document.getElementById(`quantity-offers-before-${blockId}`),
          document.getElementById(`quantity-offers-inside-${blockId}`),
          document.getElementById(`quantity-offers-after-${blockId}`)
        ];
        
        containers.forEach(container => {
          if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
          }
        });
        
        // عرض العروض في الموضع المحدد
        const offersDisplayed = displayQuantityOffers(data.quantity_offers, blockId, productId);
        
        if (offersDisplayed) {
          console.log("🎉 Quantity offers displayed successfully!");
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

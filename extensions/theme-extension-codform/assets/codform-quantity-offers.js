/**
 * CODFORM Quantity Offers Handler
 * يتعامل مع عرض وإدارة عروض الكمية للمنتجات
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // دالة للحصول على رمز العملة
  function getCurrencySymbol(currency) {
    const currencySymbols = {
      'SAR': 'ر.س',
      'MAD': 'د.م',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AED': 'د.إ',
      'EGP': 'ج.م',
      'KWD': 'د.ك',
      'QAR': 'ر.ق',
      'OMR': 'ر.ع',
      'BHD': 'د.ب',
      'JOD': 'د.أ',
      'LBP': 'ل.ل',
      'SYP': 'ل.س',
      'IQD': 'د.ع',
      'YER': 'ر.ي',
      'LYD': 'د.ل',
      'TND': 'د.ت',
      'DZD': 'د.ج'
    };
    return currencySymbols[currency] || currency;
  }

  // دالة عرض quantity offers
  function displayQuantityOffers(quantityOffers, blockId, productId) {
    console.log("🎁 QUANTITY OFFERS FIX - Displaying quantity offers:", quantityOffers);
    
    if (!quantityOffers) {
      console.log("❌ No quantity offers data provided");
      return;
    }

    // التحقق من بنية البيانات - قد تكون offers مباشرة أو داخل كائن
    let offers = quantityOffers.offers || [];
    if (!Array.isArray(offers) && quantityOffers.length) {
      offers = quantityOffers;
    }
    
    if (!Array.isArray(offers) || offers.length === 0) {
      console.log("❌ Invalid or empty offers array:", offers);
      return;
    }

    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    if (!container) {
      console.error("❌ Quantity offers container not found:", `quantity-offers-before-${blockId}`);
      return;
    }

    container.innerHTML = '';
    container.style.display = 'block';

    // استخدام التنسيق من البيانات أو القيم الافتراضية
    const styling = quantityOffers.styling || {
      backgroundColor: '#ffffff',
      textColor: '#000000', 
      tagColor: '#22c55e',
      priceColor: '#ef4444'
    };

    console.log(`🎨 Using styling:`, styling);
    console.log(`🔢 Rendering ${offers.length} offers`);

    offers.forEach((offer, index) => {
      console.log(`🎁 Processing offer ${index + 1}:`, offer);
      
      const offerElement = document.createElement('div');
      offerElement.className = 'codform-quantity-offer-item';
      offerElement.style.cssText = `
        background-color: ${styling.backgroundColor};
        color: ${styling.textColor};
        border: 2px solid ${styling.tagColor};
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

      const textContent = document.createElement('div');
      textContent.style.cssText = `
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      `;
      
      const tagSpan = document.createElement('span');
      tagSpan.style.cssText = `
        background-color: ${styling.tagColor}; 
        color: white; 
        padding: 6px 12px; 
        border-radius: 20px; 
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      `;
      tagSpan.textContent = offer.tag || `الكمية ${offer.quantity || 1}`;
      
      const textSpan = document.createElement('span');
      textSpan.style.cssText = `font-weight: 500; font-size: 15px; line-height: 1.4;`;
      textSpan.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة`;
      
      textContent.appendChild(tagSpan);
      textContent.appendChild(textSpan);

      const priceContent = document.createElement('div');
      priceContent.style.cssText = `
        font-weight: bold; 
        font-size: 16px;
        text-align: center;
        min-width: 80px;
      `;
      
      // استخدام العملة من البيانات المرسلة أو العملة الافتراضية
      const currency = offer.currency || quantityOffers.currency || 'SAR';
      const currencySymbol = getCurrencySymbol(currency);
      
      if (offer.discountType && offer.discountType !== 'none' && offer.discountValue > 0) {
        const savings = offer.discountType === 'percentage' ? 
          `${offer.discountValue}% خصم` : 
          `${offer.discountValue} ${currencySymbol} خصم`;
        
        priceContent.style.color = styling.priceColor;
        priceContent.innerHTML = `
          <div style="font-size: 14px; opacity: 0.8;">وفر</div>
          <div>${savings}</div>
        `;
      } else {
        priceContent.textContent = 'عرض خاص';
        priceContent.style.color = styling.tagColor;
      }

      offerElement.appendChild(textContent);
      offerElement.appendChild(priceContent);
      container.appendChild(offerElement);
    });

    // إضافة animation للظهور
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      container.style.transition = 'all 0.5s ease-out';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 100);

    console.log("✅ QUANTITY OFFERS FIX - Quantity offers displayed successfully");
  }

  // دالة تحميل وعرض العروض من API
  async function loadAndDisplayOffers(blockId, productId, shop) {
    try {
      console.log("🔍 QUANTITY OFFERS FIX - Loading offers for:", { blockId, productId, shop });
      
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
      console.log("📦 QUANTITY OFFERS FIX - API Response:", data);
      
      if (data.quantity_offers) {
        displayQuantityOffers(data.quantity_offers, blockId, productId);
        return { success: true, offers: data.quantity_offers };
      } else {
        console.log("ℹ️ No quantity offers found for this product");
        return { success: false, message: "No offers found" };
      }
      
    } catch (error) {
      console.error("❌ QUANTITY OFFERS FIX - Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة تشخيص للاختبار
  function debugOffers(blockId, productId) {
    console.log("🔧 QUANTITY OFFERS DEBUG - Starting diagnosis...");
    
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
  console.log("🔧 Manual debug called");
  return window.CodformQuantityOffers.debug(blockId, productId);
};
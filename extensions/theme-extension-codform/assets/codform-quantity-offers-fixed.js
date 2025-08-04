/**
 * CODFORM Quantity Offers - إصلاح كامل
 * لجعل العرض مطابق للمعاينة تماماً
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // دالة تحويل العملة موحدة مع النظام الأساسي
  function convertCurrency(amount, fromCurrency, toCurrency) {
    // استخدام معدلات التحويل الموحدة
    const exchangeRates = window.CodformCurrencyRates || {
      'USD': 1.0,
      'SAR': 3.75,
      'MAD': 10.0, // ✅ توحيد: متطابق مع النظام الأساسي
      'AED': 3.67,
      'EGP': 30.85,
      'XOF': 655.96, // West African CFA Franc
      'XAF': 655.96  // Central African CFA Franc
    };
    
    if (fromCurrency === toCurrency) return amount;
    
    // التحويل عبر الدولار الأمريكي كعملة أساسية
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    
    if (fromRate && toRate) {
      const usdAmount = amount / fromRate;
      return usdAmount * toRate;
    }
    
    return amount; // إرجاع المبلغ الأصلي إذا فشل التحويل
  }

  // دالة عرض العروض متصلة مع State Manager
  function displayQuantityOffers(quantityOffersData, blockId, productId, defaultCurrency = 'SAR', productData = null) {
    console.log("🎯 Quantity Offers Display Started - Connected to State Manager");
    
    if (!quantityOffersData?.offers || !Array.isArray(quantityOffersData.offers)) {
      console.log("❌ No valid offers data");
      return;
    }

    const offers = quantityOffersData.offers;
    let container = document.getElementById(`quantity-offers-before-${blockId}`);
    
    if (!container) {
      console.error("❌ Container not found:", `quantity-offers-before-${blockId}`);
      return;
    }

    container.innerHTML = '';
    container.style.display = 'block';

    // ✅ CRITICAL FIX: استخدام State Manager للحصول على البيانات الصحيحة
    const stateManager = window.CodformStateManager;
    const currentState = stateManager ? stateManager.getState() : null;
    
    // استخدام السعر من State Manager أو التراجع للسعر الافتراضي
    const basePrice = currentState?.basePrice || productData?.price || 20; // منع استخدام القيم المتغيرة
    const targetCurrency = currentState?.targetCurrency || defaultCurrency;
    
    // استخدام Currency Manager للتنسيق
    const currencyManager = window.CodformCurrencyManager;
    
    console.log(`💰 Quantity Offers using: basePrice=${basePrice}, targetCurrency=${targetCurrency}`);
    console.log(`💰 State Manager data:`, currentState);
    
    const productImage = productData?.image || productData?.featuredImage;
    const productTitle = productData?.title || 'المنتج';

    console.log(`💰 Using base price: ${basePrice} ${targetCurrency}`);

    offers.forEach((offer, index) => {
      const offerElement = document.createElement('div');
      
      // تصميم العرض مطابق للمعاينة
      offerElement.style.cssText = `
        background: #ffffff;
        border: 2px solid ${index === 0 ? '#3b82f6' : '#e5e7eb'};
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Cairo', Arial, sans-serif;
        cursor: pointer;
        direction: rtl;
        text-align: right;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
      `;

      // حساب الأسعار باستخدام Currency Manager
      const quantity = offer.quantity || 1;
      const totalPrice = basePrice * quantity;
      const discountValue = parseFloat(offer.discount || 0);
      let finalPrice = totalPrice;
      
      if (discountValue > 0) {
        finalPrice = totalPrice - (totalPrice * discountValue / 100);
      }
      
      // ✅ استخدام النظام الموحد فقط - تجاهل أي مصادر أخرى
      const unifiedSystem = window.CodformUnifiedSystem;
      let formattedTotal, formattedFinal;
      
      if (unifiedSystem && unifiedSystem.formatCurrency) {
        // ✅ فرض استخدام العملة المفضلة من النظام الموحد
        const preferredCurrency = unifiedSystem.getPreferredCurrency();
        formattedTotal = unifiedSystem.formatCurrency(totalPrice, 'USD');
        formattedFinal = unifiedSystem.formatCurrency(finalPrice, 'USD');
        console.log(`🔒 UNIFIED: Using ${preferredCurrency} - Total: ${formattedTotal}, Final: ${formattedFinal}`);
      } else {
        // تراجع للتنسيق الافتراضي - USD فقط
        formattedTotal = `$${totalPrice.toFixed(0)}`;
        formattedFinal = `$${finalPrice.toFixed(0)}`;
        console.log(`⚠️ FALLBACK: Total: ${formattedTotal}, Final: ${formattedFinal}`);
      }
      
      console.log(`💰 Offer ${index}: quantity=${quantity}, total=${formattedTotal}, final=${formattedFinal}`);

      // محتوى العرض
      offerElement.innerHTML = `
        <div style="display: flex; align-items: center; width: 100%; direction: rtl; gap: 12px;">
          <!-- صورة المنتج -->
          <div style="width: 40px; height: 40px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background: #f3f4f6; border: 1px solid #e5e7eb;">
            ${productImage ? `
              <img src="${productImage}" 
                   alt="${productTitle}"
                   style="width: 100%; height: 100%; object-fit: cover;"
                   onerror="this.style.display='none'">
            ` : `
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 16px;">📦</div>
            `}
          </div>
          
          <!-- النص -->
          <div style="flex: 1; text-align: right; direction: rtl;">
            <div style="font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 2px;">
              ${offer.text || `اشترِ ${quantity} قطعة`}
            </div>
            ${offer.tag ? `
              <span style="background: #22c55e; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 600;">
                ${offer.tag}
              </span>
            ` : ''}
          </div>
          
          <!-- زر الكمية -->
          <button style="
            background: #22c55e;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
          ">
            Buy ${quantity} Item${quantity > 1 ? 's' : ''}
          </button>
          
          <!-- السعر -->
          <div style="text-align: right; direction: rtl; min-width: 70px;">
            ${discountValue > 0 ? `
              <div style="font-size: 11px; color: #9ca3af; text-decoration: line-through; margin-bottom: 2px;">
                ${formattedTotal}
              </div>
            ` : ''}
            <div style="font-size: 16px; font-weight: bold; color: #059669;">
              ${formattedFinal}
            </div>
          </div>
        </div>
      `;

      // إضافة أحداث التفاعل
      offerElement.addEventListener('click', function() {
        // إزالة التحديد من العروض الأخرى
        container.querySelectorAll('div').forEach(el => {
          if (el !== this) {
            el.style.borderColor = '#e5e7eb';
            el.style.backgroundColor = '#ffffff';
          }
        });
        
        // تحديد العرض الحالي
        this.style.borderColor = '#3b82f6';
        this.style.backgroundColor = '#f0f9ff';
      });

      offerElement.addEventListener('mouseenter', function() {
        if (this.style.borderColor !== 'rgb(59, 130, 246)') {
          this.style.borderColor = '#94a3b8';
        }
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      });

      offerElement.addEventListener('mouseleave', function() {
        if (this.style.borderColor !== 'rgb(59, 130, 246)') {
          this.style.borderColor = '#e5e7eb';
        }
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      });

      container.appendChild(offerElement);
    });

    console.log("✅ Fixed quantity offers displayed successfully");
  }

  // دالة تحميل وعرض العروض
  async function loadAndDisplayOffers(blockId, productId, shop, defaultCurrency = 'SAR', productData = null) {
    try {
      console.log(`🔄 Loading offers for: ${productId} at ${shop}`);
      
      const response = await fetch(`https://tftklwisfteasdvdzsue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.quantity_offers) {
        console.log("✅ Offers loaded successfully");
        
        // ✅ حفظ البيانات للاستخدام المستقبلي
        window.currentQuantityOffersData = data.quantity_offers;
        window.currentProductId = productId;
        window.currentProductData = productData;
        
        displayQuantityOffers(data.quantity_offers, blockId, productId, defaultCurrency, productData);
        return { success: true };
      } else {
        console.log("ℹ️ No offers found");
        return { success: false, error: "No offers available" };
      }
    } catch (error) {
      console.error("❌ Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // ✅ CRITICAL FIX: الاستماع للتغييرات في State Manager
  function subscribeToStateChanges() {
    if (window.CodformStateManager && window.CodformStateManager.subscribe) {
      window.CodformStateManager.subscribe((newState, previousState) => {
        console.log("🔄 Quantity Offers: State changed, checking for updates...");
        
        // تحديث العروض المعروضة إذا تغيرت العملة أو الإعدادات
        if (newState.targetCurrency !== previousState.targetCurrency || 
            newState.basePrice !== previousState.basePrice) {
          console.log("🔄 Quantity Offers: Currency or price changed, updating displays...");
          
          // إعادة تطبيق تنسيق العملة على جميع العروض المعروضة
          document.querySelectorAll('[id^="quantity-offers-before-"]').forEach(container => {
            if (container.children.length > 0) {
              const blockId = container.id.replace('quantity-offers-before-', '');
              const productData = window.currentProductData; // استخدام البيانات المحفوظة
              
              // إعادة عرض العروض بالتنسيق الجديد
              setTimeout(() => {
                if (window.currentQuantityOffersData) {
                  displayQuantityOffers(
                    window.currentQuantityOffersData, 
                    blockId, 
                    window.currentProductId, 
                    newState.targetCurrency, 
                    productData
                  );
                }
              }, 100);
            }
          });
        }
      });
      console.log("✅ Quantity Offers subscribed to State Manager changes");
    }
  }

  // محاولة الاشتراك فوراً أو انتظار تحميل State Manager
  if (window.CodformStateManager) {
    subscribeToStateChanges();
  } else {
    // انتظار تحميل State Manager
    const checkStateManager = setInterval(() => {
      if (window.CodformStateManager) {
        subscribeToStateChanges();
        clearInterval(checkStateManager);
      }
    }, 100);
    
    // إيقاف الفحص بعد 10 ثوان
    setTimeout(() => clearInterval(checkStateManager), 10000);
  }

  // API عام
  return {
    display: displayQuantityOffers,
    loadAndDisplayOffers: loadAndDisplayOffers,
    subscribeToStateChanges: subscribeToStateChanges
  };
})();

console.log("✅ Fixed CODFORM Quantity Offers loaded with State Manager integration");
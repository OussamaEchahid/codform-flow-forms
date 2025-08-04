/**
 * CODFORM Quantity Offers - إصلاح كامل
 * لجعل العرض مطابق للمعاينة تماماً
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // دالة تحويل العملة موحدة مع النظام الأساسي - مع دعم الإعدادات المخصصة
  async function convertCurrency(amount, fromCurrency, toCurrency) {
    // استخدام معدلات التحويل المخصصة أولاً
    let exchangeRates = window.CodformCurrencyRates || {
      'USD': 1.0,
      'SAR': 3.75,
      'MAD': 10.0,
      'AED': 3.67,
      'EGP': 30.85,
      'XOF': 655.96,
      'XAF': 655.96
    };

    // جلب الإعدادات المخصصة من خدمة العملة
    try {
      if (window.CodformSmartCurrency && window.CodformSmartCurrency.system.isInitialized) {
        const shopId = window.Shopify?.shop?.domain || 'astrem.myshopify.com';
        // ✅ FIX: استخدام shop_id بدلاً من shopId
        const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shop_id=${shopId}`);
        
        if (response.ok) {
          const settings = await response.json();
          console.log('🎯 Retrieved custom settings in convertCurrency:', settings);
          if (settings.custom_rates) {
            // دمج المعدلات المخصصة مع المعدلات الافتراضية
            exchangeRates = { ...exchangeRates, ...settings.custom_rates };
            console.log('✅ Using custom exchange rates:', settings.custom_rates);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load custom rates, using defaults:', error);
    }
    
    if (fromCurrency === toCurrency) return amount;
    
    // التحويل عبر الدولار الأمريكي كعملة أساسية
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    
    if (fromRate && toRate) {
      const usdAmount = amount / fromRate;
      return usdAmount * toRate;
    }
    
    return amount;
  }

  // دالة عرض العروض متصلة مع State Manager
  async function displayQuantityOffers(quantityOffersData, blockId, productId, defaultCurrency = 'SAR', productData = null) {
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

    // ✅ تبسيط كامل: استخدام عملة وسعر المنتج مباشرة
    let basePrice = 0;
    let productCurrency = defaultCurrency || 'SAR';
    
    if (productData && productData.price) {
      basePrice = productData.price;
      productCurrency = productData.currency || defaultCurrency || 'SAR';
    }
    
    console.log(`🎯 SIMPLIFIED: Using product currency directly: ${productCurrency}`);
    console.log(`💰 Base price: ${basePrice} ${productCurrency}`);
    console.log(`📊 Product data:`, productData);
    
    const productImage = productData?.image || productData?.featuredImage;
    const productTitle = productData?.title || 'المنتج';

    console.log(`💰 Final calculation will use: ${basePrice} ${productCurrency} per item`);

    // دالة مساعدة للحصول على رمز العملة
    function getCurrencySymbol(currency) {
      const symbols = {
        'USD': '$', 'SAR': 'ر.س', 'MAD': 'د.م.', 'AED': 'د.إ',
        'EGP': 'ج.م', 'EUR': '€', 'GBP': '£'
      };
      return symbols[currency] || currency;
    }
    
    // جلب الإعدادات المخصصة مرة واحدة للجميع
    console.group('🎯 Loading Custom Settings for Quantity Offers');
    let customSettings = null;
    const shopId = window.Shopify?.shop?.domain || 'astrem.myshopify.com';
    
    try {
      console.log('📡 Fetching custom settings for shop:', shopId);
      // ✅ FIX: استخدام shop_id بدلاً من shopId
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shop_id=${shopId}`);
      
      if (response.ok) {
        customSettings = await response.json();
        console.log('✅ Custom settings loaded successfully:', customSettings);
        
        // حفظ الإعدادات في localStorage للاستخدام السريع
        localStorage.setItem(`currency_settings_${shopId}`, JSON.stringify(customSettings));
      } else {
        console.warn('❌ Failed to load custom settings:', response.status, response.statusText);
        // محاولة استخدام إعدادات محفوظة
        const cached = localStorage.getItem(`currency_settings_${shopId}`);
        if (cached) {
          customSettings = JSON.parse(cached);
          console.log('📦 Using cached settings:', customSettings);
        }
      }
    } catch (error) {
      console.error('❌ Error loading custom settings:', error);
      // محاولة استخدام إعدادات محفوظة
      const cached = localStorage.getItem(`currency_settings_${shopId}`);
      if (cached) {
        try {
          customSettings = JSON.parse(cached);
          console.log('📦 Using cached settings as fallback:', customSettings);
        } catch (parseError) {
          console.error('❌ Failed to parse cached settings:', parseError);
        }
      }
    }
    console.groupEnd();

    for (let index = 0; index < offers.length; index++) {
      const offer = offers[index];
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
      
      // ✅ استخدام السعر الثابت الصحيح
      let actualBasePrice = basePrice; // استخدام السعر الذي تم تحديده أعلاه (2$)
      
      const totalPrice = actualBasePrice * quantity;
      const discountValue = parseFloat(offer.discount || 0);
      let finalPrice = totalPrice;
      
      if (discountValue > 0) {
        finalPrice = totalPrice - (totalPrice * discountValue / 100);
      }
      
      console.log(`💰 Offer calculation: basePrice=${actualBasePrice}, quantity=${quantity}, total=${totalPrice}, discount=${discountValue}%, final=${finalPrice}`);
      
      // ✅ استخدام النظام الذكي للتنسيق مع الإعدادات المخصصة
      let formattedTotal = `$${Math.round(totalPrice)}`;
      let formattedFinal = `$${Math.round(finalPrice)}`;
      
      // تطبيق التنسيق المخصص باستخدام الإعدادات المحملة
      if (customSettings && customSettings.success !== false) {
        console.group(`🎨 Applying Custom Formatting for Offer ${index + 1}`);
        const originalCurrency = productData?.currency || 'USD';
        
        try {
          // تطبيق المعدلات المخصصة إذا كانت متاحة
          let convertedTotal = totalPrice;
          let convertedFinal = finalPrice;
          
          console.log('📊 Current values before conversion:', {
            totalPrice,
            finalPrice,
            originalCurrency,
            customRates: customSettings.custom_rates
          });
          
          // ✅ تطبيق المعدلات المخصصة مباشرة على عملة المنتج
          if (customSettings.custom_rates && customSettings.custom_rates[productCurrency]) {
            const rate = customSettings.custom_rates[productCurrency];
            convertedTotal = totalPrice * rate;
            convertedFinal = finalPrice * rate;
            console.log(`💱 Applied custom rate for ${productCurrency} (${rate}): Total ${totalPrice} -> ${convertedTotal}, Final ${finalPrice} -> ${convertedFinal}`);
          } else {
            console.log(`📝 No custom rate found for ${productCurrency}, using original values`);
          }
          
          // تطبيق إعدادات العرض المخصصة
          const displaySettings = customSettings.display_settings || {};
          const customSymbols = customSettings.custom_symbols || {};
          
          console.log('🎛️ Display settings:', displaySettings);
          console.log('🔤 Custom symbols:', customSymbols);
          
          // ✅ استخدام رمز العملة للمنتج الحالي بدلاً من العملة الأصلية
          const symbol = customSymbols[productCurrency] || getCurrencySymbol(productCurrency);
          const decimals = displaySettings.decimal_places !== undefined ? displaySettings.decimal_places : 0;
          const showSymbol = displaySettings.show_symbol !== false;
          const symbolPosition = displaySettings.symbol_position || 'after';
          
          console.log('⚙️ Applied settings:', { symbol, decimals, showSymbol, symbolPosition });
          
          const formattedTotalNumber = convertedTotal.toFixed(decimals);
          const formattedFinalNumber = convertedFinal.toFixed(decimals);
          
          if (showSymbol) {
            formattedTotal = symbolPosition === 'after' ? 
              `${formattedTotalNumber} ${symbol}` : 
              `${symbol} ${formattedTotalNumber}`;
            formattedFinal = symbolPosition === 'after' ? 
              `${formattedFinalNumber} ${symbol}` : 
              `${symbol} ${formattedFinalNumber}`;
          } else {
            formattedTotal = formattedTotalNumber;
            formattedFinal = formattedFinalNumber;
          }
          
          console.log('✅ CUSTOM FORMATTING APPLIED:', { 
            formattedTotal, 
            formattedFinal,
            appliedSettings: { decimals, showSymbol, symbolPosition, symbol }
          });
        } catch (error) {
          console.error('❌ Custom formatting failed:', error);
          formattedTotal = `$${Math.round(totalPrice)}`;
          formattedFinal = `$${Math.round(finalPrice)}`;
        }
        console.groupEnd();
      } else {
        console.log(`⚠️ FALLBACK FORMATTING: No custom settings available - Total: ${formattedTotal}, Final: ${formattedFinal}`);
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
    }

    console.log("✅ Fixed quantity offers displayed successfully");
  }

  // دالة تحميل وعرض العروض
  async function loadAndDisplayOffers(blockId, productId, shop, defaultCurrency = 'SAR', productData = null) {
    try {
      console.log(`🔄 Loading offers for: ${productId} at ${shop}`);
      
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}`);
      
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
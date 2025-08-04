/**
 * CODFORM Quantity Offers - إصلاح كامل مع إعدادات العملة المخصصة
 * نسخة محسنة مع معالجة الأخطاء وإعدادات افتراضية
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // Custom currency settings cache
  let customCurrencySettings = null;

  // Function to fetch and cache custom currency settings (with fallback)
  async function getCustomCurrencySettings(shopId) {
    if (customCurrencySettings) {
      return customCurrencySettings;
    }

    try {
      console.log(`🔍 Fetching custom currency settings for shop: ${shopId}`);
      
      // استخدام الـ API المُحسن للحصول على إعدادات العملة المخصصة
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shop_id=${encodeURIComponent(shopId)}`);
      if (!response.ok) {
        console.warn(`⚠️ API returned ${response.status}, using default settings`);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Custom currency settings fetched:`, data);
      
      customCurrencySettings = data;
      return data;
    } catch (error) {
      console.warn('⚠️ Using default currency settings due to error:', error);
      // Return default settings to prevent breaking the display
      const defaultSettings = {
        success: true,
        display_settings: { 
          show_symbol: true, 
          symbol_position: 'before', 
          decimal_places: 2 
        },
        custom_symbols: {},
        custom_rates: {}
      };
      customCurrencySettings = defaultSettings;
      return defaultSettings;
    }
  }

  // Enhanced currency conversion with custom rates
  async function convertCurrency(amount, fromCurrency, toCurrency, shopId) {
    // Get custom settings
    const shopDomain = shopId || window.Shopify?.shop?.domain || 'astrem.myshopify.com';
    const settings = await getCustomCurrencySettings(shopDomain);
    
    // Default exchange rates
    let exchangeRates = {
      'USD': 1.0,
      'SAR': 3.75,
      'MAD': 10.0,
      'AED': 3.67,
      'EGP': 30.85,
      'XOF': 655.96,
      'XAF': 655.96
    };

    // Apply custom rates if available
    if (settings.custom_rates) {
      exchangeRates = { ...exchangeRates, ...settings.custom_rates };
      console.log('💱 Using custom exchange rates:', settings.custom_rates);
    }
    
    if (fromCurrency === toCurrency) return amount;
    
    // ✅ CRITICAL FIX: Use standard conversion, not direct multiplication
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    
    // Convert via USD base: amount / fromRate * toRate
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    
    console.log(`💱 Currency conversion: ${amount} ${fromCurrency} → ${convertedAmount} ${toCurrency} (via USD: ${usdAmount})`);
    return convertedAmount;
  }

  // دالة مساعدة للحصول على رمز العملة مع تحسين منطق العرض
  function getCurrencySymbol(currency, displayType = 'code') {
    const currencyData = {
      'USD': { symbol: '$', code: 'USD' }, 
      'SAR': { symbol: 'ر.س', code: 'SAR' }, 
      'MAD': { symbol: 'د.م.', code: 'MAD' }, 
      'AED': { symbol: 'د.إ', code: 'AED' },
      'EGP': { symbol: 'ج.م', code: 'EGP' }, 
      'EUR': { symbol: '€', code: 'EUR' }, 
      'GBP': { symbol: '£', code: 'GBP' },
      'ARS': { symbol: '$', code: 'ARS' }
    };
    
    const data = currencyData[currency] || { symbol: currency, code: currency };
    
    if (displayType === 'symbol') {
      return data.symbol;
    } else {
      return data.code;
    }
  }

  // دالة عرض العروض مع إعدادات العملة المخصصة وتخصيص الألوان
  async function displayQuantityOffers(quantityOffersData, blockId, productId, defaultCurrency = 'SAR', productData = null, customStyling = null) {
    console.log("🎯 Quantity Offers Display Started with Custom Currency Settings");
    
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

    // ✅ الإصلاح الجوهري: استخدام عملة النموذج وليس عملة المنتج
    let basePrice = 20; // سعر افتراضي
    let formCurrency = defaultCurrency || 'USD'; // عملة النموذج (الأولوية)
    let productCurrency = 'MAD'; // عملة المنتج من شوبيفاي
    
    if (productData) {
      basePrice = parseFloat(productData.price) || 20;
      productCurrency = productData.currency || 'MAD'; // عملة المنتج
    }
    
    // ✅ استخدام عملة النموذج كعملة العرض النهائية
    console.log(`🎯 Form Currency (Priority): ${formCurrency}`);
    console.log(`🛍️ Product Currency: ${productCurrency}`);
    console.log(`💰 Base price: ${basePrice} ${productCurrency}`);
    
    // جلب الإعدادات المخصصة للعرض
    const shopDomain = window.Shopify?.shop?.domain || 'astrem.myshopify.com';
    const customSettings = await getCustomCurrencySettings(shopDomain);
    
    console.log(`⚙️ Custom settings loaded:`, customSettings);
    
    const productImage = productData?.image || productData?.featuredImage;
    const productTitle = productData?.title || 'المنتج';

    console.log(`💰 Final calculation will use: ${basePrice} ${formCurrency} (converted from ${productCurrency})`);

    // ✅ تحويل السعر من عملة المنتج إلى عملة النموذج
    let convertedBasePrice = basePrice;
    if (productCurrency !== formCurrency) {
      convertedBasePrice = await convertCurrency(basePrice, productCurrency, formCurrency, shopDomain);
      console.log(`💱 Converted: ${basePrice} ${productCurrency} → ${convertedBasePrice} ${formCurrency}`);
    }

    for (let index = 0; index < offers.length; index++) {
      const offer = offers[index];
      const offerElement = document.createElement('div');
      
      // ✅ استخدام السعر المحول وعملة النموذج
      const quantity = offer.quantity || 1;
      let totalPrice = convertedBasePrice * quantity;
      const discountValue = parseFloat(offer.discount || 0);
      let finalPrice = totalPrice;
      
      // تطبيق الخصم إذا كان موجود
      if (discountValue > 0) {
        finalPrice = totalPrice - (totalPrice * discountValue / 100);
      }
      
      console.log(`💰 Offer ${index + 1}: basePrice=${convertedBasePrice}, quantity=${quantity}, total=${totalPrice}, discount=${discountValue}%, final=${finalPrice}`);
      
      // ✅ CRITICAL FIX: تم إزالة تطبيق المعدلات المخصصة هنا لتجنب التطبيق المزدوج
      // المعدلات المخصصة تطبق فقط في دالة convertCurrency
      
      let formattedTotal = totalPrice.toFixed(2);
      let formattedFinal = finalPrice.toFixed(2);
      
      console.log(`💰 Final calculation: basePrice=${convertedBasePrice}, total=${totalPrice}, final=${finalPrice}`);
      
      // ✅ تطبيق إعدادات العرض المخصصة لعملة النموذج
      let currencyDisplay = formCurrency; // عرض كود العملة كامل افتراضياً
      
      if (customSettings && customSettings.display_settings) {
        const displaySettings = customSettings.display_settings;
        const customSymbols = customSettings.custom_symbols || {};
        
        const decimalPlaces = displaySettings.decimal_places || 2;
        const showSymbol = displaySettings.show_symbol !== false;
        const symbolPosition = displaySettings.symbol_position || 'before';
        
        // ✅ FIX: تحديد نوع العرض بناءً على الإعدادات
        if (customSymbols[formCurrency]) {
          currencyDisplay = customSymbols[formCurrency];
          console.log(`🔤 Using custom symbol for ${formCurrency}: ${customSymbols[formCurrency]}`);
        } else {
          // تحديد نوع العرض: إذا كان showSymbol = true فعرض الرمز، وإلا عرض الكود
          const displayType = showSymbol ? 'symbol' : 'code';
          currencyDisplay = getCurrencySymbol(formCurrency, displayType);
          console.log(`🔤 Display type: ${displayType}, Currency: ${formCurrency}, Display: ${currencyDisplay}`);
        }
        
        formattedTotal = totalPrice.toFixed(decimalPlaces);
        formattedFinal = finalPrice.toFixed(decimalPlaces);
        
        if (showSymbol) {
          if (symbolPosition === 'after') {
            formattedTotal = `${formattedTotal} ${currencyDisplay}`;
            formattedFinal = `${formattedFinal} ${currencyDisplay}`;
          } else {
            formattedTotal = `${currencyDisplay} ${formattedTotal}`;
            formattedFinal = `${currencyDisplay} ${formattedFinal}`;
          }
        } else {
          // إذا كان show_symbol = false، لا نعرض أي رمز
          formattedTotal = formattedTotal;
          formattedFinal = formattedFinal;
        }
        
        console.log(`🎨 Applied display settings: decimals=${decimalPlaces}, symbol=${showSymbol}, position=${symbolPosition}, display=${currencyDisplay}`);
      } else {
        // إعدادات افتراضية - عرض كود العملة
        formattedTotal = `${totalPrice.toFixed(2)} ${formCurrency}`;
        formattedFinal = `${finalPrice.toFixed(2)} ${formCurrency}`;
      }
      
      console.log(`✅ Final formatted prices: Total=${formattedTotal}, Final=${formattedFinal}`);

      // ✅ إعدادات الألوان المخصصة
      const borderColors = {
        default: '#e5e7eb',
        selected: customStyling?.selectedBorderColor || '#22c55e', // اللون الأخضر افتراضياً
        hover: '#94a3b8'
      };
      
      // تصميم العرض مطابق للمعاينة مع إعدادات الألوان المخصصة
      offerElement.style.cssText = `
        background: #ffffff;
        border: 2px solid ${index === 0 ? borderColors.selected : borderColors.default};
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

      // إضافة أحداث التفاعل مع الألوان المخصصة
      offerElement.addEventListener('click', function() {
        // إزالة التحديد من العروض الأخرى
        container.querySelectorAll('div').forEach(el => {
          if (el !== this) {
            el.style.borderColor = borderColors.default;
            el.style.backgroundColor = '#ffffff';
          }
        });
        
        // تحديد العرض الحالي باللون الأخضر (أو المخصص)
        this.style.borderColor = borderColors.selected;
        this.style.backgroundColor = '#f0fdf4'; // خلفية خضراء فاتحة
      });

      offerElement.addEventListener('mouseenter', function() {
        // التحقق من اللون الحالي لتجنب تغيير العنصر المحدد
        const currentColor = this.style.borderColor;
        const selectedColorRGB = 'rgb(34, 197, 94)'; // #22c55e in RGB
        
        if (currentColor !== selectedColorRGB) {
          this.style.borderColor = borderColors.hover;
        }
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      });

      offerElement.addEventListener('mouseleave', function() {
        // التحقق من اللون الحالي لتجنب تغيير العنصر المحدد
        const currentColor = this.style.borderColor;
        const selectedColorRGB = 'rgb(34, 197, 94)'; // #22c55e in RGB
        
        if (currentColor !== selectedColorRGB) {
          this.style.borderColor = borderColors.default;
        }
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      });

      container.appendChild(offerElement);
    }

    console.log("✅ Fixed quantity offers displayed successfully");
  }

  // دالة تحميل وعرض العروض مع جلب عملة النموذج من API
  async function loadAndDisplayOffers(blockId, productId, shop, defaultCurrency = null, productData = null) {
    try {
      console.log(`🔄 Loading offers for: ${productId} at ${shop}`);
      
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📊 API Response:", data);
      
      if (data.success && data.quantity_offers) {
        console.log("✅ Offers loaded successfully");
        
        // ✅ CRITICAL FIX: استخدام عملة النموذج من API وليس المرسلة
        const formCurrency = data.form?.currency || data.currency || 'USD';
        console.log(`🎯 FORM CURRENCY FROM API: ${formCurrency}`);
        console.log(`🛍️ PRODUCT DATA FROM API:`, data.product);
        
        // ✅ حفظ البيانات للاستخدام المستقبلي
        window.currentQuantityOffersData = data.quantity_offers;
        window.currentProductId = productId;
        window.currentProductData = data.product; // استخدام بيانات المنتج من API
        window.currentFormCurrency = formCurrency; // حفظ عملة النموذج
        
        displayQuantityOffers(data.quantity_offers, blockId, productId, formCurrency, data.product);
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

console.log("✅ Fixed CODFORM Quantity Offers loaded with Custom Currency Settings");
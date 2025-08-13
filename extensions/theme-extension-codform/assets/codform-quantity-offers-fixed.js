/**
 * CODFORM Quantity Offers - إصلاح كامل مع إعدادات العملة المخصصة
 * نسخة محسنة مع معالجة الأخطاء وإعدادات افتراضية
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // Per-shop currency settings cache
  const currencySettingsCache = {};

  // Function to fetch and cache custom currency settings (with fallback) PER SHOP
  async function getCustomCurrencySettings(shopId) {
    if (!shopId) return null;
    if (currencySettingsCache[shopId]) {
      return currencySettingsCache[shopId];
    }

    try {
      console.log(`🔍 Fetching custom currency settings for shop: ${shopId}`);
      // Use GET as the edge function only allows GET
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shop_id=${encodeURIComponent(shopId)}`, {
        method: 'GET',
        headers: {
'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ Currency settings API returned ${response.status}, using defaults`);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Custom currency settings fetched:', data);
      currencySettingsCache[shopId] = data;
      return data;
    } catch (error) {
      console.warn('⚠️ Using default currency settings due to error:', error);
      const defaults = {
        success: true,
        display_settings: {
          show_symbol: true,
          symbol_position: 'before',
          decimal_places: 2
        },
        custom_symbols: {},
        custom_rates: {},
        all_rates: null
      };
      currencySettingsCache[shopId] = defaults;
      return defaults;
    }
  }

  // Enhanced currency conversion with custom rates
  async function convertCurrency(amount, fromCurrency, toCurrency, shopId) {
    // Get custom settings
    const shopDomain = shopId || (window.Shopify && (window.Shopify.shop || window.Shopify.shop_domain)) || window.codformShopDomain || (window.getShopDomain && window.getShopDomain()) || window.location.hostname;
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

    // Apply custom rates if available (all_rates takes precedence)
    const mergedRates = settings.all_rates || settings.custom_rates || {};
    if (mergedRates && Object.keys(mergedRates).length > 0) {
      exchangeRates = { ...exchangeRates, ...mergedRates };
      console.log('💱 Using merged exchange rates:', mergedRates);
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

    // ✅ تحديد اتجاه النموذج بناءً على لغة المحتوى
    const detectFormDirection = () => {
      // البحث عن أي نص عربي في العروض
      const hasArabicText = offers.some(offer => {
        const text = offer.text || '';
        return /[\u0600-\u06FF]/.test(text);
      });
      
      // البحث عن نص عربي في النموذج نفسه
      const formElements = document.querySelectorAll('input, label, button, p, h1, h2, h3, h4, h5, h6');
      const hasArabicInForm = Array.from(formElements).some(el => {
        return /[\u0600-\u06FF]/.test(el.textContent || el.placeholder || '');
      });
      
      console.log(`🔍 Language detection: Arabic in offers: ${hasArabicText}, Arabic in form: ${hasArabicInForm}`);
      
      return (hasArabicText || hasArabicInForm) ? 'rtl' : 'ltr';
    };

    const formDirection = detectFormDirection();

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
    const shopDomain = (window.Shopify && (window.Shopify.shop || window.Shopify.shop_domain)) || window.codformShopDomain || (window.getShopDomain && window.getShopDomain()) || window.location.hostname;
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
      let currencyDisplay = formCurrency; // عرض كود العملة افتراضياً
      let decimalPlaces = 2;
      let showSymbol = true;
      let symbolPosition = 'before';
      let displayText = formCurrency;
      
      if (customSettings && customSettings.display_settings) {
        const displaySettings = customSettings.display_settings;
        const customSymbols = customSettings.custom_symbols || {};
        
        decimalPlaces = displaySettings.decimal_places ?? 2; // احترم القيمة 0
        showSymbol = displaySettings.show_symbol !== false;
        symbolPosition = displaySettings.symbol_position || 'before';
        
        // ✅ تحديد نوع العرض بناءً على الإعدادات
        if (customSymbols[formCurrency]) {
          currencyDisplay = customSymbols[formCurrency];
          console.log(`🔤 Using custom symbol for ${formCurrency}: ${customSymbols[formCurrency]}`);
        } else {
          const displayType = showSymbol ? 'symbol' : 'code';
          currencyDisplay = getCurrencySymbol(formCurrency, displayType);
          console.log(`🔤 Display type: ${displayType}, Currency: ${formCurrency}, Display: ${currencyDisplay}`);
        }
        displayText = showSymbol ? currencyDisplay : formCurrency;
        
        formattedTotal = totalPrice.toFixed(decimalPlaces);
        formattedFinal = finalPrice.toFixed(decimalPlaces);
        
        if (symbolPosition === 'after') {
          formattedTotal = `${formattedTotal} ${displayText}`;
          formattedFinal = `${formattedFinal} ${displayText}`;
        } else {
          formattedTotal = `${displayText} ${formattedTotal}`;
          formattedFinal = `${displayText} ${formattedFinal}`;
        }
        
        console.log(`🎨 Applied display settings: decimals=${decimalPlaces}, symbol=${showSymbol}, position=${symbolPosition}, display=${currencyDisplay}`);
      } else {
        // إعدادات افتراضية - عرض كود العملة
        formattedTotal = `${totalPrice.toFixed(decimalPlaces)} ${formCurrency}`;
        formattedFinal = `${finalPrice.toFixed(decimalPlaces)} ${formCurrency}`;
      }
      
      // ✅ تنسيق سعر الوحدة بنفس الإعدادات
      let formattedUnitText = (finalPrice / quantity).toFixed(decimalPlaces);
      if (symbolPosition === 'after') {
        formattedUnitText = `${formattedUnitText} ${showSymbol ? currencyDisplay : formCurrency}`;
      } else {
        formattedUnitText = `${showSymbol ? currencyDisplay : formCurrency} ${formattedUnitText}`;
      }
      
      console.log(`✅ Final formatted prices: Total=${formattedTotal}, Final=${formattedFinal}, Unit=${formattedUnitText}`);

      // ✅ إعدادات الألوان المخصصة
      const borderColors = {
        default: '#e5e7eb',
        selected: customStyling?.selectedBorderColor || '#22c55e', // اللون الأخضر افتراضياً
        hover: '#94a3b8'
      };
      
      // تصميم العرض مطابق للمعاينة مع إعدادات الألوان المخصصة بدون خلفية خضراء
      const isHighlighted = index === 1; // العرض الثاني مُبرز
      
      offerElement.setAttribute('data-offer', index);
      offerElement.style.cssText = `
        background: #ffffff;
        border: 2px solid ${isHighlighted ? '#22c55e' : '#e5e7eb'};
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Cairo', Arial, sans-serif;
        cursor: pointer;
        direction: ${formDirection};
        text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
        box-shadow: ${isHighlighted ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'};
        transition: all 0.3s ease;
      `;

      // محتوى العرض مطابق للمعاينة تماماً
      offerElement.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; ${formDirection === 'rtl' ? 'flex-direction: row;' : 'flex-direction: row;'}">
            <div style="width: 48px; height: 48px; background: #f3f4f6; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${productImage ? `
                <img src="${productImage}" 
                     alt="${productTitle}"
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <svg style="width: 32px; height: 32px; color: #9ca3af; display: none;" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              ` : `
                <svg style="width: 32px; height: 32px; color: #9ca3af;" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              `}
            </div>
            
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #1f2937; text-align: ${formDirection === 'rtl' ? 'right' : 'left'};">
                ${offer.text || (formDirection === 'rtl' ? `اشترِ ${quantity} قطعة` : `Buy ${quantity} item${quantity > 1 ? 's' : ''}`)}
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; justify-content: flex-start; ${formDirection === 'rtl' ? 'direction: rtl;' : 'direction: ltr;'}">
                ${offer.tag ? `
                  <div style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; text-align: center;">
                    ${offer.tag}
                  </div>
                ` : ''}
                ${discountValue > 0 ? `
                  <div style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; text-align: center;">
                    Save ${Math.round(discountValue)}%
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

        <div style="text-align: ${formDirection === 'rtl' ? 'left' : 'right'}; direction: ${formDirection};">
          ${discountValue > 0 ? `
            <div style="font-size: 14px; text-decoration: line-through; color: #9ca3af; margin-bottom: 2px;">
              ${formattedTotal}
            </div>
          ` : ''}
          <div style="font-weight: 700; font-size: 18px; color: #059669;">
            ${formattedFinal}
          </div>
          ${quantity > 1 ? `
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
              ${formattedUnitText} × ${quantity}
            </div>
          ` : ''}
        </div>
      `;

      // إضافة أحداث التفاعل مع الألوان المخصصة
      offerElement.addEventListener('click', function() {
        // إزالة التحديد من العروض الأخرى
        container.querySelectorAll('[data-offer]').forEach(el => {
          if (el !== this) {
            el.style.borderColor = borderColors.default;
            el.style.backgroundColor = '#ffffff';
          }
        });
        
        // تحديد العرض الحالي - فقط الحدود الخضراء
        this.style.borderColor = borderColors.selected;
        this.style.backgroundColor = '#ffffff';

        // 🎯 CRITICAL FIX: إرسال حدث لتحديث Cart Summary
        const selectedOffer = {
          quantity: quantity,
          finalPrice: finalPrice,
          originalPrice: convertedBasePrice, // استخدام السعر الأساسي المحول
          text: offer.text || (formDirection === 'rtl' ? `اشترِ ${quantity} قطعة` : `Buy ${quantity} item${quantity > 1 ? 's' : ''}`),
          tag: offer.tag
        };

        console.log('🎯 Quantity Offers - Dispatching offer-selected event:', selectedOffer);
        
        // إرسال حدث لتحديث Cart Summary
        window.dispatchEvent(new CustomEvent('codform:offer-selected', {
          detail: { offer: selectedOffer }
        }));

        // تحديث State Manager إذا كان متوفراً
        if (window.CodformStateManager) {
          window.CodformStateManager.setState({
            currentQuantity: quantity,
            finalPrice: finalPrice,
            unitPrice: convertedBasePrice, // استخدام السعر الأساسي المحول
            selectedOffer: selectedOffer
          });
        }
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
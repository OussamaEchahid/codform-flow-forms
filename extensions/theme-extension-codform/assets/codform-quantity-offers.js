/**
 * CODFORM Quantity Offers Handler - EXACT PREVIEW MATCH
 * مطابقة دقيقة 100% للمعاينة في الحجم والتصميم والسعر
 */

window.CodformQuantityOffers = (function() {
  'use strict';

  // ✅ Local currency settings cache when Unified System isn't present
  let __codformCurrencySettings = null;

  async function __ensureCurrencySettings() {
    try {
      if (window.CodformUnifiedSystem) return; // Unified System handles settings globally
      if (__codformCurrencySettings) return;

      // Try cached settings written by other components
      const cached = localStorage.getItem('codform_currency_settings');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          __codformCurrencySettings = {
            showSymbol: parsed.displaySettings?.showSymbol ?? true,
            symbolPosition: parsed.displaySettings?.symbolPosition || 'before',
            decimalPlaces: parsed.displaySettings?.decimalPlaces ?? 2,
            customSymbols: parsed.customSymbols || {},
            customRates: parsed.exchangeRates || {}
          };
          return;
        } catch (_) { /* ignore */ }
      }

      // Fetch from API as fallback
      const shopDomain = (typeof Shopify !== 'undefined' && (Shopify.shop || Shopify.shop_domain)) || (window.getShopDomain && window.getShopDomain()) || window.codformShopDomain || window.location.hostname;
      if (!shopDomain) return;

      const res = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/get-shop-currency-settings?shop_id=${encodeURIComponent(shopDomain)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
        }
      });

      if (res.ok) {
        const data = await res.json();
        __codformCurrencySettings = {
          showSymbol: data.display_settings?.show_symbol ?? true,
          symbolPosition: data.display_settings?.symbol_position || 'before',
          decimalPlaces: data.display_settings?.decimal_places ?? 2,
          customSymbols: data.custom_symbols || {},
          customRates: data.custom_rates || {}
        };

        // Cache in a uniform shape for other scripts
        localStorage.setItem('codform_currency_settings', JSON.stringify({
          currency: null,
          exchangeRates: __codformCurrencySettings.customRates,
          displaySettings: {
            showSymbol: __codformCurrencySettings.showSymbol,
            symbolPosition: __codformCurrencySettings.symbolPosition,
            decimalPlaces: __codformCurrencySettings.decimalPlaces
          },
          customSymbols: __codformCurrencySettings.customSymbols
        }));
      }
    } catch (_) { /* ignore */ }
  }

  // دالة تحويل العملة مع Ultimate Currency System
  function convertCurrency(amount, fromCurrency, toCurrency) {
    fromCurrency = (fromCurrency || 'USD').toString().toUpperCase().trim();
    toCurrency = (toCurrency || 'MAD').toString().toUpperCase().trim();

    // استخدام Unified System أولاً إن توفر
    if (window.CodformUnifiedSystem && typeof window.CodformUnifiedSystem.convertCurrency === 'function') {
      return window.CodformUnifiedSystem.convertCurrency(amount, fromCurrency, toCurrency);
    }
    // استخدام Ultimate Currency System الجديد
    if (window.CodformUltimateCurrency && typeof window.CodformUltimateCurrency.convertCurrency === 'function') {
      return window.CodformUltimateCurrency.convertCurrency(amount, fromCurrency, toCurrency);
    }

    // استخدام Currency Manager إذا كان متاحاً
    if (window.CodformCurrencyManager) {
      if (typeof window.CodformCurrencyManager.convertCurrency === 'function') {
        return window.CodformCurrencyManager.convertCurrency(amount, fromCurrency, toCurrency);
      }
      // Fallback: حساب يدوي بمعدلات مخصصة من المدير إذا توفرت
      if (typeof window.CodformCurrencyManager.getRates === 'function') {
        const defaultRates = { 'USD': 1.0, 'SAR': 3.75, 'AED': 3.67, 'MAD': 10.0, 'EUR': 0.85, 'GBP': 0.75, 'XOF': 655.96, 'XAF': 655.96 };
        const custom = window.CodformCurrencyManager.getRates() || {};
        const rates = { ...defaultRates, ...custom };
        if (fromCurrency === toCurrency) return amount;
        const fromRate = rates[fromCurrency] || 1;
        const toRate = rates[toCurrency] || 1;
        const usdAmount = amount / fromRate;
        return usdAmount * toRate;
      }
    }

    // استخدام CurrencyService إذا كان متاحاً
    if (window.CurrencyService && typeof window.CurrencyService.convertCurrency === 'function') {
      return window.CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
    }

    // الاحتياطي: استخدام الأسعار المحلية + أي معدلات مخصصة متاحة
    const defaultRates = {
      'USD': 1.0, 'SAR': 3.75, 'AED': 3.67, 'MAD': 10.0, 'EUR': 0.85, 'GBP': 0.75,
      'INR': 83.0, 'IDR': 15850, 'PKR': 280, 'BDT': 110, 'LKR': 300, 'NPR': 133, 'BTN': 83, 'MMK': 2100, 'KHR': 4100, 'LAK': 20000, 'VND': 24000, 'THB': 36, 'MYR': 4.7, 'SGD': 1.35, 'HKD': 7.8, 'KRW': 1345, 'CNY': 7.24, 'JPY': 149,
      'XOF': 655.96, 'XAF': 655.96
    };
    const customRates = (__codformCurrencySettings && __codformCurrencySettings.customRates) || {};
    const exchangeRates = { ...defaultRates, ...customRates };

    if (fromCurrency === toCurrency) return amount;

    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  // دالة تنسيق العملة مع Ultimate Currency System
  function formatCurrency(amount, currency, language = 'en') {
    currency = (currency || 'MAD').toString().toUpperCase().trim();
    // استخدام Unified System أولاً إن توفر
    if (window.CodformUnifiedSystem && typeof window.CodformUnifiedSystem.formatCurrency === 'function') {
      return window.CodformUnifiedSystem.formatCurrency(amount, currency, language);
    }
    // استخدام Ultimate Currency System الجديد
    if (window.CodformUltimateCurrency && typeof window.CodformUltimateCurrency.formatCurrency === 'function') {
      return window.CodformUltimateCurrency.formatCurrency(amount, currency);
    }

    // استخدام Currency Manager إذا كان متاحاً
    if (window.CodformCurrencyManager) {
      if (typeof window.CodformCurrencyManager.formatCurrency === 'function') {
        return window.CodformCurrencyManager.formatCurrency(amount, currency, language);
      }
      // Fallback: بناء التنسيق يدوياً من الإعدادات
      if (typeof window.CodformCurrencyManager.getSettings === 'function') {
        const s = window.CodformCurrencyManager.getSettings() || {};
        const decimalPlaces = s.decimalPlaces ?? s.decimal_places ?? 2;
        const showSymbol = s.showSymbol !== false && s.show_symbol !== false;
        const symbolPosition = s.symbolPosition || s.symbol_position || 'before';
        const customSymbols = s.customSymbols || {};
        const defaultSymbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'SAR': 'ر.س', 'AED': 'د.إ', 'MAD': 'د.م', 'INR': '₹', 'IDR': 'Rp', 'PKR': '₨', 'BDT': '৳', 'LKR': 'Rs', 'NPR': '₨', 'BTN': 'Nu.', 'MMK': 'K', 'KHR': '៛', 'LAK': '₭', 'VND': '₫', 'THB': '฿', 'MYR': 'RM', 'SGD': 'S$', 'HKD': 'HK$', 'KRW': '₩', 'CNY': '¥', 'JPY': '¥', 'XOF': 'CFA', 'XAF': 'FCFA' };
        const displaySymbol = customSymbols[currency] || defaultSymbols[currency] || currency;
        const amt = Number.isFinite(amount) ? amount.toFixed(decimalPlaces) : '0.00';
        if (!showSymbol) return amt;
        return symbolPosition === 'before' ? `${displaySymbol} ${amt}` : `${amt} ${displaySymbol}`;
      }
    }

    // استخدام الإعدادات المحلية إذا كانت متاحة
    if (__codformCurrencySettings) {
      const s = __codformCurrencySettings;
      const decimalPlaces = s.decimalPlaces ?? 2;
      const showSymbol = s.showSymbol !== false;
      const symbolPosition = s.symbolPosition || 'before';
      const defaultSymbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'SAR': 'ر.س', 'AED': 'د.إ', 'MAD': 'د.م', 'INR': '₹', 'IDR': 'Rp', 'PKR': '₨', 'BDT': '৳', 'LKR': 'Rs', 'NPR': '₨', 'BTN': 'Nu.', 'MMK': 'K', 'KHR': '៛', 'LAK': '₭', 'VND': '₫', 'THB': '฿', 'MYR': 'RM', 'SGD': 'S$', 'HKD': 'HK$', 'KRW': '₩', 'CNY': '¥', 'JPY': '¥', 'XOF': 'CFA', 'XAF': 'FCFA' };
      const symbol = s.customSymbols[currency] || defaultSymbols[currency] || currency;
      const amt = Number.isFinite(amount) ? amount.toFixed(decimalPlaces) : '0.00';
      if (!showSymbol) return amt;
      return symbolPosition === 'before' ? `${symbol} ${amt}` : `${amt} ${symbol}`;
    }

    // استخدام CurrencyService إذا كان متاحاً للتنسيق المخصص
    if (window.CurrencyService && typeof window.CurrencyService.formatCurrency === 'function') {
      return window.CurrencyService.formatCurrency(amount, currency, language);
    }

    // التنسيق الاحتياطي
    const symbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'SAR': 'ر.س', 'AED': 'د.إ', 'MAD': 'د.م'
    };
    const symbol = symbols[currency] || currency;
    return language === 'ar' ? `${symbol} ${amount.toFixed(2)}` : `${amount.toFixed(2)} ${symbol}`;
  }

  // دالة عرض quantity offers مطابقة بالضبط للمعاينة
  function displayQuantityOffers(quantityOffersData, blockId, productId, formCurrency = null, productData = null, formDirection = null) {
    console.log("🎯 EXACT PREVIEW MATCH - Starting quantity offers display");

    // تحديد اتجاه النموذج بناءً على محتواه الفعلي
    if (!formDirection) {
      // البحث عن النموذج المرتبط بهذا blockId
      const formContainer = document.getElementById(`quantity-offers-before-${blockId}`)
        || document.querySelector(`#${blockId}`)
        || document.querySelector(`[data-block-id="${blockId}"]`);

      if (formContainer) {
        // فحص النموذج الرئيسي والعناصر المحيطة
        const parentForm = formContainer.closest('form') || formContainer.closest('[dir]') || document.body;
        const formText = (formContainer.textContent || '') + (parentForm.textContent || '');

        // تحسين منطق تحديد اتجاه النص للدقة الكاملة
        const blockElement = document.getElementById(blockId);

        // 1. فحص dir attribute على البلوك المحدد أولاً
        if (blockElement && blockElement.getAttribute('dir')) {
          formDirection = blockElement.getAttribute('dir');
          console.log('🎯 Direction from block dir:', formDirection);
        }
        // 2. فحص dir على النموذج المباشر
        else if (parentForm && parentForm.getAttribute('dir')) {
          formDirection = parentForm.getAttribute('dir');
          console.log('🎯 Direction from form dir:', formDirection);
        }
        // 3. فحص lang attribute على البلوك أولاً
        else if (blockElement && blockElement.getAttribute('lang')) {
          const blockLang = blockElement.getAttribute('lang').toLowerCase();
          formDirection = ['ar', 'he', 'fa', 'ur'].includes(blockLang) ? 'rtl' : 'ltr';
          console.log('🎯 Direction from block lang:', blockLang, '→', formDirection);
        }
        // 4. فحص lang على النموذج
        else if (parentForm && parentForm.getAttribute('lang')) {
          const lang = parentForm.getAttribute('lang').toLowerCase();
          formDirection = ['ar', 'he', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr';
          console.log('🎯 Direction from form lang:', lang, '→', formDirection);
        }
        // 5. الكشف الذكي عن المحتوى العربي في البلوك المحدد فقط
        else if (blockElement) {
          // جمع النصوص من البلوك المحدد فقط
          const blockSpecificText = Array.from(blockElement.querySelectorAll('*'))
            .filter(el => !el.querySelector('*')) // النصوص الورقية فقط
            .map(el => el.textContent)
            .join(' ')
            .trim();

          const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
          const arabicMatches = blockSpecificText.match(arabicPattern) || [];
          const nonSpaceChars = blockSpecificText.replace(/\s+/g, '').length;

          if (nonSpaceChars > 0) {
            const arabicPercentage = (arabicMatches.length / nonSpaceChars) * 100;
            console.log('🎯 Block text analysis:', {
              text: blockSpecificText.substring(0, 50) + '...',
              arabicChars: arabicMatches.length,
              totalChars: nonSpaceChars,
              percentage: arabicPercentage.toFixed(1) + '%'
            });

            // استخدام نسبة أعلى للدقة (40% بدلاً من 30%)
            formDirection = arabicPercentage > 40 ? 'rtl' : 'ltr';
            console.log('🎯 Direction from content analysis:', formDirection);
          }
        }
        // 6. الرجوع للفحص العام كملاذ أخير
        else {
          const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/g;
          const arabicChars = (formText.match(arabicRegex) || []).length;
          const totalChars = formText.replace(/\s/g, '').length;
          formDirection = totalChars > 0 && (arabicChars / totalChars) > 0.4 ? 'rtl' : 'ltr';
          console.log('🎯 Direction from fallback analysis:', formDirection);
        }
      } else {
        formDirection = 'ltr'; // افتراضي
      }
    }

    console.log("🧭 Form direction detected:", {
      blockId,
      formDirection,
      method: 'dynamic detection'
    });

    // التحقق من صحة البيانات
    if (!quantityOffersData || !quantityOffersData.offers || !Array.isArray(quantityOffersData.offers)) {
      console.log("❌ Invalid quantity offers data");
      return;
    }

    const offers = quantityOffersData.offers;
    // Make offers available globally for other components (e.g., State Manager)
    try { window.availableQuantityOffers = Array.isArray(offers) ? offers : []; } catch (_) {}
    if (offers.length === 0) {
      console.log("ℹ️ No offers to display");
      return;
    }

    console.log("🔍 DEBUGGING offers display:", {
      offersLength: offers.length,
      blockId,
      containerId: `quantity-offers-before-${blockId}`
    });

    // استخدام Boot payload الموحد إذا كان متاحاً
    try {
      let boot = window.CodformBootData;
      // لا نستخدم await هنا لأن الدالة ليست async؛ نكتفي بالكاش الفوري
      if (boot && boot.success) {
        try { window.currentProductData = boot.product || window.currentProductData; } catch(_) {}
        if (boot.form && !formCurrency) {
          formCurrency = boot.form.currency || formCurrency;
        }
        if (boot.quantity_offers && !quantityOffersData) {
          quantityOffersData = boot.quantity_offers;
        }
      }
    } catch(_) {}

    // اختيار الحاوية بناءً على الموضع المطلوب
    const desiredPosition = quantityOffersData.position || 'before_form';
    const customSelector = quantityOffersData.custom_selector || null;
    let container = null;

    const isPopup = (blockId === 'popup-form');
    const beforeId = isPopup ? 'quantity-offers-before-popup-form' : `quantity-offers-before-${blockId}`;
    const afterId = isPopup ? 'quantity-offers-after-popup-form' : 'quantity-offers-after-form';

    if (desiredPosition === 'after_form') {
      container = document.getElementById(afterId) || document.getElementById(beforeId);
    } else if (desiredPosition === 'inside_form') {
      // حاول استخدام محدد مخصص إن وُجد
      if (customSelector) {
        const target = document.querySelector(customSelector);
        if (target) {
          // أنشئ حاوية مؤقتة داخل النموذج بالقرب من العنصر المستهدف
          let inside = document.getElementById('quantity-offers-inside-form');
          if (!inside) {
            inside = document.createElement('div');
            inside.id = 'quantity-offers-inside-form';
            inside.className = 'quantity-offers-container';
            inside.style.margin = '16px 0';
            target.parentNode.insertBefore(inside, target);
          }
          container = inside;
        }
      }
      // إن لم ينجح، ضعها قبل زر الإرسال داخل النموذج
      if (!container) {
        const formEl = document.getElementById(isPopup ? 'codform-popup-form' : 'codform-main-form');
        const submitBtn = formEl && (formEl.querySelector('button[type="submit"], input[type="submit"], [onclick*="submit"]'));
        if (submitBtn && formEl) {
          let inside = document.getElementById('quantity-offers-inside-form');
          if (!inside) {
            inside = document.createElement('div');
            inside.id = 'quantity-offers-inside-form';
            inside.className = 'quantity-offers-container';
            inside.style.margin = '16px 0';
            submitBtn.parentNode.insertBefore(inside, submitBtn);
          }
          container = inside;
        }
      }
      // Fallback إلى الموضع قبل النموذج لو تعذر
      if (!container) container = document.getElementById(beforeId);
    } else {
      // before_form (افتراضي)
      container = document.getElementById(beforeId);
    }

    if (!container) {
      console.error("❌ Container not found:", desiredPosition, beforeId);
      const anyContainer = document.querySelector('[id*="quantity-offers"]');
      if (anyContainer) {
        console.log("🔧 Using alternative container:", anyContainer.id);
        container = anyContainer;
      } else {
        console.error("❌ No quantity offers container found at all");
        return;
      }
    }

    // مسح المحتوى السابق
    container.innerHTML = '';
    container.style.display = 'block';

    // ✅ Apply styling from saved settings with sensible BLACK defaults for text/price
    const styling = {
      backgroundColor: quantityOffersData.styling?.backgroundColor || '#22c55e',
      textColor: quantityOffersData.styling?.textColor || '#000000',
      tagColor: quantityOffersData.styling?.tagColor || '#22c55e',
      priceColor: quantityOffersData.styling?.priceColor || '#000000'
    };

    // Helper: lighten a hex color by mixing with white (amount 0..1)
    function lightenColor(hex, amount) {
      try {
        const h = hex.replace('#','');
        const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
        let r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
        r = Math.round(r + (255 - r) * amount);
        g = Math.round(g + (255 - g) * amount);
        b = Math.round(b + (255 - b) * amount);
        const toHex = (v) => v.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      } catch(_) { return hex; }
    }

    const baseColor = styling.backgroundColor || '#22c55e';
    const cardBg = lightenColor(baseColor, 0.92);      // قريب من #F0FDF4
    const selectedBg = lightenColor(baseColor, 0.96);  // أفتح عند التحديد

    console.log('🎨 APPLYING STYLING WITH GREEN DEFAULT:', { ...styling, cardBg, selectedBg });

    // ✅ CRITICAL FIX: Use real product data from API call - verify structure
    let actualProductData = productData;

    console.log("🔥 FINAL DEBUG - Product data received:", {
      productDataFromAPI: productData,
      globalProductData: window.CodformProductData,
      usingData: actualProductData
    });

    // ✅ Get the real form currency from the form data
    let targetFormCurrency = formCurrency || window.CodformFormData?.currency || window.currentFormData?.savedFormCurrency;

    console.log('💰✅ Quantity Offers - Form currency parameter:', formCurrency);
    console.log('💰✅ Quantity Offers - window.CodformFormData.currency:', window.CodformFormData?.currency);
    console.log('💰✅ Quantity Offers - Final target currency:', targetFormCurrency);

    // ✅ Get real product price from API response (not default 1.00)
    let productPrice = null;
    let productCurrency = null;

    // ✅ CRITICAL FIX: Get the REAL product price from window.CodformProductData or API
    if (window.CodformProductData && window.CodformProductData.price) {
      // Use the real product data that was loaded from forms-product API
      productPrice = parseFloat(window.CodformProductData.price);
      productCurrency = window.CodformProductData.currency || 'USD';
      console.log("💰✅ Using REAL product data from CodformProductData:", {
        price: productPrice,
        currency: productCurrency,
        source: "window.CodformProductData"
      });
    } else if (actualProductData && actualProductData.price && actualProductData.price > 0) {
      productPrice = parseFloat(actualProductData.price);
      productCurrency = actualProductData.currency || 'USD';
      console.log("💰✅ Using product data from parameter:", {
        price: productPrice,
        currency: productCurrency,
        source: "actualProductData parameter"
      });
    } else {
      console.error("❌ CRITICAL: No valid product data found!", {
        windowCodformProductData: window.CodformProductData,
        actualProductData: actualProductData
      });
      container.innerHTML = '<div style="color: red; padding: 10px; border: 2px solid red; background: #ffebee; margin: 10px; border-radius: 4px; font-weight: bold;">❌ ERROR: No real product data found</div>';
      return;
    }

    // ✅ Default to form currency if no target currency found
    if (!targetFormCurrency) {
      targetFormCurrency = productCurrency || 'GBP';
      console.log('💰✅ Using fallback currency:', targetFormCurrency);
    }

    // ✅ VERIFICATION: Ensure we have valid data before conversion
    if (!productPrice || productPrice <= 0) {
      console.error('❌🔥 FINAL CHECK FAILED - Invalid product price:', {
        productPrice,
        productCurrency,
        hasValidPrice: productPrice > 0
      });
      container.innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red;">ERROR: Invalid product price</div>';
      return;
    }

    // ✅ CORRECT CONVERSION: Real product price → Form display currency
    const realPrice = convertCurrency(productPrice, productCurrency, targetFormCurrency);
    const finalCurrency = targetFormCurrency;

    console.log("💰✅ Quantity Offers - CORRECT CONVERSION APPLIED:", {
      shopifyProductPrice: productPrice,
      shopifyProductCurrency: productCurrency,
      formTargetCurrency: targetFormCurrency,
      convertedPriceForDisplay: realPrice,
      conversionDetails: `${productPrice} ${productCurrency} → ${realPrice.toFixed(2)} ${targetFormCurrency}`,
      exchangeRateUsed: `1 ${productCurrency} = ${(realPrice/productPrice).toFixed(4)} ${targetFormCurrency}`
    });

    // بيانات المنتج
    const productTitle = actualProductData?.title || 'المنتج';

    // تحسين الحصول على صورة المنتج من مصادر متعددة
    let productImage = null;
    if (actualProductData) {
      productImage = actualProductData.image ||
                    actualProductData.featured_image ||
                    actualProductData.featuredImage ||
                    (actualProductData.images && actualProductData.images.length > 0 ? actualProductData.images[0] : null) ||
                    (actualProductData.variants && actualProductData.variants.length > 0 && actualProductData.variants[0].image ? actualProductData.variants[0].image : null);
    }

    // محاولة الحصول على الصورة من DOM إذا لم تكن متوفرة في البيانات
    if (!productImage) {
      try {
        const imageSelectors = [
          'img[src*="product"]',
          '.product-image img',
          '[class*="product"] img',
          'img[alt*="product"]',
          '.featured-image img',
          'img[src*="shopify"]'
        ];

        for (const selector of imageSelectors) {
          const imgElement = document.querySelector(selector);
          if (imgElement && imgElement.src && imgElement.src.trim() !== '') {
            productImage = imgElement.src;
            console.log("🖼️ Found product image from DOM:", productImage);
            break;
          }
        }
      } catch (e) {
        console.log("⚠️ Could not extract image from DOM");
      }
    }

    console.log("🖼️ Product Image Debug:", {
      hasProductData: !!actualProductData,
      originalImage: actualProductData?.image,
      featuredImage: actualProductData?.featured_image,
      imagesArray: actualProductData?.images,
      finalImage: productImage
    });

    // رموز العملات الصحيحة لجميع الدول
    const getCurrencySymbol = (currency) => {
      const symbols = {
        'USD': '$', 'SAR': 'ر.س', 'AED': 'د.إ', 'EGP': 'ج.م', 'QAR': 'ر.ق',
        'KWD': 'د.ك', 'BHD': 'د.ب', 'OMR': 'ر.ع', 'JOD': 'د.أ', 'LBP': 'ل.ل',
        'MAD': 'د.م', 'TND': 'د.ت', 'DZD': 'د.ج', 'EUR': '€', 'GBP': '£',
        'CAD': 'C$', 'AUD': 'A$', 'MXN': '$', 'BRL': 'R$', 'ARS': '$',
        'CLP': '$', 'COP': '$', 'PEN': 'S/', 'VES': 'Bs.', 'UYU': '$U',
        'IQD': 'ع.د', 'IRR': '﷼', 'TRY': '₺', 'ILS': '₪', 'SYP': 'ل.س',
        'YER': '﷼', 'NGN': '₦', 'ZAR': 'R', 'KES': 'KSh', 'GHS': '₵',
        'ETB': 'Br', 'TZS': 'TSh', 'UGX': 'USh', 'ZWL': 'Z$', 'ZMW': 'ZK', 'RWF': 'FRw',
        'XOF': 'CFA', 'XAF': 'FCFA'
      };
      return symbols[currency] || currency;
    };

    const currencySymbol = getCurrencySymbol(finalCurrency);

    // حاوية العروض - نفس تصميم المعاينة بالضبط
    const offersContainer = document.createElement('div');
    offersContainer.style.cssText = `
      margin-bottom: 16px;
      direction: ${formDirection === 'rtl' ? 'rtl' : 'ltr'};
    `;

    // عرض العروض مع التخطيط المطابق للمعاينة بالضبط باستخدام DocumentFragment
    const frag = document.createDocumentFragment();
    offers.forEach((offer, index) => {
      // ✅ EXACT MATCH TO PREVIEW - Price calculation logic FIXED
      const quantity = offer.quantity || 1;
      let totalPrice = realPrice * quantity;
      const originalPrice = totalPrice;
      let savingsPercentage = 0;

      // ✅ CRITICAL FIX: Support multiple discount field formats
      const discountValue = parseFloat(offer.discount || offer.discountValue || offer.discount_value || 0);
      const discountType = offer.discountType || offer.discount_type || 'none';
      const saveLabel = formDirection === 'rtl' ? 'وفر' : 'Save';

      console.log('💰 STORE CALCULATION:', {
        offer,
        realPrice,
        quantity,
        originalPrice,
        discountType,
        discountValue
      });

      // Use exact same logic as preview components
      if (discountType === 'fixed' && discountValue > 0) {
        totalPrice = totalPrice - discountValue;
        savingsPercentage = Math.round((discountValue / originalPrice) * 100);
        console.log('💰 FIXED discount applied:', discountValue, 'new price:', totalPrice);
      } else if (discountType === 'percentage' && discountValue > 0) {
        const discount = (totalPrice * discountValue) / 100;
        totalPrice = totalPrice - discount;
        savingsPercentage = discountValue;
        console.log('💰 PERCENTAGE discount applied:', discountValue + '%', 'discount amount:', discount, 'new price:', totalPrice);
      }

      const isDiscounted = discountType !== 'none' && discountValue > 0;
      const isHighlighted = false; // لا اختيار افتراضي لأي عرض

      // عنصر العرض - نفس التصميم والحجم بالضبط من المعاينة
      const offerElement = document.createElement('div');
      offerElement.setAttribute('data-offer-id', offer.id || index);
      offerElement.setAttribute('data-quantity', offer.quantity);
      offerElement.setAttribute('data-total-price', totalPrice.toFixed(2));

      // ✅ Default (غير محدد): خلفية بيضاء وحد رمادي
      offerElement.style.cssText = `
        padding: 12px;
        border-radius: 8px;
        border: 2px solid #e5e7eb;
        background-color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        column-gap: 12px;
        transition: all 0.3s ease;
        cursor: pointer;
        margin-bottom: 8px;
        direction: ${formDirection};
        box-shadow: none;
      `;

      // إضافة وظيفة النقر لاختيار العرض
      offerElement.addEventListener('click', function() {
        // إزالة التحديد من جميع العروض
        const allOffers = container.querySelectorAll('[data-offer-id]');
        allOffers.forEach(el => {
          el.style.borderColor = '#e5e7eb';
          el.style.backgroundColor = '#ffffff';
          el.style.boxShadow = 'none';
          el.dataset.selected = 'false';
        });

        // تحديد العرض المختار
        this.style.borderColor = baseColor;
        this.style.backgroundColor = selectedBg;
        this.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.2)';
        this.dataset.selected = 'true';

        // تحديث كمية المنتج في النموذج
        const quantity = this.getAttribute('data-quantity');
        const totalPrice = this.getAttribute('data-total-price');

        console.log(`✅ Selected offer: ${quantity} items for ${totalPrice} ${currencySymbol}`);

        // إرسال حدث لتحديث النموذج (توافقاً مع الإصدارات السابقة)
        try {
          window.dispatchEvent(new CustomEvent('quantityOfferSelected', {
            detail: {
              offerId: this.getAttribute('data-offer-id'),
              quantity: parseInt(quantity),
              totalPrice: parseFloat(totalPrice),
              currency: targetFormCurrency
            }
          }));
        } catch (_) {}

        // 🎯 الأحداث القياسية المستخدمة من ملخص الطلب وباقي المكونات
        try {
          const selectedOffer = {
            quantity: parseInt(quantity),
            discount: discountValue,
            discountType: discountType,
            finalPrice: parseFloat(totalPrice),
            originalPrice: originalPrice,
            text: offer.text || (formDirection === 'rtl' ? `اشترِ ${offer.quantity || 1} قطعة` : `Buy ${offer.quantity || 1}`),
            tag: offer.tag || null
          };
          window.dispatchEvent(new CustomEvent('codform:offer-selected', { detail: { offer: selectedOffer } }));
          window.dispatchEvent(new CustomEvent('codform:quantity-changed', { detail: { quantity: parseInt(quantity) } }));

          // تحديث حالة النظام المشتركة إن توفرت
          if (window.CodformStateManager && typeof window.CodformStateManager.setSelectedOffer === 'function') {
            window.CodformStateManager.setSelectedOffer({
              quantity: selectedOffer.quantity,
              discount: selectedOffer.discount,
              discountType: selectedOffer.discountType
            });
          }
        } catch (_) {}
      });

      // تأثيرات hover
      offerElement.addEventListener('mouseenter', function() {
        if (this.dataset.selected !== 'true') {
          this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
      });

      offerElement.addEventListener('mouseleave', function() {
        if (this.dataset.selected !== 'true') {
          this.style.boxShadow = 'none';
        }
      });

      // إنشاء عناصر منفصلة للنص والصورة في RTL
      console.log('🔍 Direction and layout debug:', {
        formDirection,
        isRTL: formDirection === 'rtl',
        layoutType: 'Separate elements layout'
      });

      // النص والعلامات - قريب من الصورة
      const textContainer = document.createElement('div');
      textContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        order: 2;
      `;

      // النص الرئيسي
      const mainText = document.createElement('div');
      mainText.style.cssText = `
        font-weight: 600;
        color: ${styling.textColor || '#000000'};
        text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
        font-size: 16px;
        line-height: 1.4;
      `;
      mainText.textContent = offer.text || `اشترِ ${offer.quantity || 1} قطعة`;

      // العلامات والتوفير
      const tagsContainer = document.createElement('div');
      tagsContainer.style.cssText = `
        display: flex;
        gap: 8px;
        margin-top: 4px;
      `;

      if (offer.tag) {
        const tagElement = document.createElement('div');
        tagElement.style.cssText = `
          background-color: ${styling.tagColor || '#22c55e'};
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        `;
        tagElement.textContent = offer.tag;
        tagsContainer.appendChild(tagElement);
      }

      if (savingsPercentage > 0) {
        const savingsElement = document.createElement('div');
        savingsElement.style.cssText = `
          background-color: ${styling.tagColor || baseColor};
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        `;
        savingsElement.textContent = `${saveLabel} ${savingsPercentage}%`;
        tagsContainer.appendChild(savingsElement);
      }

      textContainer.appendChild(mainText);
      textContainer.appendChild(tagsContainer);

      // الصورة - منفصلة تماماً (order: 2 للـ RTL)
      const imageContainer = document.createElement('div');
      imageContainer.style.cssText = `
        width: 48px;
        height: 48px;
        background-color: #f3f4f6;
        border-radius: 8px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        order: 1;
      `;

      console.log('🖼️ Separate elements order:', {
        formDirection,
        imageOrder: formDirection === 'rtl' ? '2' : '1',
        textOrder: formDirection === 'rtl' ? '1' : '3',
        priceOrder: formDirection === 'rtl' ? '3' : '2'
      });

      // تحسين إدارة الصور
      let imageDisplayed = false;

      // محاولة تحميل الصورة الأساسية
      if (productImage && productImage.trim() !== '') {
        const imageElement = document.createElement('img');

        // تنظيف رابط الصورة
        let cleanImageUrl = productImage.trim();
        if (cleanImageUrl.startsWith('//')) {
          cleanImageUrl = 'https:' + cleanImageUrl;
        }

        imageElement.src = cleanImageUrl;
        imageElement.alt = productTitle;
        imageElement.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 7px;
        `;

        imageElement.onload = function() {
          console.log('✅ Product image loaded successfully:', cleanImageUrl);
          imageDisplayed = true;
        };

        imageElement.onerror = function() {
          console.log('❌ Primary image failed, trying fallback');
          this.remove();
          showFallbackIcon();
        };

        imageContainer.appendChild(imageElement);
      } else {
        showFallbackIcon();
      }

      function showFallbackIcon() {
        if (!imageDisplayed) {
          const iconElement = document.createElement('div');
          iconElement.innerHTML = `📦`;
          iconElement.style.cssText = `
            font-size: 20px;
            color: #9ca3af;
            display: flex;
            align-items: center;
            justify-content: center;
          `;
          imageContainer.appendChild(iconElement);
          console.log('📦 Using fallback icon for product image');
        }
      }

      // الأسعار - في النهاية
      const priceSection = document.createElement('div');
      priceSection.style.cssText = `
        text-align: ${formDirection === 'rtl' ? 'left' : 'right'};
        display: flex;
        flex-direction: column;
        align-items: ${formDirection === 'rtl' ? 'flex-start' : 'flex-end'};
        gap: 2px;
        order: 3;
        flex-shrink: 0;
      `;

      // السعر الأصلي (إذا كان هناك خصم)
      if (isDiscounted) {
        const originalPriceElement = document.createElement('div');
        originalPriceElement.style.cssText = `
          font-size: 14px;
          color: #9ca3af;
          text-decoration: line-through;
          font-weight: 400;
        `;
        originalPriceElement.textContent = formatCurrency(originalPrice, finalCurrency, formDirection === 'rtl' ? 'ar' : 'en');
        originalPriceElement.setAttribute('data-price', `${originalPrice}`);
        originalPriceElement.setAttribute('data-currency', `${finalCurrency}`);
        priceSection.appendChild(originalPriceElement);
      }

      // السعر النهائي - Apply price color styling
      const finalPriceElement = document.createElement('div');
      finalPriceElement.style.cssText = `
        font-size: 18px;
        font-weight: 700;
        color: ${styling.priceColor || '#000000'};
        line-height: 1.2;
      `;
      finalPriceElement.textContent = formatCurrency(totalPrice, finalCurrency, formDirection === 'rtl' ? 'ar' : 'en');
      finalPriceElement.setAttribute('data-price', `${totalPrice}`);
      finalPriceElement.setAttribute('data-currency', `${finalCurrency}`);
      priceSection.appendChild(finalPriceElement);

      // السعر للقطعة الواحدة (إذا كانت الكمية أكثر من 1)


      // تجميع العناصر منفصلة
      offerElement.appendChild(textContainer);
      offerElement.appendChild(imageContainer);
      offerElement.appendChild(priceSection);

      frag.appendChild(offerElement);

      console.log("💰 FINAL PREVIEW MATCH - Price display:", {
        totalPrice: totalPrice,
        display: finalPriceElement.textContent,
        calculation: `${realPrice} x ${offer.quantity} - discount = ${totalPrice.toFixed(2)}`
      });
    });
    // إدراج العناصر التي بُنيت في DocumentFragment داخل حاوية العروض
    offersContainer.appendChild(frag);


    // إضافة حاوية العروض إلى الحاوية الرئيسية
    container.appendChild(offersContainer);

    // إظهار الحاوية فوراً بدون أنيميشن لضمان الظهور
    container.style.opacity = '1';
    container.style.transform = 'none';
    container.style.transition = 'none';
    try {
      if (window.CodformUnifiedSystem && typeof window.CodformUnifiedSystem.updateQuantityOffers === 'function') {
        window.CodformUnifiedSystem.updateQuantityOffers();
      }
    } catch (e) { /* ignore */ }

    console.log("✅ EXACT PREVIEW MATCH - Quantity offers displayed with identical styling");
  }

  // ✅ SPEED BOOST: دالة محسّنة لتحميل وعرض العروض من API مع cache
  async function loadAndDisplayOffers(blockId, productId, shop, formCurrency = null, passedProductData = null, formDirection = null) {
    try {
      if (!shop) {
        shop = (typeof Shopify !== 'undefined' && Shopify.shop) ? Shopify.shop : 'codmagnet.com';
      }

      console.log("🚀 SPEED BOOST: Loading quantity offers for product", productId, "in", blockId, "from shop", shop);
      console.log("💰 Form currency parameter:", formCurrency);
      console.log("💰 Current window.CodformFormData:", window.CodformFormData);

      // Ensure currency settings are available (when Unified System isn't present)
      await __ensureCurrencySettings();

      // ✅ SPEED BOOST: تحقق من cache البيانات أولاً
      const version = (window.CODFORM_APP_VERSION || '').toString();
      const cacheKey = `offers_${version}_${shop}_${productId}`;
      const cachedData = sessionStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          const isExpired = Date.now() - parsedCache.timestamp > (5 * 60 * 1000); // 5 دقائق

          if (!isExpired && parsedCache.data) {
            console.log("🚀 SPEED BOOST: Using cached offers data");
            displayQuantityOffers(parsedCache.data.quantity_offers, blockId, productId, parsedCache.data.currency, parsedCache.data.product, formDirection);
            return { success: true, cached: true };
          } else {
            sessionStorage.removeItem(cacheKey); // إزالة cache منتهي الصلاحية
          }
        } catch (e) {
          sessionStorage.removeItem(cacheKey);
        }
      }

      // ✅ CRITICAL: Check if currency is available from form settings first
      if (!window.CodformFormData || !window.CodformFormData.currency) {
        console.log('⏳ QUANTITY OFFERS: No currency from form settings, calling API to get it...');

        const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}`;
        console.log("🌐 API URL:", apiUrl);

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
        console.log("📊 API Response:", data);

        // ✅ Save the form currency to window global object for other components
        if (data.success && data.currency) {
          if (!window.CodformFormData) {
            window.CodformFormData = {};
          }
          window.CodformFormData.currency = data.currency;
          console.log('💰🔥 Quantity Offers - FORM CURRENCY SAVED FROM API:', data.currency);
        } else {
          console.error('❌🔥 Quantity Offers - API Response missing currency!', data);

          // Show error message like Cart Summary does
          const container = document.getElementById(`quantity-offers-before-${blockId}`);
          if (container) {
            container.innerHTML = '<div style="color: red; padding: 10px; border: 2px solid red; background: #ffebee; margin: 10px; border-radius: 4px; font-weight: bold; text-align: center;">❌ ERROR: No currency configured. Please set form currency first.</div>';
          }
          return;
        }

        if (data.success && data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
          console.log("✅ Found quantity offers and product data");

          // ✅ SPEED BOOST: حفظ البيانات في cache
          const version = (window.CODFORM_APP_VERSION || '').toString();
        const cacheKey = `offers_${version}_${shop}_${productId}`;
          const cacheData = {
            data: data,
            timestamp: Date.now()
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
          console.log("🚀 SPEED BOOST: Data cached for future requests");

          const actualProductId = data.quantity_offers.product_id || productId;
          console.log("🎯 Using actual product ID:", actualProductId);

          // عرض العروض مع البيانات الحقيقية من API باستخدام العملة من إعدادات النموذج فقط
          displayQuantityOffers(
            data.quantity_offers,
            blockId,
            actualProductId,
            data.currency, // استخدام العملة من إعدادات النموذج من API
            data.product,
            formDirection
          );

          return { success: true, offers: data.quantity_offers };
        } else {
          console.log("❌ No quantity offers found for this product");
          return { success: false, message: "No offers found" };
        }

      } else {
        // Currency is already available, just load offers
        console.log('✅ QUANTITY OFFERS: Currency already available from form settings:', window.CodformFormData.currency);

        const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}`;
        console.log("🌐 API URL:", apiUrl);

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
        console.log("📊 API Response:", data);

        if (data.success && data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
          console.log("✅ Found quantity offers and product data");

          // ✅ SPEED BOOST: حفظ البيانات في cache
          const version = (window.CODFORM_APP_VERSION || '').toString();
        const cacheKey = `offers_${version}_${shop}_${productId}`;
          const cacheData = {
            data: { ...data, currency: window.CodformFormData.currency },
            timestamp: Date.now()
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
          console.log("🚀 SPEED BOOST: Data cached with form currency");

          const actualProductId = data.quantity_offers.product_id || productId;
          console.log("🎯 Using actual product ID:", actualProductId);

          // عرض العروض باستخدام العملة المحفوظة من النموذج
          displayQuantityOffers(
            data.quantity_offers,
            blockId,
            actualProductId,
            window.CodformFormData.currency, // استخدام العملة المحفوظة من النموذج
            data.product,
            formDirection
          );

          return { success: true, offers: data.quantity_offers };
        } else {
          console.log("❌ No quantity offers found for this product");
          return { success: false, message: "No offers found" };
        }
      }

    } catch (error) {
      console.error("❌ Error loading offers:", error);
      return { success: false, error: error.message };
    }
  }

  // دالة تشخيص
  function debugOffers(blockId, productId) {
    console.log("🔧 EXACT PREVIEW MATCH DEBUG - Starting diagnosis...");

    const container = document.getElementById(`quantity-offers-before-${blockId}`);
    const shop = window.Shopify?.shop || 'codmagnet.com';

    console.log("🔍 Debug Info:", {
      blockId,
      productId,
      shop,
      containerExists: !!container,
      windowShopify: window.Shopify
    });

    if (container) {
      console.log("📦 Container found, loading offers...");
      return loadAndDisplayOffers(blockId, productId, shop);
    } else {
      console.error("❌ Container not found!");
      return Promise.resolve({ success: false, error: "Container not found" });
    }
  }

  // Public API
  return {
    display: displayQuantityOffers,
    loadAndDisplayOffers: loadAndDisplayOffers,
    debug: debugOffers
  };
})();

// دالة عامة للتشخيص
window.debugQuantityOffers = function(blockId, productId) {
  console.log("🔧 Manual debug called - EXACT PREVIEW MATCH");
  return window.CodformQuantityOffers.debug(blockId, productId);
};
/**
 * CODFORM Cart Summary Handler
 * Manages dynamic price calculations and currency conversions
 */

(function() {
  'use strict';

  // ✅ COMPREHENSIVE: Exchange rates - USD as base (complete list for all supported countries)
  const EXCHANGE_RATES = {
    // العملات الأساسية
    'USD': 1.0,
    
    // عملات دول الخليج العربي
    'SAR': 3.75,
    'AED': 3.67,
    'QAR': 3.64,
    'KWD': 0.31,
    'BHD': 0.38,
    'OMR': 0.38,
    
    // عملات شمال أفريقيا والمغرب العربي
    'EGP': 30.85,
    'MAD': 10.0, // ✅ UNIFIED: 1 USD = 10 MAD (consistent with currency rates file)
    'TND': 3.15,
    'DZD': 134.25,
    
    // عملات بلاد الشام
    'JOD': 0.71,
    'LBP': 89500,
    'SYP': 13000,
    'ILS': 3.67,
    
    // العملات الأوروبية والغربية
    'EUR': 0.92,
    'GBP': 0.79,
    'CAD': 1.43,
    'AUD': 1.57,
    
    // عملات أمريكا اللاتينية
    'MXN': 20.15,
    'BRL': 6.05,
    'ARS': 1005.5,
    'CLP': 975.2,
    'COP': 4285.5,
    'PEN': 3.75,
    'VES': 36500000,
    'UYU': 40.25,
    
    // عملات الشرق الأوسط الإضافية
    'IQD': 1310,
    'IRR': 42100,
    'TRY': 34.15,
    'YER': 250,
    
    // عملات أفريقيا
    'NGN': 1675,
    'ZAR': 18.45,
    'KES': 130.5,
    'GHS': 15.85,
    'ETB': 125.5,
    'TZS': 2515,
    'UGX': 3785,
    'ZWL': 322,
    'ZMW': 27.85,
    'RWF': 1385
  };

  let cartSummaryData = {
    productPrice: null,
    productCurrency: null,
    targetCurrency: 'SAR',
    discountType: 'percentage',
    discountValue: 0,
    shippingCost: 0
  };

  /**
   * Convert currency amount using Currency Manager
   */
  function convertCurrency(amount, fromCurrency, toCurrency) {
    // استخدام Currency Manager إذا كان متاحاً
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.convertCurrency === 'function') {
      return window.CodformCurrencyManager.convertCurrency(amount, fromCurrency, toCurrency);
    }
    
    // استخدام CurrencyService إذا كان متاحاً
    if (window.CurrencyService && typeof window.CurrencyService.convertCurrency === 'function') {
      return window.CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
    }
    
    // التحويل الاحتياطي
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const fromRate = EXCHANGE_RATES[fromCurrency];
    const toRate = EXCHANGE_RATES[toCurrency];
    
    if (!fromRate || !toRate) {
      console.warn(`Currency rate missing: ${fromCurrency}=${fromRate}, ${toCurrency}=${toRate}`);
      return amount;
    }
    
    // Convert through USD as base
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    
    return convertedAmount;
  }

  /**
   * Format currency amount using Currency Manager
   */
  function formatCurrency(amount, currency, language = 'ar') {
    // استخدام Currency Manager إذا كان متاحاً
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.formatCurrency === 'function') {
      return window.CodformCurrencyManager.formatCurrency(amount, currency, language);
    }
    
    // استخدام CurrencyService إذا كان متاحاً للتنسيق المخصص
    if (window.CurrencyService && typeof window.CurrencyService.formatCurrency === 'function') {
      return window.CurrencyService.formatCurrency(amount, currency, language);
    }
    
    // التنسيق الاحتياطي
    try {
      const locale = language === 'ar' ? 'ar-SA' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Calculate all prices - simplified for same currency handling
   */
  function calculatePrices() {
    const state = window.CodformStateManager ? window.CodformStateManager.getState() : null;
    
    let effectivePrice;
    if (state && state.finalPrice !== null) {
      effectivePrice = state.finalPrice;
    } else {
      effectivePrice = cartSummaryData.productPrice;
    }
    
    const { productCurrency, targetCurrency, discountType, discountValue, shippingCost } = cartSummaryData;
    
    // Don't calculate if product data is not loaded yet
    if (effectivePrice === null || productCurrency === null) {
      return {
        subtotal: 0,
        discount: 0,
        shipping: 0,
        total: 0
      };
    }
    
    // ✅ CRITICAL FIX: Check if currencies match - no conversion needed
    let convertedPrice;
    if (productCurrency === targetCurrency) {
      convertedPrice = effectivePrice; // Same currency - use price directly
    } else {
      convertedPrice = convertCurrency(effectivePrice, productCurrency, targetCurrency);
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (discountValue > 0) {
      if (discountType === 'percentage') {
        discountAmount = (convertedPrice * discountValue) / 100;
      } else {
        discountAmount = convertCurrency(discountValue, productCurrency, targetCurrency);
      }
    }
    
    // ✅ FIXED: Shipping cost should NOT be converted - it's already in target currency
    const convertedShipping = shippingCost > 0 ? shippingCost : 0;
    
    // Calculate totals
    const subtotal = convertedPrice;
    const total = subtotal - discountAmount + convertedShipping;
    
    return {
      subtotal,
      discount: discountAmount,
      shipping: convertedShipping,
      total: Math.max(0, total)
    };
  }

  /**
   * Update cart summary text labels from field configuration
   */
  function updateCartSummaryLabels(field, config) {
    const cartSummaries = document.querySelectorAll('.cart-summary-field');
    
    cartSummaries.forEach((summary) => {
      // Update direction
      const direction = config.direction || 'auto';
      if (direction === 'auto') {
        const isArabic = config.subtotalText && /[\u0600-\u06FF]/.test(config.subtotalText);
        summary.style.direction = isArabic ? 'rtl' : 'ltr';
      } else {
        summary.style.direction = direction;
      }
      
      // Update text labels
      const subtotalLabel = summary.querySelector('.summary-label');
      const discountLabel = summary.querySelector('.discount-row .summary-label');
      const shippingLabel = summary.querySelector('.shipping-value').parentElement.querySelector('.summary-label');
      const totalLabel = summary.querySelector('.total-row .summary-label');
      
      if (subtotalLabel && config.subtotalText) {
        subtotalLabel.textContent = config.subtotalText;
      }
      if (discountLabel && config.discountText) {
        discountLabel.textContent = config.discountText;
      }
      if (shippingLabel && config.shippingText) {
        shippingLabel.textContent = config.shippingText;
      }
      if (totalLabel && config.totalText) {
        totalLabel.textContent = config.totalText;
      }
    });
  }

  /**
   * Update cart summary styles from field configuration
   */
  function updateCartSummaryStyles(field, config) {
    const cartSummaries = document.querySelectorAll('.cart-summary-field');
    
    cartSummaries.forEach((summary) => {
      const style = field.style || {};
      
      // Apply container styles
      if (style.backgroundColor) {
        summary.style.backgroundColor = style.backgroundColor;
      }
      if (style.borderColor) {
        summary.style.borderColor = style.borderColor;
      }
      if (style.borderRadius) {
        summary.style.borderRadius = style.borderRadius;
      }
      
      // Apply font family - default to Cairo
      const fontFamily = style.fontFamily || 'Cairo';
      summary.style.fontFamily = fontFamily;
      
      // Update all labels
      const labels = summary.querySelectorAll('.summary-label');
      labels.forEach((label) => {
        if (style.labelColor) label.style.color = style.labelColor;
        if (style.labelFontSize) label.style.fontSize = style.labelFontSize;
        label.style.fontFamily = fontFamily;
      });
      
      // Update all values
      const values = summary.querySelectorAll('.summary-value:not(.total-value)');
      values.forEach((value) => {
        if (style.valueColor) value.style.color = style.valueColor;
        if (style.valueFontSize) value.style.fontSize = style.valueFontSize;
        value.style.fontFamily = fontFamily;
      });
      
      // Update total label
      const totalLabel = summary.querySelector('.total-row .summary-label');
      if (totalLabel) {
        if (style.totalLabelColor) totalLabel.style.color = style.totalLabelColor;
        if (style.totalLabelFontSize) totalLabel.style.fontSize = style.totalLabelFontSize;
        totalLabel.style.fontFamily = fontFamily;
      }
      
      // Update total value - default to green
      const totalValue = summary.querySelector('.total-value');
      if (totalValue) {
        totalValue.style.color = style.totalValueColor || '#059669';
        if (style.totalValueFontSize) totalValue.style.fontSize = style.totalValueFontSize;
        totalValue.style.fontFamily = fontFamily;
      }
    });
  }

  /**
   * Update cart summary display - reduced logging
   */
  function updateCartSummary() {
    const cartSummaries = document.querySelectorAll('.cart-summary-field');
    
    if (cartSummaries.length === 0) {
      return;
    }
    
    const prices = calculatePrices();
    const currency = cartSummaryData.targetCurrency;
    
    if (!currency) {
      console.error('❌ Cart Summary - No target currency found');
      return;
    }
    
    cartSummaries.forEach((summary) => {
      const language = summary.style.direction === 'rtl' ? 'ar' : 'en';
      
      // Update subtotal
      const subtotalElement = summary.querySelector('.subtotal-value');
      if (subtotalElement) {
        subtotalElement.textContent = formatCurrency(prices.subtotal, currency, language);
        subtotalElement.dataset.amount = prices.subtotal;
      }
      
      // Update discount
      const discountElement = summary.querySelector('.discount-value');
      const discountRow = summary.querySelector('.discount-row');
      if (discountElement && discountRow) {
        if (prices.discount > 0) {
          discountElement.textContent = '-' + formatCurrency(prices.discount, currency, language);
          discountElement.dataset.amount = prices.discount;
          discountRow.style.display = 'flex';
        } else {
          discountRow.style.display = 'none';
        }
      }
      
      // Update shipping
      const shippingElement = summary.querySelector('.shipping-value');
      if (shippingElement) {
        let formattedShipping;
        if (prices.shipping === 0) {
          formattedShipping = language === 'ar' ? 'مجاني' : 'Free';
        } else {
          formattedShipping = formatCurrency(prices.shipping, currency, language);
        }
        shippingElement.textContent = formattedShipping;
        shippingElement.dataset.amount = prices.shipping;
      }
      
      // Update total
      const totalElement = summary.querySelector('.total-value');
      if (totalElement) {
        totalElement.textContent = formatCurrency(prices.total, currency, language);
        totalElement.dataset.amount = prices.total;
      }
    });
  }

  /**
   * Load product data using quantity offers API (the working method)
   */
  async function loadProductData(productId, shopDomain) {
    try {
      console.log('🎯 Cart Summary - Using quantity offers API method:', { productId, shopDomain });
      
      // Use the same API that works for quantity offers
      const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shopDomain)}&product=${encodeURIComponent(productId)}`;
      
      console.log('🌐 Cart Summary - API URL (same as quantity offers):', apiUrl);
      
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
      console.log('📊 Cart Summary - API Response (quantity offers format):', data);
      
      // ✅ FIXED: Properly save currency from API response
      if (data.success && data.currency) {
        window.CodformFormData = window.CodformFormData || {};
        window.CodformFormData.currency = data.currency;
        console.log('💰✅ Cart Summary - REAL FORM CURRENCY SAVED FROM API:', data.currency);
        console.log('💰✅ Cart Summary - window.CodformFormData.currency set to:', window.CodformFormData.currency);
        
        // Also save in current form data for backup
        if (window.currentFormData) {
          window.currentFormData.savedFormCurrency = data.currency;
        }
        
        cartSummaryData.targetCurrency = data.currency;
        console.log('💰✅ Cart Summary - Target currency updated to:', data.currency);
      } else {
        console.error('❌🔥 Cart Summary - API Response missing currency field!', data);
        // Don't proceed if no currency - this prevents incorrect calculations
        return null;
      }
      
      if (data.success && data.product) {
        // ✅ CRITICAL: Use the same product data structure as quantity offers
        const price = parseFloat(data.product.price) || 0;
        
        // ✅ CRITICAL FIX: Use form currency directly when currencies match
        const productCurrency = data.product.currency || 'SAR';
        const formCurrency = data.currency;
        
        // If currencies match, treat product as having form currency (no conversion)
        const finalCurrency = (productCurrency === formCurrency) ? formCurrency : productCurrency;
        
        // Update cart summary data with real product data
        cartSummaryData.productPrice = price;
        cartSummaryData.productCurrency = finalCurrency;
        
        // تحديث State Manager مع بيانات المنتج الحقيقية
        if (window.CodformStateManager) {
          window.CodformStateManager.setProductData(price, finalCurrency, formCurrency);
        }
        
        // Update display
        updateCartSummary();
        
        return data.product;
      } else {
        console.error('❌ Cart Summary - No product data in API response');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Cart Summary - Error loading product data:', error);
      return null;
    }
  }

  // Get real form currency
  function getRealFormCurrency() {
    // Primary: Check for currency from API response
    if (window.CodformFormData?.currency) {
      return window.CodformFormData.currency;
    }
    
    // Secondary: Check if currency was saved in form data
    if (window.currentFormData?.savedFormCurrency) {
      console.log('✅ Cart Summary - Currency from saved form data (secondary):', window.currentFormData.savedFormCurrency);
      return window.currentFormData.savedFormCurrency;
    }
    
    // ✅ TERTIARY: Check form style currency (backup location)
    if (window.currentFormData?.form?.style?.currency) {
      console.log('✅ Cart Summary - Currency from form style (tertiary):', window.currentFormData.form.style.currency);
      return window.currentFormData.form.style.currency;
    }
    
    // ✅ QUATERNARY: Check window.formCurrency if set by API
    if (window.formCurrency) {
      console.log('✅ Cart Summary - Currency from window.formCurrency:', window.formCurrency);
      return window.formCurrency;
    }
    
    console.error('❌ Cart Summary - CRITICAL: No real currency found from API! Must wait for API call.');
    console.error('❌ Cart Summary - Available data sources checked:');
    console.error('  - window.CodformFormData.currency:', window.CodformFormData?.currency);
    console.error('  - window.currentFormData.savedFormCurrency:', window.currentFormData?.savedFormCurrency);
    console.error('  - window.currentFormData.form.style.currency:', window.currentFormData?.form?.style?.currency);
    console.error('  - window.formCurrency:', window.formCurrency);
    return null; // NO DEFAULT CURRENCY - API must be called first
  }

  /**
   * Initialize cart summary from field configuration
   */
  function initializeCartSummary(field, formStyle) {
    console.log('🚀 Cart Summary - Starting initialization');
    console.log('📊 Cart Summary - window.CodformFormData at init:', window.CodformFormData);
    console.log('📊 Cart Summary - field data:', field);
    
    const config = field.cartSummaryConfig || field.config || {};
    console.log('⚙️ Cart Summary - Configuration loaded:', config);

    // Update cart summary text configuration from field settings
    updateCartSummaryLabels(field, config);

    // البحث عن العناصر مع تأخير للتأكد من تحميل DOM
    setTimeout(() => {
      const cartSummaries = document.querySelectorAll('.codform-cart-summary, .cart-summary-field, [class*="cart"], [class*="summary"], [class*="total"]');
      console.log(`🔍 Processing cartSummary elements - Found ${cartSummaries.length} elements`);
      
      if (cartSummaries.length === 0) {
        console.warn('⚠️ No cart summary elements found, searching for price elements');
        const priceElements = document.querySelectorAll('[class*="price"], [data-product-price], .product-price, .total-price, .subtotal, .shipping-price');
        console.log(`Found ${priceElements.length} price elements as fallback`);
        
        if (priceElements.length > 0) {
          priceElements.forEach((element, index) => {
            applyCartSummarySettings(element, field, config);
          });
        }
        return;
      }

      cartSummaries.forEach((element, index) => {
        applyCartSummarySettings(element, field, config);
      });
    }, 1000);

    function applyCartSummarySettings(element, field, config) {
      console.log('🛒 Applying Cart Summary settings to element:', element);

      // Apply styles
      if (element) {
        const style = field.style || {};
        
        // Background and border
        if (style.backgroundColor) {
          element.style.backgroundColor = style.backgroundColor;
        }
        if (style.borderColor) {
          element.style.borderColor = style.borderColor;
        }

        // Text direction
        if (config.direction) {
          if (config.direction === 'auto') {
            element.style.direction = window.CODFORM?.language === 'ar' ? 'rtl' : 'ltr';
          } else {
            element.style.direction = config.direction;
          }
        }

        // Font family - تطبيق خط Cairo كما هو مطلوب
        const fontFamily = style.fontFamily || 'Cairo';
        element.style.fontFamily = fontFamily + ', sans-serif';

        // Update text labels
        updateTextLabels(element, config);
        
        // Update colors and fonts
        updateElementStyles(element, style, fontFamily);

        console.log(`✅ Cart Summary element updated successfully`);
      }
    }

    function updateTextLabels(element, config) {
      // تحديث النصوص حسب الإعدادات
      const subtotalElements = element.querySelectorAll('[class*="subtotal"], .subtotal-value');
      const discountElements = element.querySelectorAll('[class*="discount"], .discount-value');
      const shippingElements = element.querySelectorAll('[class*="shipping"], .shipping-value');
      const totalElements = element.querySelectorAll('[class*="total"], .total-value');

      // تطبيق النصوص المخصصة
      subtotalElements.forEach(el => {
        if (config.subtotalText && el.previousElementSibling) {
          el.previousElementSibling.textContent = config.subtotalText;
        }
      });

      discountElements.forEach(el => {
        if (config.discountText && el.previousElementSibling) {
          el.previousElementSibling.textContent = config.discountText;
        }
      });

      shippingElements.forEach(el => {
        if (config.shippingText && el.previousElementSibling) {
          el.previousElementSibling.textContent = config.shippingText;
        }
      });

      totalElements.forEach(el => {
        if (config.totalText && el.previousElementSibling) {
          el.previousElementSibling.textContent = config.totalText;
        }
      });
    }

    function updateElementStyles(element, style, fontFamily) {
      // Update label colors and fonts
      const labelElements = element.querySelectorAll('span:first-child, .label, [class*="label"]');
      labelElements.forEach(label => {
        if (style.labelColor) {
          label.style.color = style.labelColor;
        }
        if (style.labelFontSize) {
          label.style.fontSize = style.labelFontSize;
        }
        label.style.fontFamily = fontFamily + ', sans-serif';
      });

      // Update value colors and fonts
      const valueElements = element.querySelectorAll('span:last-child, .value, [class*="value"], .product-price, .shipping-price');
      valueElements.forEach(value => {
        if (style.valueColor) {
          value.style.color = style.valueColor;
        } else {
          value.style.color = '#1f2937'; // لون افتراضي للقيم
        }
        if (style.valueFontSize) {
          value.style.fontSize = style.valueFontSize;
        }
        value.style.fontFamily = fontFamily + ', sans-serif';
      });

      // Update total elements with special styling - أهم جزء للإجمالي
      const totalElements = element.querySelectorAll('.total-price, [class*="total"], [data-product-price-display="total"]');
      totalElements.forEach(total => {
        if (style.totalValueColor) {
          total.style.color = style.totalValueColor;
        } else {
          total.style.color = '#059669'; // ✅ لون أخضر افتراضي للإجمالي
        }
        if (style.totalValueFontSize) {
          total.style.fontSize = style.totalValueFontSize;
        } else {
          total.style.fontSize = '1.1rem'; // حجم أكبر للإجمالي
        }
        total.style.fontFamily = fontFamily + ', sans-serif';
        total.style.fontWeight = 'bold';
      });

      // البحث عن جميع عناصر الأسعار وتطبيق الخط عليها
      const allPriceElements = element.querySelectorAll('[class*="price"], [data-price], .amount, [class*="amount"]');
      allPriceElements.forEach(priceEl => {
        priceEl.style.fontFamily = fontFamily + ', sans-serif';
      });
    }

    if (cartSummaries.length === 0) {
      console.warn('⚠️ Cart Summary - No cart summary elements found in DOM. Waiting for DOM...');
      // انتظار قليل للسماح للـ DOM بالتحميل الكامل
      setTimeout(() => {
        const delayedCartSummaries = document.querySelectorAll('.codform-cart-summary, .cart-summary-field');
        console.log(`🔍 After delay - Found ${delayedCartSummaries.length} cartSummary elements`);
        if (delayedCartSummaries.length > 0) {
          proceedWithInitialization();
        }
      }, 500);
      return;
    }

    proceedWithInitialization();

    function proceedWithInitialization() {
      // الحصول على العملة الحقيقية فقط - بدون أي عملات افتراضية
      const formCurrency = getRealFormCurrency();
      if (!formCurrency) {
        console.error('🚨 Cart Summary - CRITICAL ERROR: No currency available!');
        console.error('🚨 Cart Summary - Cannot proceed without real currency from form settings.');
        
        // عرض رسالة خطأ للمستخدم
        const cartSummaries = document.querySelectorAll('.codform-cart-summary, .cart-summary-field');
        cartSummaries.forEach(summary => {
          summary.innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px;">ERROR: No currency found. API call required.</div>';
        });
        return;
      }
    
    console.log('✅ Cart Summary - Real form currency confirmed:', formCurrency);
    
    // تحديث إعدادات Cart Summary
    cartSummaryData.discountType = config.discountType || 'percentage';
    cartSummaryData.discountValue = parseFloat(config.discountValue) || 0;
    
    // ✅ FIXED: Read shipping settings correctly from config
    let shippingValue = 0;
    if (config.shippingType === 'manual' && config.shippingValue) {
      shippingValue = parseFloat(config.shippingValue) || 0;
    } else if (config.shippingCost) {
      shippingValue = parseFloat(config.shippingCost) || 0;
    }
    cartSummaryData.shippingCost = shippingValue;
    cartSummaryData.targetCurrency = formCurrency; // استخدام العملة الحقيقية فقط
    
    console.log('💾 Cart Summary - Data updated with real currency:', {
      discountType: cartSummaryData.discountType,
      discountValue: cartSummaryData.discountValue,
      shippingCost: cartSummaryData.shippingCost,
      targetCurrency: cartSummaryData.targetCurrency
    });
    
    // Apply styling to cart summary elements
    updateCartSummaryStyles(field, config);
    
    // استخدام البيانات المحلية إذا كانت متوفرة
    let actualProductData = window.CodformProductData;
    if (actualProductData) {
      console.log("🛍️ Cart Summary - Using existing global product data:", actualProductData);
      
      // ✅ CRITICAL: Get PRODUCT price and currency from Shopify
      let productPrice = parseFloat(config.productPrice) || 0;
      let productCurrency = null; // This should be the ACTUAL product currency from Shopify
      
      if (actualProductData.price) {
        productPrice = parseFloat(actualProductData.price);
        productCurrency = actualProductData.currency || 'MAD'; // Default to MAD if not found
        console.log("💰 Cart Summary - Price from product data:", productPrice, productCurrency);
      } else if (actualProductData.variants && actualProductData.variants.length > 0) {
        // إذا كان المنتج له variants، استخدم سعر أول variant
        productPrice = parseFloat(actualProductData.variants[0].price) || 0;
        productCurrency = actualProductData.variants[0].currency_code || actualProductData.currency || 'MAD';
        console.log("💰 Cart Summary - Price from first variant:", productPrice, productCurrency);
      }
      
      // ✅ CRITICAL: Check if product currency and form currency are the same
      if (productCurrency === formCurrency) {
        console.log("✅ Cart Summary - SAME CURRENCY DETECTED! No conversion needed:", {
          productCurrency,
          formCurrency
        });
        // Set final currency to form currency since they match
        productCurrency = formCurrency;
      }
      
      // Update cart summary data with actual product data
      cartSummaryData.productPrice = productPrice;
      cartSummaryData.productCurrency = productCurrency;
      
      // Update State Manager with real product data
      window.CodformStateManager?.updateCartState?.({
        productPrice,
        productCurrency,
        targetCurrency: formCurrency,
        shippingCost: cartSummaryData.shippingCost,
        discountType: cartSummaryData.discountType,
        discountValue: cartSummaryData.discountValue
      });
      
      console.log('💾 Cart Summary - Product data applied:', {
        price: cartSummaryData.productPrice,
        currency: cartSummaryData.productCurrency
      });
      
      // تحديث العرض فوراً
      updateCartSummary();
    } else {
      console.log("⏳ Cart Summary - Product data not found. Attempting to load...");
      
      // محاولة الحصول على بيانات المنتج من المتغيرات العامة
      let productId = window.productId || window.codformProductId;
      let shopDomain = window.shopDomain || window.codformShopDomain;
      
      console.log('🔍 Cart Summary - Global variables check:', { shopDomain, productId });
        
      // جرب الحصول على البيانات من DOM
      if (!productId || !shopDomain) {
        console.log('⚠️ Cart Summary - Missing global variables, trying DOM...');
        
        const productMeta = document.querySelector('meta[name="product-id"]');
        const shopMeta = document.querySelector('meta[name="shop-domain"]');
        
        productId = productId || productMeta?.getAttribute('content');
        shopDomain = shopDomain || shopMeta?.getAttribute('content') || window.location.hostname;
        
        console.log('🔍 Cart Summary - After DOM check:', { shopDomain, productId });
      }
      
      if (productId && shopDomain) {
        console.log('📲 Cart Summary - Calling loadProductData...');
        loadProductData(productId, shopDomain);
      } else {
        console.warn('❌ Cart Summary - Cannot load product data: missing required data');
        // عرض أسعار تجريبية بدلاً من عدم عرض شيء
        cartSummaryData.productPrice = 99.00;
        cartSummaryData.productCurrency = formCurrency;
        updateCartSummary();
      }
    }
    }
    
    console.log('✅ Cart Summary - Initialization complete');
  }

  // Add to global namespace
  window.CodformCartSummary = {
    initialize: initializeCartSummary,
    update: updateCartSummary,
    setProductData: function(price, currency) {
      cartSummaryData.productPrice = price;
      cartSummaryData.productCurrency = currency;
      updateCartSummary();
    },
    setShippingCost: function(cost) {
      cartSummaryData.shippingCost = cost;
      updateCartSummary();
    },
    setDiscount: function(type, value) {
      cartSummaryData.discountType = type;
      cartSummaryData.discountValue = value;
      updateCartSummary();
    }
  };

  console.log('✅ CODFORM Cart Summary Handler loaded');

})();
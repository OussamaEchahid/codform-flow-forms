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

    // الحصول على العملة الحقيقية فقط - بدون أي عملات افتراضية
    const formCurrency = getRealFormCurrency();
    if (!formCurrency) {
      console.error('🚨 Cart Summary - CRITICAL ERROR: No currency available!');
      console.error('🚨 Cart Summary - Cannot proceed without real currency from form settings.');
      
      // عرض رسالة خطأ للمستخدم
      const cartSummaries = document.querySelectorAll('.cart-summary-field');
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
    
    // محاولة جلب بيانات المنتج إذا كان التحديث التلقائي مفعل
    if (config.autoCalculate) {
      console.log('🔄 Cart Summary - Auto calculate enabled');
      
      let productId = window.CodformProductId || window.productId;
      let shopDomain = window.CodformShopDomain || window.shopDomain;
      
      console.log('🏪 Cart Summary - Initial detection:', { shopDomain, productId });
      
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
      }
    }
    
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
        const firstVariant = actualProductData.variants[0];
        if (firstVariant.price) {
          productPrice = parseFloat(firstVariant.price);
          productCurrency = firstVariant.currency || actualProductData.currency || 'MAD';
          console.log("💰 Cart Summary - Price from variant:", productPrice, productCurrency);
        }
      } else {
        // Try to get price from DOM if product data not available
        try {
          const priceElement = document.querySelector('.price, [class*="price"], [data-price]');
          if (priceElement) {
            const priceText = priceElement.textContent || priceElement.getAttribute('data-price');
            const priceMatch = priceText.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              productPrice = parseFloat(priceMatch[0].replace(',', ''));
              productCurrency = 'MAD'; // Default for this store
              console.log("💰 Cart Summary - Price from DOM:", productPrice, productCurrency);
            }
          }
        } catch (e) {
          console.log("⚠️ Cart Summary - Could not extract price from DOM");
        }
      }
      
      if (productPrice && productCurrency) {
        cartSummaryData.productPrice = productPrice;
        cartSummaryData.productCurrency = productCurrency;
        
        // تحديث State Manager أيضاً
        if (window.CodformStateManager) {
          window.CodformStateManager.setProductData(productPrice, productCurrency, formCurrency);
          console.log("✅ Cart Summary - State Manager updated with local product data");
        }
        
        console.log("✅ Cart Summary - Product data loaded:", cartSummaryData);
      } else {
        console.error('❌ Cart Summary - CRITICAL: No product price or currency found!');
      }
    }
    
    // تحديث العرض
    updateCartSummary();
    
    // تهيئة Event Listeners إذا لم تكن مفعلة
    if (!window.cartSummaryEventsSetup) {
      setupEventListeners();
      window.cartSummaryEventsSetup = true;
    }
  }

  /**
   * Update cart summary when quantity changes
   */
  function updateCartSummaryQuantity(quantity) {
    const state = window.CodformStateManager ? window.CodformStateManager.getState() : null;
    
    if (state && state.unitPrice !== null && state.targetCurrency) {
      // ✅ استخدام البيانات من State Manager مع التحقق الصحيح
      cartSummaryData.productPrice = state.unitPrice * quantity;
      cartSummaryData.currency = state.targetCurrency;
      console.log(`💰✅ Cart Summary using State Manager data:`, {
        unitPrice: state.unitPrice,
        quantity: quantity,
        totalPrice: cartSummaryData.productPrice,
        currency: cartSummaryData.currency
      });
    } else {
      // الطريقة القديمة كاحتياطي
      const originalPrice = cartSummaryData.productPrice / (cartSummaryData.currentQuantity || 1);
      cartSummaryData.productPrice = originalPrice * quantity;
      console.log(`💰⚠️ Cart Summary using fallback calculation:`, {
        originalPrice: originalPrice,
        quantity: quantity,
        totalPrice: cartSummaryData.productPrice
      });
    }
    
    cartSummaryData.currentQuantity = quantity;
    updateCartSummary();
  }

  // Setup event listeners for state management integration
  function setupEventListeners() {
    // الاستماع لأحداث تغيير الكمية
    window.addEventListener('codform:quantity-changed', function(event) {
      console.log('🔄 Cart Summary received quantity change event:', event.detail);
      updateCartSummaryQuantity(event.detail.quantity);
    });

    // الاستماع لأحداث اختيار العروض
    window.addEventListener('codform:offer-selected', function(event) {
      console.log('🎯 Cart Summary received offer selection event:', event.detail);
      const offer = event.detail.offer;
      updateCartSummaryQuantity(offer.quantity || 1);
    });

    // الاستماع لتحديثات State Manager
    if (window.CodformStateManager) {
      window.CodformStateManager.subscribe(function(newState, previousState) {
        console.log('🔄 Cart Summary: State changed', { newState, previousState });
        
        // تحديث cart summary عند تغيير الحالة
        if (newState.finalPrice !== previousState.finalPrice || 
            newState.currentQuantity !== previousState.currentQuantity) {
          cartSummaryData.productPrice = newState.finalPrice;
          cartSummaryData.currentQuantity = newState.currentQuantity;
          updateCartSummary();
        }
      });
    }
  }

  // Make functions globally available
  window.codformCartSummary = {
    initialize: initializeCartSummary,
    updateQuantity: updateCartSummaryQuantity,
    updatePrices: updateCartSummary,
    loadProductData: loadProductData,  // Export loadProductData function
    setProductData: function(price, currency) {
      cartSummaryData.productPrice = price;
      cartSummaryData.productCurrency = currency;
      
      // تحديث State Manager أيضاً
      if (window.CodformStateManager) {
        window.CodformStateManager.setProductData(price, currency, cartSummaryData.targetCurrency);
      }
      
      updateCartSummary();
    },
    setupEventListeners: setupEventListeners
  };

  // تفعيل Event Listeners عند تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
  } else {
    setupEventListeners();
  }

  // Cart Summary module loaded
})();
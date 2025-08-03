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
    'MAD': 9.85, // ✅ CRITICAL: 1 USD = 9.85 MAD, so 10 MAD = ~1.02 USD
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
   * Convert currency amount
   */
  function convertCurrency(amount, fromCurrency, toCurrency) {
    console.log(`💱 [CONVERSION DEBUG] Converting ${amount} from ${fromCurrency} to ${toCurrency}`);
    
    if (fromCurrency === toCurrency) {
      console.log(`💱 [CONVERSION DEBUG] Same currency, no conversion needed: ${amount}`);
      return amount;
    }
    
    const fromRate = EXCHANGE_RATES[fromCurrency];
    const toRate = EXCHANGE_RATES[toCurrency];
    
    console.log(`💱 [CONVERSION DEBUG] Exchange rates - ${fromCurrency}: ${fromRate}, ${toCurrency}: ${toRate}`);
    
    if (!fromRate) {
      console.error(`❌ [CONVERSION ERROR] Exchange rate not found for ${fromCurrency}`);
      return amount; // Return original amount if exchange rate not found
    }
    
    if (!toRate) {
      console.error(`❌ [CONVERSION ERROR] Exchange rate not found for ${toCurrency}`);
      return amount; // Return original amount if exchange rate not found
    }
    
    // ✅ FIXED: Convert through USD as base (same logic as quantity offers)
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    
    console.log(`💱 [CONVERSION DEBUG] ${amount} ${fromCurrency} → ${usdAmount.toFixed(4)} USD → ${convertedAmount.toFixed(2)} ${toCurrency}`);
    
    return convertedAmount;
  }

  /**
   * Format currency amount
   */
  function formatCurrency(amount, currency, language = 'ar') {
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
   * Calculate all prices
   */
  function calculatePrices() {
    const { productPrice, productCurrency, targetCurrency, discountType, discountValue, shippingCost } = cartSummaryData;
    
    console.log(`🧮 [CALC DEBUG] Starting price calculation:`, {
      productPrice,
      productCurrency,
      targetCurrency,
      discountType,
      discountValue,
      shippingCost
    });
    
    // Don't calculate if product data is not loaded yet
    if (productPrice === null || productCurrency === null) {
      console.log(`⚠️ [CALC DEBUG] Product data not loaded yet, returning zeros`);
      return {
        subtotal: 0,
        discount: 0,
        shipping: 0,
        total: 0
      };
    }
    
    // Convert product price to target currency
    console.log(`🔄 [CALC DEBUG] Converting product price from ${productCurrency} to ${targetCurrency}`);
    const convertedPrice = convertCurrency(productPrice, productCurrency, targetCurrency);
    console.log(`✅ [CALC DEBUG] Product price converted: ${productPrice} ${productCurrency} → ${convertedPrice} ${targetCurrency}`);
    
    // Calculate discount
    let discountAmount = 0;
    if (discountValue > 0) {
      if (discountType === 'percentage') {
        discountAmount = (convertedPrice * discountValue) / 100;
      } else {
        discountAmount = convertCurrency(discountValue, productCurrency, targetCurrency);
      }
    }
    
    // Convert shipping cost
    const convertedShipping = convertCurrency(shippingCost, productCurrency, targetCurrency);
    
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
   * Update cart summary display
   */
  function updateCartSummary() {
    console.log('🔄 [DEBUG] updateCartSummary called');
    console.log('💰 [DEBUG] Current cartSummaryData:', JSON.stringify(cartSummaryData, null, 2));
    
    const cartSummaries = document.querySelectorAll('.cart-summary-field');
    console.log(`🔍 [DEBUG] Found ${cartSummaries.length} elements with .cart-summary-field`);
    
    if (cartSummaries.length === 0) {
      console.log('❌ [DEBUG] No cart summary fields found with class .cart-summary-field');
      // Try alternative selectors
      const altFields = document.querySelectorAll('[data-field-type*="total"], [data-field-type*="subtotal"], [data-field-type*="shipping"], [data-field-type*="discount"]');
      console.log(`🔍 [DEBUG] Alternative search found ${altFields.length} elements with data-field-type containing price terms`);
      
      // Debug: show all elements that might be cart summary related
      const allElements = document.querySelectorAll('*');
      console.log(`📊 [DEBUG] Total elements on page: ${allElements.length}`);
      
      // Look for any element with "cart" or "summary" in class/id
      const possibleElements = Array.from(allElements).filter(el => {
        const className = el.className || '';
        const id = el.id || '';
        return className.includes('cart') || className.includes('summary') || 
               id.includes('cart') || id.includes('summary');
      });
      console.log(`🎯 [DEBUG] Elements with 'cart' or 'summary' in class/id:`, possibleElements.length);
      possibleElements.forEach((el, i) => {
        if (i < 10) { // Limit to first 10 to avoid spam
          console.log(`   ${i}: ${el.tagName}.${el.className}#${el.id}`);
        }
      });
      
      return;
    }
    
    const prices = calculatePrices();
    console.log('💵 [DEBUG] Calculated prices:', JSON.stringify(prices, null, 2));
    
    cartSummaries.forEach((summary, index) => {
      console.log(`\n🏷️ [DEBUG] Processing cart summary ${index}:`);
      console.log('Element HTML:', summary.outerHTML.substring(0, 200) + '...');
      
      // ✅ FIXED: Use target currency (form currency) for display - this is where conversion has been applied
      const currency = cartSummaryData.targetCurrency;
      if (!currency) {
        console.error('❌🔥 Cart Summary - NO TARGET CURRENCY! Cannot display prices.');
        console.error('❌🔥 Cart Summary - cartSummaryData:', cartSummaryData);
        summary.innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red;">ERROR: No currency found from API</div>';
        return;
      }
      console.log(`💱✅ Cart Summary - Using target currency (form currency): ${currency}`);
      
      const language = summary.style.direction === 'rtl' ? 'ar' : 'en';
      console.log(`🌐 [DEBUG] Using language: ${language}`);
      
      // Update subtotal
      const subtotalElement = summary.querySelector('.subtotal-value');
      console.log(`🔍 [DEBUG] Subtotal element:`, subtotalElement);
      if (subtotalElement) {
        const formattedSubtotal = formatCurrency(prices.subtotal, currency, language);
        console.log(`💰 [DEBUG] Updating subtotal: ${subtotalElement.textContent} → ${formattedSubtotal}`);
        subtotalElement.textContent = formattedSubtotal;
        subtotalElement.dataset.amount = prices.subtotal;
        console.log(`✅ [DEBUG] Subtotal updated successfully`);
      } else {
        console.log(`❌ [DEBUG] Subtotal element not found with .subtotal-value`);
      }
      
      // Update discount
      const discountElement = summary.querySelector('.discount-value');
      const discountRow = summary.querySelector('.discount-row');
      console.log(`🔍 [DEBUG] Discount element:`, discountElement);
      console.log(`🔍 [DEBUG] Discount row:`, discountRow);
      if (discountElement && discountRow) {
        if (prices.discount > 0) {
          const formattedDiscount = '-' + formatCurrency(prices.discount, currency, language);
          console.log(`💰 [DEBUG] Updating discount: ${discountElement.textContent} → ${formattedDiscount}`);
          discountElement.textContent = formattedDiscount;
          discountElement.dataset.amount = prices.discount;
          discountRow.style.display = 'flex';
          console.log(`✅ [DEBUG] Discount updated and shown`);
        } else {
          discountRow.style.display = 'none';
          console.log(`ℹ️ [DEBUG] No discount, hiding row`);
        }
      } else {
        console.log(`❌ [DEBUG] Discount elements not found`);
      }
      
      // Update shipping
      const shippingElement = summary.querySelector('.shipping-value');
      console.log(`🔍 [DEBUG] Shipping element:`, shippingElement);
      if (shippingElement) {
        let formattedShipping;
        if (prices.shipping === 0) {
          formattedShipping = language === 'ar' ? 'مجاني' : 'Free';
        } else {
          formattedShipping = formatCurrency(prices.shipping, currency, language);
        }
        console.log(`💰 [DEBUG] Updating shipping: ${shippingElement.textContent} → ${formattedShipping}`);
        shippingElement.textContent = formattedShipping;
        shippingElement.dataset.amount = prices.shipping;
        console.log(`✅ [DEBUG] Shipping updated successfully`);
      } else {
        console.log(`❌ [DEBUG] Shipping element not found with .shipping-value`);
      }
      
      // Update total
      const totalElement = summary.querySelector('.total-value');
      console.log(`🔍 [DEBUG] Total element:`, totalElement);
      if (totalElement) {
        const formattedTotal = formatCurrency(prices.total, currency, language);
        console.log(`💰 [DEBUG] Updating total: ${totalElement.textContent} → ${formattedTotal}`);
        totalElement.textContent = formattedTotal;
        totalElement.dataset.amount = prices.total;
        console.log(`✅ [DEBUG] Total updated successfully`);
      } else {
        console.log(`❌ [DEBUG] Total element not found with .total-value`);
      }
    });
    
    console.log('🎯 [DEBUG] updateCartSummary completed');
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
        const currency = data.product.currency || 'SAR';
        
        console.log('💰✅ Cart Summary - REAL PRODUCT DATA FROM API:', {
          price: price,
          currency: currency,
          shopCurrency: currency,
          formCurrency: data.currency,
          conversionRequired: currency !== data.currency,
          source: 'forms-product API (same as quantity offers)'
        });
        
        // Update cart summary data with real product data
        cartSummaryData.productPrice = price;
        cartSummaryData.productCurrency = currency;
        
        console.log('✅ Cart Summary - Updated with REAL product data:', {
          productPrice: cartSummaryData.productPrice,
          productCurrency: cartSummaryData.productCurrency,
          targetCurrency: cartSummaryData.targetCurrency,
          willConvertFrom: `${cartSummaryData.productCurrency} TO ${cartSummaryData.targetCurrency}`
        });
        
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

  // ✅ ENHANCED: Get real form currency using SAME method as quantity offers
  function getRealFormCurrency() {
    console.log('🔍 Cart Summary - Searching for real form currency (same method as quantity offers)...');
    console.log('🔍 Cart Summary - window.CodformFormData:', window.CodformFormData);
    
    // ✅ PRIMARY: Check for currency from API response (same as quantity offers)
    if (window.CodformFormData?.currency) {
      console.log('✅ Cart Summary - REAL Currency from API (primary):', window.CodformFormData.currency);
      return window.CodformFormData.currency;
    }
    
    // ✅ SECONDARY: Check if currency was saved in form data (backup location)
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
    cartSummaryData.shippingCost = parseFloat(config.shippingCost) || 0;
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
        console.log("✅ Cart Summary - Product data loaded:", cartSummaryData);
      } else {
        console.error('❌ Cart Summary - CRITICAL: No product price or currency found!');
      }
    }
    
    // تحديث العرض
    updateCartSummary();
  }

  /**
   * Update cart summary when quantity changes
   */
  function updateCartSummaryQuantity(quantity) {
    const originalPrice = cartSummaryData.productPrice;
    cartSummaryData.productPrice = originalPrice * quantity;
    updateCartSummary();
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
      updateCartSummary();
    }
  };

  // Cart Summary module loaded
})();
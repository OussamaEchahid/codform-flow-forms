/**
 * CODFORM Cart Summary Handler
 * Manages dynamic price calculations and currency conversions
 */

(function() {
  'use strict';

  // Exchange rates (SAR as base)
  const EXCHANGE_RATES = {
    'SAR': 1,
    'USD': 0.27,
    'EUR': 0.24,
    'GBP': 0.21,
    'AED': 0.98,
    'KWD': 0.08,
    'BHD': 0.10,
    'QAR': 0.97,
    'OMR': 0.10,
    'JOD': 0.19,
    'EGP': 13.11,
    'TRY': 7.39,
    'MAD': 2.67
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
    
    // Convert to SAR first, then to target currency
    const sarAmount = amount / fromRate;
    const convertedAmount = sarAmount * toRate;
    
    console.log(`💱 [CONVERSION DEBUG] ${amount} ${fromCurrency} → ${sarAmount.toFixed(2)} SAR → ${convertedAmount.toFixed(2)} ${toCurrency}`);
    
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
      
      // Use product currency like quantity offers (the working method)
      const currency = cartSummaryData.productCurrency || 'SAR';
      console.log(`💱 [DEBUG] Using product currency like quantity offers: ${currency}`);
      
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
      
      if (data.success && data.product) {
        // Use the same logic as quantity offers
        const price = parseFloat(data.product.price) || 0;
        const currency = data.product.currency || 'SAR';
        
        console.log('💰 Cart Summary - Using real product data like quantity offers:', {
          price: price,
          currency: currency,
          source: 'forms-product API (same as quantity offers)'
        });
        
        // Update cart summary data with real product data
        cartSummaryData.productPrice = price;
        cartSummaryData.productCurrency = currency;
        
        console.log('✅ Cart Summary - Updated with real product data:', {
          productPrice: cartSummaryData.productPrice,
          productCurrency: cartSummaryData.productCurrency
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

  /**
   * Initialize cart summary from field configuration
   */
  function initializeCartSummary(field, formStyle) {
    console.log('🚀 [DEBUG] initializeCartSummary called with:', { field, formStyle });
    
    const config = field.cartSummaryConfig || field.config || {};
    console.log('⚙️ [DEBUG] Cart Summary Config:', JSON.stringify(config, null, 2));
    
    // Update cart summary configuration
    cartSummaryData.discountType = config.discountType || 'percentage';
    cartSummaryData.discountValue = parseFloat(config.discountValue) || 0;
    cartSummaryData.shippingCost = parseFloat(config.shippingCost) || 0;
    
    // Use product currency like quantity offers (the working method)
    // Don't set target currency here - it will be set from the real product data
    console.log('🎯 [CURRENCY] Will use product currency like quantity offers');
    console.log('🎯 [CURRENCY] Target currency will be set from real product data');
    
    console.log('💾 [DEBUG] Cart summary data updated:', JSON.stringify(cartSummaryData, null, 2));
    console.log(`🎯 [TARGET CURRENCY DEBUG] FINAL target currency: "${cartSummaryData.targetCurrency}" (should match form configuration)`);
    console.log(`🔍 [TARGET CURRENCY DEBUG] Available exchange rates:`, Object.keys(EXCHANGE_RATES));
    
    // Always try to get product ID and shop domain
    const productId = window.getProductId ? window.getProductId() : 'auto-detect';
    const shopDomain = window.getShopDomain ? window.getShopDomain() : 'auto-detect';
    
    console.log('🔍 [DEBUG] Detection results:', { 
      productId, 
      shopDomain, 
      autoCalculate: config.autoCalculate,
      hasProductPrice: !!config.productPrice
    });
    
    // FORCE LOADING: Always try to load product data if we can detect product/shop
    if (productId && productId !== 'auto-detect' && shopDomain && shopDomain !== 'auto-detect') {
      console.log('✅ [DEBUG] Valid product/shop detected, loading data...');
      loadProductData(productId, shopDomain);
    } else if (config.autoCalculate || (!config.productPrice && !cartSummaryData.productPrice)) {
      // Force try even with auto-detect if no manual price is set
      console.log('🔄 [DEBUG] Forcing product data load despite auto-detect values...');
      loadProductData(productId, shopDomain);
    } else {
      // Use manual price
      console.log('💰 [DEBUG] Using manual product price');
      cartSummaryData.productPrice = parseFloat(config.productPrice) || 0;
      cartSummaryData.productCurrency = config.currency || 'SAR';
      console.log('💾 [DEBUG] Manual price set:', { 
        productPrice: cartSummaryData.productPrice, 
        productCurrency: cartSummaryData.productCurrency 
      });
      updateCartSummary();
    }
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
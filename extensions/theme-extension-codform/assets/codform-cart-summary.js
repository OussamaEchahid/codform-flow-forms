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
      
      // Use the target currency from configuration, NOT from element dataset
      const currency = cartSummaryData.targetCurrency || 'SAR';
      console.log(`💱 [DEBUG] Using target currency from config: ${currency} (NOT from element dataset)`);
      
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
   * Load product data and update cart summary
   */
  async function loadProductData(productId, shopDomain) {
    try {
      console.log('🛒 [DEBUG] Cart Summary - Loading product data:', { productId, shopDomain });
      
      // Always try to get current values first
      const currentProductId = window.getProductId ? window.getProductId() : productId;
      const currentShopDomain = window.getShopDomain ? window.getShopDomain() : shopDomain;
      
      console.log('🛒 [DEBUG] Cart Summary - Using values:', { 
        productId: currentProductId, 
        shopDomain: currentShopDomain,
        windowFunctions: {
          getProductId: typeof window.getProductId,
          getShopDomain: typeof window.getShopDomain
        }
      });
      
      // If we still can't detect, use fallback values
      if (!currentProductId || currentProductId === 'auto-detect' || 
          !currentShopDomain || currentShopDomain === 'auto-detect') {
        console.log('❌ [DEBUG] Cart Summary - Could not detect product/shop, using manual price');
        console.log('❌ [DEBUG] Cart Summary - Current cartSummaryData:', cartSummaryData);
        updateCartSummary();
        return;
      }
      
      console.log('🔄 [DEBUG] Cart Summary - Making API call to shopify-products');
      
      const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`;
      const requestBody = {
        shop: currentShopDomain,
        productIds: [currentProductId]
      };
      
      console.log('📡 [DEBUG] Cart Summary - API Request:', {
        url: apiUrl,
        body: requestBody
      });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 [DEBUG] Cart Summary - Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ [DEBUG] Cart Summary - HTTP Error:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 [DEBUG] Cart Summary - Full API Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.products && data.products.length > 0) {
        const product = data.products[0];
        console.log('✅ [DEBUG] Cart Summary - Product found:', {
          title: product.title,
          id: product.id,
          variants: product.variants?.length || 0
        });
        
        // Get price from variants
        const price = product.variants && product.variants.length > 0 
          ? parseFloat(product.variants[0].price) 
          : 0;
        
        // FIXED: Use .currency instead of .currency_code based on API response
        const currency = product.variants[0]?.currency || product.currency || 'MAD';
        
        console.log('💰 [DEBUG] Cart Summary - Price extraction:', {
          rawPrice: product.variants[0]?.price,
          parsedPrice: price,
          currency: currency
        });
        
        console.log('🔄 [DEBUG] Cart Summary - BEFORE UPDATE:', {
          oldPrice: cartSummaryData.productPrice,
          oldCurrency: cartSummaryData.productCurrency,
          newPrice: price,
          newCurrency: currency
        });
        
        // Update cart summary data with real product price
        cartSummaryData.productPrice = price;
        cartSummaryData.productCurrency = currency;
        
        console.log('✅ [DEBUG] Cart Summary - AFTER UPDATE:', {
          productPrice: cartSummaryData.productPrice,
          productCurrency: cartSummaryData.productCurrency,
          productTitle: product.title
        });
        
        // Force update display with new price
        console.log('🔄 [DEBUG] Cart Summary - Calling updateCartSummary()...');
        updateCartSummary();
        console.log('✅ [DEBUG] Cart Summary - updateCartSummary() completed');
        
      } else if (data.products && data.products.length > 0) {
        // Fallback for old API response format
        const product = data.products[0];
        const price = product.variants && product.variants.length > 0 
          ? parseFloat(product.variants[0].price) 
          : 0;
        
        cartSummaryData.productPrice = price;
        cartSummaryData.productCurrency = product.variants[0]?.currency || product.currency || 'MAD';
        
        console.log('💰 [DEBUG] Cart Summary - Fallback product data loaded:', {
          price: cartSummaryData.productPrice,
          currency: cartSummaryData.productCurrency
        });
        
        updateCartSummary();
      } else {
        console.error('❌ [DEBUG] Cart Summary - No product data in response:', data);
        console.error('❌ [DEBUG] Cart Summary - API returned no products');
        updateCartSummary();
      }
    } catch (error) {
      console.error('❌ [DEBUG] Cart Summary - Error loading product data:', error);
      console.error('❌ [DEBUG] Cart Summary - Error details:', error.message);
      updateCartSummary();
    }
  }

  /**
   * Initialize cart summary from field configuration
   */
  function initializeCartSummary(field, formStyle) {
    console.log('🚀 [DEBUG] initializeCartSummary called with:', { field, formStyle });
    
    const config = field.config || {};
    console.log('⚙️ [DEBUG] Config:', JSON.stringify(config, null, 2));
    
    // Update cart summary configuration
    cartSummaryData.discountType = config.discountType || 'percentage';
    cartSummaryData.discountValue = parseFloat(config.discountValue) || 0;
    cartSummaryData.shippingCost = parseFloat(config.shippingCost) || 0;
    
    // Extract target currency from form settings
    let targetCurrency = 'SAR'; // Default fallback
    
    // Try multiple sources for target currency - PRIORITIZE style.currency from API
    const possibleSources = [
      window.currentFormData?.style?.currency,     // HIGHEST PRIORITY: Form style currency from API
      window.currentFormData?.style?.formCurrency, // SECOND: Form currency from API style
      window.currentFormData?.style?.country,      // THIRD: Form style country from API
      formStyle?.formCurrency,                     // FOURTH: Passed from form style
      formStyle?.currency,                         // FIFTH: General form style currency
      formStyle?.targetCurrency,                   // SIXTH: Target currency from style
      config.currency,                            // SEVENTH: Field config currency
      config.targetCurrency,                      // EIGHTH: Field config target
      config.country,                            // NINTH: Field config country
      formStyle?.country                         // LAST: Form style country
    ];
    
    console.log('🔍 [TARGET CURRENCY DEBUG] Checking possible sources:', possibleSources);
    
    for (const source of possibleSources) {
      if (source && typeof source === 'string') {
        console.log(`🔍 [TARGET CURRENCY DEBUG] Checking source: "${source}"`);
        
        // Handle "Morocco | MAD" or "Country | CURRENCY" format
        if (source.includes('|')) {
          const parts = source.split('|');
          if (parts.length === 2) {
            const extractedCurrency = parts[1].trim();
            console.log(`✅ [TARGET CURRENCY DEBUG] Extracted currency from "${source}": "${extractedCurrency}"`);
            targetCurrency = extractedCurrency;
            break;
          }
        } 
        // Handle direct currency codes (MAD, USD, etc.)
        else if (source.match(/^[A-Z]{3}$/)) {
          console.log(`✅ [TARGET CURRENCY DEBUG] Direct currency code found: "${source}"`);
          targetCurrency = source;
          break;
        }
      }
    }
    
    cartSummaryData.targetCurrency = targetCurrency;
    
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
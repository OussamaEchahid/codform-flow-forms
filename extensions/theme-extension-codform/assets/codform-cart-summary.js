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
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;
    
    // Convert to SAR first, then to target currency
    const sarAmount = amount / fromRate;
    return sarAmount * toRate;
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
    
    // Don't calculate if product data is not loaded yet
    if (productPrice === null || productCurrency === null) {
      return {
        subtotal: 0,
        discount: 0,
        shipping: 0,
        total: 0
      };
    }
    
    // Convert product price to target currency
    const convertedPrice = convertCurrency(productPrice, productCurrency, targetCurrency);
    
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
    const cartSummaries = document.querySelectorAll('.cart-summary-field');
    
    cartSummaries.forEach(summary => {
      const currency = summary.dataset.currency || 'SAR';
      cartSummaryData.targetCurrency = currency;
      
      const prices = calculatePrices();
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
        if (prices.shipping === 0) {
          shippingElement.textContent = language === 'ar' ? 'مجاني' : 'Free';
        } else {
          shippingElement.textContent = formatCurrency(prices.shipping, currency, language);
        }
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
   * Load product data and update cart summary
   */
  async function loadProductData(productId, shopDomain) {
    try {
      console.log('🛒 Cart Summary - Loading product data:', { productId, shopDomain });
      
      // Always try to get current values first
      const currentProductId = window.getProductId ? window.getProductId() : productId;
      const currentShopDomain = window.getShopDomain ? window.getShopDomain() : shopDomain;
      
      console.log('🛒 Cart Summary - Using values:', { 
        productId: currentProductId, 
        shopDomain: currentShopDomain 
      });
      
      // If we still can't detect, use fallback values
      if (!currentProductId || currentProductId === 'auto-detect' || 
          !currentShopDomain || currentShopDomain === 'auto-detect') {
        console.log('❌ Cart Summary - Could not detect product/shop, using manual price');
        updateCartSummary();
        return;
      }
      
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
        },
        body: JSON.stringify({
          shop: currentShopDomain,
          productIds: [currentProductId]
        })
      });
      
      if (!response.ok) {
        console.error('❌ Cart Summary - HTTP Error:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🛒 Cart Summary - API Response:', data);
      
      console.log('🛒 Cart Summary - Raw API Response:', data);
      
      if (data.success && data.products && data.products.length > 0) {
        const product = data.products[0];
        console.log('🛒 Cart Summary - Product found:', product);
        
        // Get price from variants
        const price = product.variants && product.variants.length > 0 
          ? parseFloat(product.variants[0].price) 
          : 0;
        
        console.log('🛒 Cart Summary - BEFORE UPDATE:', {
          oldPrice: cartSummaryData.productPrice,
          oldCurrency: cartSummaryData.productCurrency,
          newPrice: price,
          newCurrency: product.variants[0]?.currency_code
        });
        
        // Update cart summary data with real product price
        cartSummaryData.productPrice = price;
        cartSummaryData.productCurrency = product.variants[0]?.currency_code || 'SAR';
        
        console.log('🛒 Cart Summary - AFTER UPDATE:', {
          productPrice: cartSummaryData.productPrice,
          productCurrency: cartSummaryData.productCurrency,
          productTitle: product.title
        });
        
        // Force update display with new price
        updateCartSummary();
        console.log('🛒 Cart Summary - updateCartSummary() called');
      } else if (data.products && data.products.length > 0) {
        // Fallback for old API response format
        const product = data.products[0];
        const price = product.variants && product.variants.length > 0 
          ? parseFloat(product.variants[0].price) 
          : 0;
        
        cartSummaryData.productPrice = price;
        cartSummaryData.productCurrency = product.variants[0]?.currency_code || 'MAD';
        
        console.log('💰 Cart Summary - Fallback product data loaded:', {
          price: cartSummaryData.productPrice,
          currency: cartSummaryData.productCurrency
        });
        
        updateCartSummary();
      } else {
        console.error('❌ Cart Summary - No product data in response:', data);
        updateCartSummary();
      }
    } catch (error) {
      console.error('❌ Cart Summary - Error loading product data:', error);
      updateCartSummary();
    }
  }

  /**
   * Initialize cart summary from field configuration
   */
  function initializeCartSummary(field, formStyle) {
    const config = field.config || {};
    
    // Update cart summary configuration
    cartSummaryData.discountType = config.discountType || 'percentage';
    cartSummaryData.discountValue = parseFloat(config.discountValue) || 0;
    cartSummaryData.shippingCost = parseFloat(config.shippingCost) || 0;
    cartSummaryData.targetCurrency = config.currency || 'SAR';
    
    // If auto-calculate is enabled, load product data
    if (config.autoCalculate) {
      const productId = window.getProductId ? window.getProductId() : 'auto-detect';
      const shopDomain = window.getShopDomain ? window.getShopDomain() : 'auto-detect';
      
      if (productId && productId !== 'auto-detect' && shopDomain && shopDomain !== 'auto-detect') {
        loadProductData(productId, shopDomain);
      }
    } else {
      // Manual calculation with default product price
      cartSummaryData.productPrice = parseFloat(config.productPrice) || 0;
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
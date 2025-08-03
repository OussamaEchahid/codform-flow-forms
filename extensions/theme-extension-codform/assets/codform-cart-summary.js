/**
 * CODFORM Cart Summary - Dynamic Price Updates
 * Handles cart summary calculations and currency conversion
 */

(function() {
  'use strict';

  console.log('🧾 CODFORM Cart Summary initialized');

  // Currency exchange rates (updated regularly)
  const EXCHANGE_RATES = {
    'USD': 1.0,
    'EUR': 0.92,
    'GBP': 0.79,
    'CAD': 1.43,
    'AUD': 1.57,
    'SAR': 3.75,
    'AED': 3.67,
    'EGP': 30.85,
    'QAR': 3.64,
    'KWD': 0.31,
    'BHD': 0.38,
    'OMR': 0.38,
    'JOD': 0.71,
    'LBP': 89500,
    'MAD': 9.85,
    'TND': 3.15,
    'DZD': 134.25,
    'MXN': 20.15,
    'BRL': 6.05,
    'ARS': 350.50,
    'CLP': 950.75,
    'COP': 4250.30,
    'PEN': 3.75,
    'VES': 36.50,
    'UYU': 39.85,
    'IQD': 1470.25,
    'IRR': 42000.00,
    'TRY': 29.75,
    'ILS': 3.70,
    'SYP': 12500.00,
    'YER': 250.75,
    'NGN': 850.25,
    'ZAR': 18.95,
    'KES': 155.30,
    'GHS': 15.85,
    'ETB': 120.50,
    'TZS': 2500.75,
    'UGX': 3750.25,
    'ZWL': 350.00,
    'ZMW': 26.85,
    'RWF': 1350.50
  };

  /**
   * Convert currency amount
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Converted amount
   */
  function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;
    
    return (amount / fromRate) * toRate;
  }

  /**
   * Format price with currency
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @param {string} language - Language code
   * @returns {string} Formatted price
   */
  function formatPrice(amount, currency, language = 'en') {
    try {
      const locale = language === 'ar' ? 'ar-SA' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      console.warn('Currency formatting error:', error);
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  /**
   * Update cart summary prices based on configuration
   * @param {Element} summaryElement - Cart summary container
   * @param {Object} config - Configuration object
   * @param {number} basePrice - Base product price
   * @param {string} baseCurrency - Base currency
   * @param {string} targetCurrency - Target currency
   * @param {string} language - Language for formatting
   */
  function updateCartSummary(summaryElement, config, basePrice, baseCurrency, targetCurrency, language) {
    console.log('💰 Updating cart summary:', { basePrice, baseCurrency, targetCurrency, config });

    // Convert base price to target currency
    const convertedPrice = convertCurrency(basePrice, baseCurrency, targetCurrency);
    
    // Calculate prices
    let subtotal = convertedPrice;
    let discount = 0;
    let shipping = 0;

    // Calculate discount
    if (config.showDiscount && config.discountValue > 0) {
      if (config.discountType === 'percentage') {
        discount = (subtotal * config.discountValue) / 100;
      } else {
        discount = config.discountValue;
      }
    }

    // Calculate shipping
    if (config.shippingType === 'manual') {
      shipping = config.shippingValue || 0;
    } else if (config.shippingType === 'auto') {
      shipping = subtotal * 0.1; // 10% as example
    }

    const total = Math.max(0, subtotal - discount + shipping);

    // Update DOM elements
    const subtotalElement = summaryElement.querySelector('.product-price');
    const discountElement = summaryElement.querySelector('.discount-price');
    const shippingElement = summaryElement.querySelector('.shipping-price');
    const totalElement = summaryElement.querySelector('.total-price');

    if (subtotalElement) {
      subtotalElement.textContent = formatPrice(subtotal, targetCurrency, language);
    }

    if (discountElement && discount > 0) {
      discountElement.textContent = '-' + formatPrice(discount, targetCurrency, language);
    }

    if (shippingElement) {
      if (shipping === 0) {
        shippingElement.textContent = language === 'ar' ? 'مجاني' : 'Free';
      } else {
        shippingElement.textContent = formatPrice(shipping, targetCurrency, language);
      }
    }

    if (totalElement) {
      totalElement.textContent = formatPrice(total, targetCurrency, language);
    }

    console.log('✅ Cart summary updated successfully');
  }

  /**
   * Initialize cart summary listeners
   */
  function initializeCartSummary() {
    // Listen for form load events
    document.addEventListener('codform:formLoaded', function(event) {
      const formData = event.detail;
      
      if (formData && formData.fields) {
        const cartSummaryFields = formData.fields.filter(field => field.type === 'cart-summary');
        
        cartSummaryFields.forEach(field => {
          const summaryElement = document.querySelector(`.codform-cart-summary[data-field-id="${field.id}"]`);
          if (summaryElement) {
            const config = field.cartSummaryConfig || {};
            const formStyle = formData.formStyle || {};
            
            // Get price data from Shopify
            const productPrice = window.codformProductPrice || 0;
            const productCurrency = window.codformProductCurrency || 'USD';
            const targetCurrency = formStyle.currency || 'SAR';
            const language = formData.language || 'en';
            
            updateCartSummary(
              summaryElement,
              config,
              productPrice,
              productCurrency,
              targetCurrency,
              language
            );
          }
        });
      }
    });

    // Listen for product changes
    document.addEventListener('codform:productChanged', function(event) {
      const { productId, price, currency } = event.detail;
      
      // Update all cart summary instances
      const summaryElements = document.querySelectorAll('.codform-cart-summary');
      summaryElements.forEach(summaryElement => {
        const fieldId = summaryElement.dataset.fieldId;
        // Re-calculate based on new product data
        // This would need additional implementation for dynamic product changes
      });
    });

    // Listen for currency changes
    document.addEventListener('codform:currencyChanged', function(event) {
      const { newCurrency, language } = event.detail;
      
      const summaryElements = document.querySelectorAll('.codform-cart-summary');
      summaryElements.forEach(summaryElement => {
        // Re-calculate with new currency
        const basePrice = parseFloat(summaryElement.dataset.basePrice) || 0;
        const baseCurrency = summaryElement.dataset.baseCurrency || 'USD';
        
        // This would trigger re-calculation with new currency
        console.log('🔄 Currency changed to:', newCurrency);
      });
    });

    console.log('🎯 Cart summary listeners initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCartSummary);
  } else {
    initializeCartSummary();
  }

  // Export functions for external use
  window.CodformCartSummary = {
    convertCurrency,
    formatPrice,
    updateCartSummary,
    EXCHANGE_RATES
  };

})();
/**
 * CODForm Popup Cart Summary Fix
 * Handles cart summary initialization in popup modals
 */

(function() {
  'use strict';

  console.log('🛒 POPUP: Cart Summary module loading...');

  // Main initialization function
  function initializePopupCartSummary() {
    console.log('🛒 POPUP: Starting Cart Summary initialization...');
    
    // Wait for popup to be fully rendered
    setTimeout(() => {
      // Find all cart summary fields in popup
      const popupCartSummaries = document.querySelectorAll('#codform-popup-overlay .cart-summary-field, #codform-popup-modal .cart-summary-field');
      
      if (popupCartSummaries.length === 0) {
        console.log('🛒 POPUP: No cart summary fields found in popup - retrying...');
        // Retry after a short delay
        setTimeout(() => {
          const retryCartSummaries = document.querySelectorAll('#codform-popup-overlay .cart-summary-field, #codform-popup-modal .cart-summary-field');
          if (retryCartSummaries.length === 0) {
            console.log('🛒 POPUP: Still no cart summary fields found after retry');
            return;
          }
          console.log('🛒 POPUP: Found cart summary fields on retry:', retryCartSummaries.length);
          processPopupCartSummary(retryCartSummaries);
        }, 300);
        return;
      }
      
      console.log('🛒 POPUP: Found', popupCartSummaries.length, 'cart summary fields');
      processPopupCartSummary(popupCartSummaries);
    }, 50);
  }

  // Process cart summary initialization
  function processPopupCartSummary(popupCartSummaries) {
    console.log('🛒 POPUP: Processing cart summary initialization...');

    // 🔧 FIX: Get form data from multiple sources
    let formData = window.codformGlobalData || window.CodformFormData;
    let cartSummaryField = null;

    // Try to find cart summary field from multiple sources
    if (formData && formData.fields) {
      cartSummaryField = formData.fields.find(field => field.type === 'cart_summary');
      console.log('🛒 POPUP: Found field in formData:', cartSummaryField);
    }

    // If not found, try to get from main form
    if (!cartSummaryField) {
      console.log('🛒 POPUP: Searching in main form for cart summary...');
      const mainCartSummary = document.querySelector('.cart-summary-field');
      if (mainCartSummary) {
        // Extract configuration from main form element
        const configData = mainCartSummary.dataset.config;
        if (configData) {
          try {
            const parsedConfig = JSON.parse(configData);
            cartSummaryField = {
              type: 'cart_summary',
              cartSummaryConfig: parsedConfig,
              config: parsedConfig
            };
            console.log('🛒 POPUP: Extracted config from main form:', cartSummaryField);
          } catch (e) {
            console.error('🛒 POPUP: Failed to parse config:', e);
          }
        }
      }
    }

    // If still not found, create default configuration
    if (!cartSummaryField) {
      console.log('🛒 POPUP: Creating default cart summary configuration...');
      cartSummaryField = {
        type: 'cart_summary',
        cartSummaryConfig: {
          discountType: 'percentage',
          discountValue: 0,
          shippingType: 'manual',
          shippingValue: 0
        },
        config: {
          discountType: 'percentage',
          discountValue: 0,
          shippingType: 'manual',
          shippingValue: 0
        }
      };
    }

    console.log('🛒 POPUP: Final cart summary field:', cartSummaryField);

    // Ensure we have formData for style
    if (!formData) {
      formData = { style: {} };
    }

    // 🔄 FORCE REFRESH: Always make fresh API call for popup (no caching)
    console.log('🛒 POPUP: Making FRESH API call (no cache)...');
    
    // Initialize cart summary with API data (same as main form)
    if (window.codformCartSummary) {
      const productId = window.codformProductId || 'auto-detect';
      const shopDomain = window.codformShopDomain || 'auto-detect';
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shopDomain)}&product=${encodeURIComponent(productId)}&t=${timestamp}`;

      console.log('🛒 POPUP: Making FRESH API call for cart summary:', apiUrl);
      
      // 🔄 FORCE FRESH FETCH: Add cache-busting headers
      fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
        .then(response => response.json())
        .then(data => {
          console.log('🛒 POPUP: FRESH API Response for cart summary:', data);
          
          if (data.success && data.form?.currency) {
            // 🔄 FORCE REFRESH: Clear any cached data first
            window.CodformFormData = {
              currency: data.form.currency,
              ...data.form
            };
            
            console.log('🛒 POPUP: FRESH currency saved:', data.form.currency);
            
            // 🔄 FORCE REFRESH: Reset cart summary data
            if (window.codformCartSummary.resetData) {
              window.codformCartSummary.resetData();
            }
            
            // Set product data if available
            if (data.product && window.codformCartSummary.setProductData) {
              console.log('🛒 POPUP: Setting FRESH product data:', data.product);
              window.codformCartSummary.setProductData(
                parseFloat(data.product.price) || 0,
                data.product.currency || data.form.currency
              );
            }
            
            // Initialize cart summary with fresh data
            const formStyle = {
              currency: data.form.currency,
              ...formData.style
            };
            
            console.log('🛒 POPUP: Initializing cart summary with FRESH data');
            window.codformCartSummary.initialize(cartSummaryField, formStyle);
            
            // 🔄 FORCE UPDATE: Trigger immediate update
            setTimeout(() => {
              if (window.codformCartSummary.forceUpdate) {
                console.log('🛒 POPUP: Forcing cart summary update...');
                window.codformCartSummary.forceUpdate();
              }
            }, 100);
            
          } else {
            console.log('🛒 POPUP: API missing currency data, using fallback');
            // Fallback initialization
            window.codformCartSummary.initialize(cartSummaryField, formData.style || {});
          }
        })
        .catch(() => {
          console.log('🛒 POPUP: API error for cart summary, using fallback');
          // Fallback initialization
          window.codformCartSummary.initialize(cartSummaryField, formData.style || {});
        });
    } else {
      console.log('🛒 POPUP: codformCartSummary not available, skipping initialization');
    }
  }

  // Export to global scope
  window.CodformPopupCartSummary = {
    initialize: initializePopupCartSummary,
    process: processPopupCartSummary
  };

  console.log('🛒 POPUP: Cart Summary module loaded successfully');

})();

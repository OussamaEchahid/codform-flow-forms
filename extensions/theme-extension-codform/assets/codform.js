
// CODFORM - Enhanced Shopify Submit Handler with Comprehensive Diagnostics
console.log('🚀 CODFORM: Enhanced version loading...');

(function() {
  'use strict';
  
  // Configuration
  const API_URL = 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-submissions';
  const FORM_ID = 'bc668a8c-2d40-44a3-b073-effc4c8f13cf';
  
  // Global state
  let isInitialized = false;
  let processedButtons = new Set();
  
  // Enhanced logging
  function log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] CODFORM: ${message}`, data || '');
  }
  
  // Visual indicator for debugging
  function showDebugIndicator(message) {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      font-size: 12px;
      max-width: 200px;
    `;
    indicator.textContent = `CODFORM: ${message}`;
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 3000);
  }
  
  // Wait for DOM to be ready
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete') {
          callback();
        }
      });
    }
  }
  
  // Enhanced button selectors - comprehensive list
  function getButtonSelectors() {
    return [
      // Standard submit buttons
      'button[type="submit"]',
      'input[type="submit"]',
      'button[name*="add"]',
      'input[name*="add"]',
      
      // Common button classes
      '.btn-cart',
      '.add-to-cart',
      '.product-form__cart-submit',
      '.btn--add-to-cart',
      '.product-form__button',
      '.shopify-payment-button__button',
      
      // Text-based selectors (English)
      'button:contains("Add to Cart")',
      'button:contains("Buy Now")',
      'button:contains("Order Now")',
      'button:contains("Submit Order")',
      'button:contains("Purchase")',
      'button:contains("Checkout")',
      
      // Text-based selectors (Arabic)
      'button:contains("إضافة إلى السلة")',
      'button:contains("اطلب الآن")',
      'button:contains("إرسال الطلب")',
      'button:contains("شراء")',
      'button:contains("طلب")',
      'button:contains("أضف للسلة")',
      
      // Generic button selectors
      '.button',
      '.btn',
      '[role="button"]',
      'button:not([type="button"]):not([type="reset"])',
      
      // Form-specific selectors
      'form[action*="cart"] button',
      'form[action*="add"] button',
      '.product-form button',
      '.cart-form button'
    ];
  }
  
  // Custom :contains selector implementation
  function findElementsContaining(selector, text) {
    const elements = document.querySelectorAll(selector.replace(':contains("' + text + '")', ''));
    return Array.from(elements).filter(el => 
      el.textContent && el.textContent.toLowerCase().includes(text.toLowerCase())
    );
  }
  
  // Enhanced button detection
  function findAllButtons() {
    const selectors = getButtonSelectors();
    const allButtons = new Set();
    
    selectors.forEach(selector => {
      try {
        if (selector.includes(':contains(')) {
          // Handle custom :contains selector
          const match = selector.match(/(.+):contains\("(.+)"\)/);
          if (match) {
            const [, baseSelector, text] = match;
            const elements = findElementsContaining(selector, text);
            elements.forEach(el => allButtons.add(el));
          }
        } else {
          // Standard selector
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => allButtons.add(el));
        }
      } catch (error) {
        log(`Error with selector ${selector}:`, error.message);
      }
    });
    
    return Array.from(allButtons);
  }
  
  // Check if button is likely a submit button
  function isSubmitButton(button) {
    if (!button) return false;
    
    const text = (button.textContent || button.value || '').toLowerCase();
    const name = (button.name || '').toLowerCase();
    const className = (button.className || '').toLowerCase();
    const id = (button.id || '').toLowerCase();
    
    // Submit indicators
    const submitKeywords = [
      'submit', 'add to cart', 'buy now', 'order now', 'purchase', 'checkout',
      'إضافة', 'اطلب', 'شراء', 'طلب', 'إرسال', 'سلة'
    ];
    
    // Check text content
    const hasSubmitText = submitKeywords.some(keyword => text.includes(keyword));
    
    // Check attributes
    const hasSubmitName = submitKeywords.some(keyword => name.includes(keyword));
    const hasSubmitClass = submitKeywords.some(keyword => className.includes(keyword));
    const hasSubmitId = submitKeywords.some(keyword => id.includes(keyword));
    
    // Button type check
    const isSubmitType = button.type === 'submit' || button.tagName === 'INPUT' && button.type === 'submit';
    
    return hasSubmitText || hasSubmitName || hasSubmitClass || hasSubmitId || isSubmitType;
  }
  
  // Enhanced form data collection
  function collectFormData() {
    log('🔍 Collecting form data...');
    const data = {};
    
    // Get all form inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    log(`Found ${inputs.length} form inputs`);
    
    inputs.forEach(input => {
      if (input.value && input.value.trim()) {
        const name = input.name || input.id || input.placeholder || 'unknown';
        const value = input.value.trim();
        
        log(`Input found - ${name}: ${value}`);
        
        // Map common field names
        const lowerName = name.toLowerCase();
        if (lowerName.includes('email') || input.type === 'email') {
          data.email = value;
        } else if (lowerName.includes('phone') || input.type === 'tel') {
          data.phone = value;
        } else if (lowerName.includes('name') || lowerName.includes('first')) {
          data.name = value;
        } else if (lowerName.includes('address')) {
          data.address = value;
        } else if (lowerName.includes('city')) {
          data.city = value;
        } else if (lowerName.includes('quantity')) {
          data.quantity = value;
        } else {
          data[name] = value;
        }
      }
    });
    
    // Add product information if available
    if (typeof window.meta !== 'undefined' && window.meta.product) {
      data.product_id = window.meta.product.id;
      data.product_title = window.meta.product.title;
      log('Product info added:', window.meta.product);
    }
    
    // Add page URL and shop info
    data.shop = window.location.hostname;
    data.page_url = window.location.href;
    data.timestamp = new Date().toISOString();
    
    log('Final form data:', data);
    return data;
  }
  
  // Submit to API
  function submitToAPI(formData, button, originalText) {
    log('🌐 Submitting to API...', formData);
    
    const requestData = {
      formId: FORM_ID,
      data: formData,
      shopDomain: window.location.hostname
    };
    
    log('Request payload:', requestData);
    
    // Use fetch with comprehensive error handling
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    .then(response => {
      log(`Response status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      log('✅ Success:', result);
      showDebugIndicator('تم إرسال الطلب بنجاح!');
      
      // Show success state
      if (button.textContent !== undefined) {
        button.textContent = 'تم الإرسال بنجاح!';
      } else {
        button.value = 'تم الإرسال بنجاح!';
      }
      
      // Redirect after delay
      setTimeout(() => {
        const thankYouUrl = window.location.origin + '/pages/thank-you';
        log('Redirecting to:', thankYouUrl);
        window.location.href = thankYouUrl;
      }, 2000);
    })
    .catch(error => {
      log('❌ Error:', error);
      showDebugIndicator('حدث خطأ - حاول مرة أخرى');
      handleError(button, originalText, error);
    });
  }
  
  // Handle submission errors
  function handleError(button, originalText, error) {
    log('❌ Handling error:', error.message);
    
    // Show error state
    if (button.textContent !== undefined) {
      button.textContent = 'حدث خطأ - حاول مرة أخرى';
    } else {
      button.value = 'حدث خطأ - حاول مرة أخرى';
    }
    
    // Restore original state after delay
    setTimeout(() => {
      button.disabled = false;
      if (button.textContent !== undefined) {
        button.textContent = originalText;
      } else {
        button.value = originalText;
      }
    }, 3000);
  }
  
  // Handle button click
  function handleButtonClick(event) {
    log('🔥 Button clicked!', event.target);
    showDebugIndicator('تم النقر على الزر');
    
    // Prevent default action
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.target;
    const originalText = button.textContent || button.value || 'Submit';
    
    // Show loading state
    button.disabled = true;
    if (button.textContent !== undefined) {
      button.textContent = 'جاري الإرسال...';
    } else {
      button.value = 'جاري الإرسال...';
    }
    
    // Collect and submit data
    const formData = collectFormData();
    submitToAPI(formData, button, originalText);
  }
  
  // Attach event listeners to buttons
  function attachEventListeners() {
    const buttons = findAllButtons();
    log(`🔍 Found ${buttons.length} potential buttons`);
    
    let attachedCount = 0;
    
    buttons.forEach((button, index) => {
      // Skip if already processed
      if (processedButtons.has(button)) {
        return;
      }
      
      // Check if it's a submit button
      if (isSubmitButton(button)) {
        log(`✅ Attaching listener to button ${index + 1}:`, {
          text: button.textContent || button.value,
          type: button.type,
          className: button.className,
          id: button.id
        });
        
        // Multiple event listeners for reliability
        button.addEventListener('click', handleButtonClick, true);
        button.addEventListener('click', handleButtonClick, false);
        
        // Mark as processed
        processedButtons.add(button);
        attachedCount++;
        
        // Visual indicator for debugging
        button.style.outline = '2px solid #4CAF50';
        setTimeout(() => {
          button.style.outline = '';
        }, 2000);
      }
    });
    
    log(`📎 Attached listeners to ${attachedCount} buttons`);
    showDebugIndicator(`تم العثور على ${attachedCount} أزرار`);
    
    return attachedCount;
  }
  
  // Form submit handler as fallback
  function attachFormListeners() {
    const forms = document.querySelectorAll('form');
    log(`📋 Found ${forms.length} forms`);
    
    forms.forEach((form, index) => {
      if (!form.hasAttribute('data-codform-processed')) {
        form.addEventListener('submit', function(event) {
          log(`📋 Form ${index + 1} submitted`);
          
          // Check if this is a product/cart form
          const action = form.action || '';
          const isProductForm = action.includes('cart') || action.includes('add') || 
                               form.className.includes('product') || form.className.includes('cart');
          
          if (isProductForm) {
            event.preventDefault();
            event.stopPropagation();
            
            showDebugIndicator('تم إرسال النموذج');
            
            const formData = collectFormData();
            submitToAPI(formData, form.querySelector('button, input[type="submit"]'), 'Submit');
          }
        });
        
        form.setAttribute('data-codform-processed', 'true');
      }
    });
  }
  
  // Initialize with comprehensive setup
  function initialize() {
    if (isInitialized) {
      log('⚠️ Already initialized, skipping...');
      return;
    }
    
    log('🚀 Initializing CODFORM...');
    showDebugIndicator('تم تحميل CODFORM');
    
    // Attach to existing elements
    const buttonCount = attachEventListeners();
    attachFormListeners();
    
    // Set up mutation observer for dynamic content
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function(mutations) {
        let shouldRecheck = false;
        
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if any buttons were added
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Element node
                if (node.tagName === 'BUTTON' || node.tagName === 'INPUT' || 
                    node.querySelector && node.querySelector('button, input[type="submit"]')) {
                  shouldRecheck = true;
                }
              }
            });
          }
        });
        
        if (shouldRecheck) {
          log('🔄 New elements detected, re-checking buttons...');
          setTimeout(attachEventListeners, 100);
        }
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      log('👁️ Mutation observer set up');
    }
    
    isInitialized = true;
    log(`✅ CODFORM initialized successfully with ${buttonCount} buttons`);
  }
  
  // Start initialization
  ready(function() {
    log('📄 DOM ready, starting initialization...');
    initialize();
    
    // Re-initialize periodically for dynamic content
    setInterval(function() {
      if (!isInitialized) return;
      
      const newButtonCount = attachEventListeners();
      if (newButtonCount > 0) {
        log(`🔄 Periodic check: attached ${newButtonCount} new buttons`);
      }
    }, 2000);
  });
  
  // Fallback initialization
  setTimeout(function() {
    if (!isInitialized) {
      log('⏰ Fallback initialization triggered');
      initialize();
    }
  }, 1000);
  
  log('✅ CODFORM script loaded and ready');
  
})();

// CODFORM - Shopify Submit Handler
console.log('🚀 CODFORM: Loading Shopify submit handler...');

(function() {
  'use strict';
  
  console.log('🔥 CODFORM: Script is running!');
  console.log('🔥 CODFORM: Current URL:', window.location.href);
  
  // Configuration
  const API_URL = 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-submissions';
  const FORM_ID = 'bc668a8c-2d40-44a3-b073-effc4c8f13cf';
  
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
  
  // Main initialization
  ready(function() {
    console.log('✅ CODFORM: DOM ready, setting up handlers...');
    attachToSubmitButtons();
    
    // Also watch for dynamic content
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function() {
        attachToSubmitButtons();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
  
  // Attach event handlers to submit buttons
  function attachToSubmitButtons() {
    // Get all potential submit buttons with better selectors
    const buttons = document.querySelectorAll([
      'button[type="submit"]',
      'input[type="submit"]',
      '.form-submit-btn',
      '.submit-btn',
      'button:not([type])',
      '.btn',
      '.button',
      '[class*="submit"]',
      '[class*="order"]',
      '[class*="buy"]',
      '[class*="checkout"]',
      '[class*="cart"]',
      'form button',
      '.product-form button',
      '.cart-form button'
    ].join(','));
    
    console.log(`🔍 CODFORM: Found ${buttons.length} buttons on page`);
    
    buttons.forEach(function(button, index) {
      // Skip if already processed
      if (button.hasAttribute('data-codform-processed')) {
        console.log(`⚠️ CODFORM: Button ${index + 1} already processed`);
        return;
      }
      
      const text = (button.textContent || button.value || '').toLowerCase().trim();
      const classes = (button.className || '').toLowerCase();
      const buttonType = button.type || '';
      
      console.log(`🔍 CODFORM: Checking button ${index + 1}:`, {
        text: text,
        classes: classes,
        type: buttonType,
        element: button
      });
      
      // Better detection logic for Arabic/English submit buttons
      const isSubmitButton = 
        buttonType === 'submit' ||
        classes.includes('form-submit-btn') ||
        classes.includes('submit-btn') ||
        text.includes('submit order') || text.includes('submit') || text.includes('order') || 
        text.includes('طلب') || text.includes('إرسال') || text.includes('أضف') || text.includes('شراء') ||
        text.includes('add to cart') || text.includes('buy now') || text.includes('checkout') ||
        classes.includes('submit') || classes.includes('order') || classes.includes('buy') ||
        classes.includes('checkout') || classes.includes('cart');
      
      if (isSubmitButton) {
        console.log('✅ CODFORM: *** ATTACHING HANDLER TO BUTTON ***:', {
          text: text,
          classes: classes,
          type: buttonType,
          element: button
        });
        button.setAttribute('data-codform-processed', 'true');
        button.addEventListener('click', handleSubmit, true);
      } else {
        console.log(`⭕ CODFORM: Button ${index + 1} NOT a submit button`);
      }
    });
  }
  
  // Handle form submission
  function handleSubmit(event) {
    console.log('🔥 CODFORM: Button clicked!', event.target);
    
    // Prevent default submission
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.target;
    const originalText = button.textContent || button.value;
    
    // Show loading state
    button.disabled = true;
    if (button.textContent !== undefined) {
      button.textContent = 'جاري الإرسال...';
    } else {
      button.value = 'جاري الإرسال...';
    }
    
    // Collect form data
    const formData = collectFormData();
    console.log('📝 CODFORM: Collected data:', formData);
    
    // Submit to API
    submitToAPI(formData, button, originalText);
  }
  
  // Collect form data from the page
  function collectFormData() {
    const data = {};
    
    // Get all form inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(function(input) {
      if (input.value && input.value.trim()) {
        const name = input.name || input.id || input.placeholder || 'unknown';
        const value = input.value.trim();
        
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
    }
    
    // Add shop information
    data.shop = window.location.hostname;
    
    return data;
  }
  
  // Submit data to API
  function submitToAPI(formData, button, originalText) {
    console.log('🌐 CODFORM: Submitting to API...');
    
    // Use fetch if available, otherwise use XMLHttpRequest
    if (typeof fetch !== 'undefined') {
      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formId: FORM_ID,
          data: formData
        })
      })
      .then(function(response) {
        console.log('📡 CODFORM: Response status:', response.status);
        return response.json();
      })
      .then(function(result) {
        console.log('✅ CODFORM: Success:', result);
        
        // Show success
        if (button.textContent !== undefined) {
          button.textContent = 'تم الإرسال بنجاح!';
        } else {
          button.value = 'تم الإرسال بنجاح!';
        }
        
        // Redirect after 2 seconds
        setTimeout(function() {
          window.location.href = window.location.origin + '/pages/thank-you';
        }, 2000);
      })
      .catch(function(error) {
        console.error('❌ CODFORM: Error:', error);
        handleError(button, originalText, error);
      });
    } else {
      // Fallback to XMLHttpRequest for older browsers
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            console.log('✅ CODFORM: Success via XHR');
            if (button.textContent !== undefined) {
              button.textContent = 'تم الإرسال بنجاح!';
            } else {
              button.value = 'تم الإرسال بنجاح!';
            }
            setTimeout(function() {
              window.location.href = window.location.origin + '/pages/thank-you';
            }, 2000);
          } else {
            console.error('❌ CODFORM: XHR Error:', xhr.status);
            handleError(button, originalText, new Error('Network error'));
          }
        }
      };
      
      xhr.send(JSON.stringify({
        formId: FORM_ID,
        data: formData
      }));
    }
  }
  
  // Handle submission errors
  function handleError(button, originalText, error) {
    console.error('❌ CODFORM: Submission failed:', error);
    
    // Show error state
    if (button.textContent !== undefined) {
      button.textContent = 'حدث خطأ - حاول مرة أخرى';
    } else {
      button.value = 'حدث خطأ - حاول مرة أخرى';
    }
    
    // Restore original state after 3 seconds
    setTimeout(function() {
      button.disabled = false;
      if (button.textContent !== undefined) {
        button.textContent = originalText;
      } else {
        button.value = originalText;
      }
    }, 3000);
  }
  
  console.log('✅ CODFORM: Initialization complete');
  
})();
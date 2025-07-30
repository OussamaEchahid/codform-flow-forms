/* ===============================================================================
   CODFORM MAIN - Form rendering and submission logic
   =============================================================================== */

// Constants
const API_BASE_URL = 'https://lovable-forms-api.netlify.app/.netlify/functions/api-forms';
const DEFAULT_PRODUCT_ID = 'default';

// Utility functions
function getProductId() {
  try {
    const productId = window.codformProductId || 'auto-detect';
    return productId.trim();
  } catch (error) {
    console.error('❌ CODFORM: Error getting product ID:', error);
    return 'auto-detect';
  }
}

function getShopDomain() {
  try {
    const shopDomain = window.codformShopDomain || 'auto-detect';
    return shopDomain;
  } catch (error) {
    console.error('❌ CODFORM: Error getting shop domain:', error);
    return 'auto-detect';
  }
}

function getStyleValue(style, property, fallback) {
  if (!style || typeof style !== 'object') return fallback;
  return style[property] || fallback;
}

// Load and render form
window.loadForm = async function(productId = null, shopDomain = null, formId = null) {
  if (!productId) {
    console.error('❌ CODFORM: No product ID found');
    return;
  }

  const actualShopDomain = shopDomain || getShopDomain();
  const container = document.querySelector('[data-form-preview-id="form-preview-stable"]');
  
  if (!container) {
    console.error('❌ CODFORM: Form container not found');
    return;
  }

  try {
    // API URLs to try
    const urls = [
      `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(actualShopDomain)}&product=${encodeURIComponent(productId)}`,
      `${API_BASE_URL}?shop=${encodeURIComponent(actualShopDomain)}&product=${encodeURIComponent(productId)}`
    ];

    let data = null;
    for (const url of urls) {
      try {
        const response = await fetch(url);
        data = await response.json();
        if (data && (data.success || data.fields)) break;
      } catch (error) {
        continue;
      }
    }

    if (!data) throw new Error('No data received');

    // Extract form data
    const formStyle = data.formStyle || data.style || {};
    let fieldsArray = [];
    
    if (data.fields) fieldsArray = data.fields;
    else if (data.form?.fields) fieldsArray = data.form.fields;
    else if (data.form?.data?.length) fieldsArray = data.form.data.flatMap(step => step.fields || []);
    else if (data.data?.length) fieldsArray = data.data.flatMap(step => step.fields || []);
    else if (Array.isArray(data.form)) fieldsArray = data.form;

    if (!fieldsArray.length) {
      console.error('❌ CODFORM: No valid fields found');
      return;
    }

    // Build form HTML
    const formLanguage = data.language || formStyle.language || 'ar';
    const formDirection = formStyle.formDirection || (formLanguage === 'ar' ? 'rtl' : 'ltr');
    
    // Apply container styles
    container.style.cssText = `
      background: ${getStyleValue(formStyle, 'backgroundColor', '#ffffff')};
      border-radius: ${getStyleValue(formStyle, 'borderRadius', '12px')};
      padding: ${getStyleValue(formStyle, 'padding', '24px')};
      box-shadow: ${getStyleValue(formStyle, 'boxShadow', '0 4px 20px rgba(0, 0, 0, 0.1)')};
      direction: ${formDirection};
      font-family: ${formDirection === 'rtl' ? "'Cairo', 'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif"};
      max-width: 100%;
      margin: 0 auto;
    `;

    // Check if this is popup mode
    const isPopupMode = fieldsArray.some(field => field.type === 'popup-button');
    
    let formHTML = '';
    
    if (isPopupMode) {
      // Popup mode - only show popup button
      const popupButton = fieldsArray.find(field => field.type === 'popup-button');
      if (popupButton) {
        formHTML = window.renderPopupButton(popupButton, formStyle);
      }
    } else {
      // Normal mode - show all fields
      fieldsArray.forEach(field => {
        if (field.type !== 'popup-button') {
          formHTML += window.renderField(field, formStyle, formLanguage);
        }
      });
    }

    container.innerHTML = formHTML;
    
    // Store form data globally for popup use
    window.currentFormData = { formStyle, fieldsArray, formLanguage };
    
    // Load quantity offers
    setTimeout(() => {
      const blockId = window.generateBlockId(productId);
      if (window.CodformQuantityOffers) {
        const formCurrency = formStyle.currency || 'SAR';
        const productData = window.getProductData();
        window.CodformQuantityOffers.loadAndDisplayOffers(blockId, productId, actualShopDomain, formCurrency, productData);
      }
    }, 500);

  } catch (error) {
    console.error('❌ CODFORM: Form loading error:', error);
  }
};

// Form submission
window.handleFormSubmission = async function(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitBtn = form.querySelector('.codform-submit-btn, button[type="submit"]');
  
  const formInputs = form.querySelectorAll('input, textarea, select');
  const formData = {};
  
  formInputs.forEach(input => {
    if (input.name || input.id) {
      const fieldKey = input.name || input.id;
      if (input.type === 'checkbox') {
        formData[fieldKey] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) {
          formData[fieldKey] = input.value;
        }
      } else {
        formData[fieldKey] = input.value;
      }
    }
  });

  try {
    const productId = getProductId();
    const shopDomain = getShopDomain();
    
    const response = await fetch('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formId: productId,
        shopDomain: shopDomain,
        productId: productId,
        data: formData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (submitBtn) {
        submitBtn.innerHTML = '✅ تم الإرسال بنجاح';
        submitBtn.style.backgroundColor = '#22c55e';
      }
      
      if (result.thankYouUrl) {
        setTimeout(() => {
          window.location.href = result.thankYouUrl;
        }, 2000);
      }
    } else {
      alert('خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.');
    }
    
  } catch (error) {
    console.error('❌ CODFORM: Submission error:', error);
    alert('خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.');
  }
};

// Quantity update function
window.codformUpdateQuantity = function(button, change) {
  const quantityContainer = button.closest('.codform-cart-item');
  if (!quantityContainer) return;
  
  const quantityDisplay = quantityContainer.querySelector('.codform-qty-display');
  if (!quantityDisplay) return;
  
  let currentQuantity = parseInt(quantityDisplay.textContent) || 1;
  let newQuantity = Math.max(1, currentQuantity + change);
  
  quantityDisplay.textContent = newQuantity;
  
  if (window.CodformQuantityOffers && window.CodformQuantityOffers.updateQuantity) {
    window.CodformQuantityOffers.updateQuantity(newQuantity);
  }
};
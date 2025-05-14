// CODForm - Cash on Delivery Form Integration
// Main JS file for Shopify Theme Extension

document.addEventListener('DOMContentLoaded', function() {
  // Find all form containers on the page
  const formContainers = document.querySelectorAll('[data-form-id]');
  
  // If no form containers are found, exit early
  if (!formContainers.length) return;
  
  // Process each form container
  formContainers.forEach(container => {
    const formId = container.getAttribute('data-form-id');
    const productId = container.getAttribute('data-product-id');
    const blockId = container.id;
    const hideHeader = container.getAttribute('data-hide-header') === 'true';
    
    // Get the current shop domain for API requests
    const shopDomain = Shopify ? Shopify.shop : window.location.hostname;
    
    console.log(`Initializing CODForm for form ID: ${formId}, product ID: ${productId}, block ID: ${blockId}, shop: ${shopDomain}`);
    
    // Process form initialization
    initializeForm(container, formId, productId, shopDomain, hideHeader);
  });
});

// Function to initialize the form by fetching form data and rendering it
async function initializeForm(container, formId, productId, shopDomain, hideHeader) {
  // Get elements
  const formElement = container.querySelector('[id^="codform-form-"]');
  const loaderElement = container.querySelector('[id^="codform-form-loader-"]');
  const successElement = container.querySelector('[id^="codform-success-"]');
  const errorElement = container.querySelector('[id^="codform-error-"]');
  const errorMessageElement = container.querySelector('[id^="codform-error-message-"]');
  const errorDetailsElement = container.querySelector('[id^="codform-error-details-"]');
  const retryButton = container.querySelector('[id^="codform-retry-"]');
  
  if (retryButton) {
    retryButton.addEventListener('click', function() {
      // Hide error message and show loader
      errorElement.style.display = 'none';
      loaderElement.style.display = 'block';
      
      // Try to initialize the form again
      initializeForm(container, formId, productId, shopDomain, hideHeader);
    });
  }
  
  try {
    // Show loading state
    if (loaderElement) loaderElement.style.display = 'flex';
    if (formElement) formElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'none';
    if (successElement) successElement.style.display = 'none';
    
    // Fetch form data - use direct URL to the Supabase Edge Function
    let url;
    if (productId) {
      // If we have a product ID, pass it in the query to get a product-specific form
      url = `https://mtyfuwdsshlzqwjujavp.functions.supabase.co/api-forms/${formId}?product_id=${productId}&shop_id=${encodeURIComponent(shopDomain)}`;
    } else {
      // Otherwise just get the specified form
      url = `https://mtyfuwdsshlzqwjujavp.functions.supabase.co/api-forms/${formId}`;
    }
    
    console.log(`Fetching form data from: ${url}`);
    
    // Add timeout for better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', response.status, errorText);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch (e) {
        errorDetails = { error: `HTTP error: ${response.status} ${response.statusText}` };
      }
      
      throw new Error(errorDetails.error || `HTTP error: ${response.status} ${response.statusText}`);
    }
    
    const formData = await response.json();
    console.log('Form data received:', formData);
    
    // Hide loader
    if (loaderElement) loaderElement.style.display = 'none';
    
    // Show form
    if (formElement) {
      formElement.style.display = 'block';
      
      // Render the form
      renderForm(formElement, formData, container, hideHeader, productId);
    }
  } catch (error) {
    console.error('Error loading form:', error);
    
    // Hide loader
    if (loaderElement) loaderElement.style.display = 'none';
    
    // Show error message with more details
    if (errorElement) {
      errorElement.style.display = 'block';
      
      // Set specific error message based on error type
      if (errorMessageElement) {
        if (error.name === 'AbortError') {
          errorMessageElement.textContent = 'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
        } else if (error.message && error.message.includes('Failed to fetch')) {
          errorMessageElement.textContent = 'فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت.';
        } else {
          errorMessageElement.textContent = 'حدث خطأ أثناء تحميل النموذج.';
        }
      }
      
      // Add detailed error message
      if (errorDetailsElement) {
        errorDetailsElement.textContent = `رسالة الخطأ: ${error.message || 'خطأ غير معروف'}`;
        errorDetailsElement.style.display = 'block';
      }
    }
  }
}

// Function to render the form with the fetched data
function renderForm(formElement, formData, container, hideHeader, productId) {
  // Get primary color from form data or use default
  const primaryColor = formData.primaryColor || '#9b87f5';
  const borderRadius = formData.borderRadius || '0.5rem';
  const fontSize = formData.fontSize || '1rem';
  const buttonStyle = formData.buttonStyle || 'rounded';

  // Initialize form HTML
  let formHTML = '';

  // Add form header if not hidden
  if (!hideHeader) {
    formHTML += `
      <div class="codform-header" style="background-color: ${primaryColor};">
        <h3>${formData.title || 'طلب المنتج'}</h3>
        <p>${formData.description || 'يرجى إكمال النموذج التالي لطلب المنتج'}</p>
      </div>
    `;
  }

  // Check for steps in the form
  const hasSteps = formData.fields && formData.fields.some(field => field.type === 'step');
  
  // If form has steps, set up steps container and navigation
  if (hasSteps) {
    const steps = formData.fields.filter(field => field.type === 'step');
    
    // Add steps navigation
    formHTML += '<div class="codform-steps-nav">';
    formHTML += '<div class="codform-step-indicators">';
    
    steps.forEach((step, index) => {
      formHTML += `
        <div class="codform-step-indicator ${index === 0 ? 'codform-step-active' : ''}" data-step-index="${index + 1}">
          ${index + 1}
        </div>
      `;
    });
    
    formHTML += '</div></div>';
    
    // Add steps container
    formHTML += '<div class="codform-steps-container">';
    
    let stepIndex = 0;
    let currentStepFields = [];
    
    // Organize fields by step
    formData.fields.forEach(field => {
      if (field.type === 'step') {
        // Close previous step if not the first
        if (stepIndex > 0) {
          formHTML += `<div class="codform-step" data-step="${stepIndex}" ${stepIndex > 1 ? 'style="display: none;"' : ''}>`;
          formHTML += `<div class="codform-step-title">${field.label || `الخطوة ${stepIndex}`}</div>`;
          
          // Add all fields for this step
          currentStepFields.forEach(stepField => {
            formHTML += renderField(stepField, primaryColor, borderRadius, fontSize);
          });
          
          formHTML += '</div>';
        }
        
        // Start new step
        stepIndex = field.stepIndex + 1;
        currentStepFields = [];
      } else {
        // Add field to current step
        currentStepFields.push(field);
      }
    });
    
    // Close the last step
    if (currentStepFields.length > 0) {
      formHTML += `<div class="codform-step" data-step="${stepIndex}" ${stepIndex > 1 ? 'style="display: none;"' : ''}>`;
      formHTML += `<div class="codform-step-title">${steps[stepIndex - 1]?.label || `الخطوة ${stepIndex}`}</div>`;
      
      // Add all fields for the last step
      currentStepFields.forEach(field => {
        formHTML += renderField(field, primaryColor, borderRadius, fontSize);
      });
      
      formHTML += '</div>';
    }
    
    formHTML += '</div>'; // Close steps container
    
    // Add navigation buttons
    formHTML += `
      <div class="codform-nav-buttons">
        <button type="button" class="codform-prev-button" style="display: none;">السابق</button>
        <button type="button" class="codform-next-button">التالي</button>
        <button type="button" class="codform-submit-button" style="display: none; background-color: ${primaryColor};">إرسال الطلب</button>
      </div>
    `;
  } else {
    // Single step form
    formData.fields.forEach(field => {
      formHTML += renderField(field, primaryColor, borderRadius, fontSize);
    });
    
    // Add submit button if not already in fields
    if (!formData.fields.some(field => field.type === 'submit')) {
      formHTML += `
        <button type="button" class="codform-submit-button" style="background-color: ${primaryColor};">
          إرسال الطلب
        </button>
      `;
    }
  }
  
  // Add validation message area
  formHTML += '<div class="codform-validation-message" style="display: none;"></div>';
  
  // Set the HTML
  formElement.innerHTML = formHTML;
  
  // Set up event listeners for the form
  setupFormEventListeners(formElement, formData, container, productId);
}

// Function to render individual form fields
function renderField(field, primaryColor, borderRadius, fontSize) {
  if (!field || !field.type) return '';
  
  switch (field.type) {
    case 'form-title':
      return `
        <div class="codform-field">
          <div class="codform-header" style="background-color: ${field.style?.backgroundColor || primaryColor};">
            <h3 style="${field.style?.color ? `color: ${field.style.color};` : ''} ${field.style?.fontSize ? `font-size: ${field.style.fontSize};` : ''} ${field.style?.fontWeight ? `font-weight: ${field.style.fontWeight};` : ''} ${field.style?.textAlign ? `text-align: ${field.style.textAlign};` : ''}">${field.label || 'نموذج الطلب'}</h3>
            ${field.helpText ? `<p style="${field.style?.descriptionColor ? `color: ${field.style.descriptionColor};` : ''} ${field.style?.descriptionFontSize ? `font-size: ${field.style.descriptionFontSize};` : ''}">${field.helpText}</p>` : ''}
          </div>
        </div>
      `;
    
    case 'text':
    case 'email':
    case 'phone':
      return `
        <div class="codform-field">
          <label for="${field.id}">
            ${field.label || 'حقل نص'}
            ${field.required ? '<span class="codform-required">*</span>' : ''}
          </label>
          <input
            type="${field.type === 'email' ? 'email' : 'text'}"
            id="${field.id}"
            name="${field.id}"
            placeholder="${field.placeholder || ''}"
            class="codform-input"
            ${field.required ? 'required' : ''}
            style="border-radius: ${borderRadius}; font-size: ${fontSize};"
          />
          ${field.helpText ? `<div class="codform-help-text">${field.helpText}</div>` : ''}
        </div>
      `;
    
    case 'textarea':
      return `
        <div class="codform-field">
          <label for="${field.id}">
            ${field.label || 'نص متعدد الأسطر'}
            ${field.required ? '<span class="codform-required">*</span>' : ''}
          </label>
          <textarea
            id="${field.id}"
            name="${field.id}"
            placeholder="${field.placeholder || ''}"
            class="codform-textarea"
            rows="${field.rows || 4}"
            ${field.required ? 'required' : ''}
            style="border-radius: ${borderRadius}; font-size: ${fontSize};"
          ></textarea>
          ${field.helpText ? `<div class="codform-help-text">${field.helpText}</div>` : ''}
        </div>
      `;
    
    case 'select':
      let options = '';
      if (field.options && Array.isArray(field.options)) {
        field.options.forEach(option => {
          options += `<option value="${option.value}">${option.label}</option>`;
        });
      }
      
      return `
        <div class="codform-field">
          <label for="${field.id}">
            ${field.label || 'قائمة منسدلة'}
            ${field.required ? '<span class="codform-required">*</span>' : ''}
          </label>
          <select
            id="${field.id}"
            name="${field.id}"
            class="codform-select"
            ${field.required ? 'required' : ''}
            style="border-radius: ${borderRadius}; font-size: ${fontSize};"
          >
            <option value="">${field.placeholder || 'اختر...'}</option>
            ${options}
          </select>
          ${field.helpText ? `<div class="codform-help-text">${field.helpText}</div>` : ''}
        </div>
      `;
    
    case 'checkbox':
      let checkboxes = '';
      if (field.options && Array.isArray(field.options)) {
        field.options.forEach(option => {
          checkboxes += `
            <div class="codform-checkbox-container">
              <input
                type="checkbox"
                id="${field.id}_${option.value}"
                name="${field.id}"
                value="${option.value}"
                class="codform-checkbox"
              />
              <label for="${field.id}_${option.value}">${option.label}</label>
            </div>
          `;
        });
      }
      
      return `
        <div class="codform-field">
          <label>
            ${field.label || 'خيارات متعددة'}
            ${field.required ? '<span class="codform-required">*</span>' : ''}
          </label>
          <div class="codform-checkbox-group">
            ${checkboxes}
          </div>
          ${field.helpText ? `<div class="codform-help-text">${field.helpText}</div>` : ''}
        </div>
      `;
    
    case 'radio':
      let radioButtons = '';
      if (field.options && Array.isArray(field.options)) {
        field.options.forEach(option => {
          radioButtons += `
            <div class="codform-radio-container">
              <input
                type="radio"
                id="${field.id}_${option.value}"
                name="${field.id}"
                value="${option.value}"
                class="codform-radio"
                ${field.required ? 'required' : ''}
              />
              <label for="${field.id}_${option.value}">${option.label}</label>
            </div>
          `;
        });
      }
      
      return `
        <div class="codform-field">
          <label>
            ${field.label || 'خيار واحد'}
            ${field.required ? '<span class="codform-required">*</span>' : ''}
          </label>
          <div class="codform-radio-group">
            ${radioButtons}
          </div>
          ${field.helpText ? `<div class="codform-help-text">${field.helpText}</div>` : ''}
        </div>
      `;
    
    case 'submit':
      // Animation classes
      let animationClass = '';
      if (field.style?.animation && field.style.animationType) {
        animationClass = `${field.style.animationType}-animation`;
      }
      
      // Icon positioning
      const iconBefore = field.style?.iconPosition === 'left' ? '↗️ ' : '';
      const iconAfter = field.style?.iconPosition === 'right' ? ' ↗️' : '';
      
      return `
        <button
          type="button"
          class="codform-submit-btn ${animationClass}"
          style="background-color: ${field.style?.backgroundColor || primaryColor}; color: ${field.style?.color || '#ffffff'}; font-size: ${field.style?.fontSize || fontSize}; border-radius: ${borderRadius};"
        >
          ${iconBefore}${field.label || 'إرسال الطلب'}${iconAfter}
        </button>
      `;
    
    case 'text/html':
      return `
        <div class="codform-html-content">
          ${field.content || ''}
        </div>
      `;
    
    case 'whatsapp':
      const whatsappNumber = field.phoneNumber || '';
      const whatsappMessage = encodeURIComponent(field.message || '');
      
      return `
        <a href="https://wa.me/${whatsappNumber}?text=${whatsappMessage}"
           class="codform-whatsapp-button"
           target="_blank"
           style="background-color: ${field.style?.backgroundColor || '#25D366'}; border-radius: ${borderRadius};"
        >
          <svg class="codform-whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          ${field.label || 'تواصل عبر واتساب'}
        </a>
      `;
    
    case 'image':
      return `
        <div class="codform-image-field">
          <div class="codform-image-container">
            <img src="${field.imageUrl || ''}" alt="${field.label || ''}" class="codform-image" />
          </div>
          ${field.label ? `<p>${field.label}</p>` : ''}
        </div>
      `;
    
    case 'cart-items':
      // This is a placeholder - cart items will be populated dynamically
      return `
        <div class="codform-field">
          <h3>${field.label || 'منتجات السلة'}</h3>
          <div class="codform-cart-items" id="codform-cart-items"></div>
        </div>
      `;
    
    case 'cart-summary':
      // This is a placeholder - cart summary will be populated dynamically
      return `
        <div class="codform-field">
          <h3>${field.label || 'ملخص السلة'}</h3>
          <div class="codform-cart-summary" id="codform-cart-summary"></div>
        </div>
      `;
      
    default:
      return '';
  }
}

// Function to set up event listeners for the form
function setupFormEventListeners(formElement, formData, container, productId) {
  const successElement = container.querySelector('[id^="codform-success-"]');
  const formId = formData.id;
  const shopDomain = Shopify ? Shopify.shop : window.location.hostname;
  
  // Get all steps if multi-step form
  const steps = formElement.querySelectorAll('.codform-step');
  const stepIndicators = formElement.querySelectorAll('.codform-step-indicator');
  const prevButton = formElement.querySelector('.codform-prev-button');
  const nextButton = formElement.querySelector('.codform-next-button');
  const submitButtons = formElement.querySelectorAll('.codform-submit-button, .codform-submit-btn');
  const validationMessage = formElement.querySelector('.codform-validation-message');
  
  let currentStep = 1;
  
  // Set up next/prev navigation for multi-step forms
  if (steps.length > 0 && nextButton && prevButton) {
    nextButton.addEventListener('click', function() {
      // Validate current step
      const currentStepElement = formElement.querySelector(`.codform-step[data-step="${currentStep}"]`);
      if (!validateStep(currentStepElement, validationMessage)) {
        return;
      }
      
      // Hide validation message
      validationMessage.style.display = 'none';
      
      // Move to next step
      currentStep++;
      updateStepVisibility();
    });
    
    prevButton.addEventListener('click', function() {
      // Move to previous step
      currentStep--;
      updateStepVisibility();
      
      // Hide validation message
      validationMessage.style.display = 'none';
    });
    
    // Function to update which step is visible
    function updateStepVisibility() {
      // Update step visibility
      steps.forEach((step, index) => {
        if (index + 1 === currentStep) {
          step.style.display = 'block';
        } else {
          step.style.display = 'none';
        }
      });
      
      // Update step indicators
      stepIndicators.forEach((indicator, index) => {
        if (index + 1 === currentStep) {
          indicator.classList.add('codform-step-active');
          indicator.classList.remove('codform-step-completed');
        } else if (index + 1 < currentStep) {
          indicator.classList.remove('codform-step-active');
          indicator.classList.add('codform-step-completed');
        } else {
          indicator.classList.remove('codform-step-active');
          indicator.classList.remove('codform-step-completed');
        }
      });
      
      // Update button visibility
      if (currentStep === 1) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'block';
        submitButtons.forEach(btn => btn.style.display = 'none');
      } else if (currentStep === steps.length) {
        prevButton.style.display = 'block';
        nextButton.style.display = 'none';
        submitButtons.forEach(btn => btn.style.display = 'block');
      } else {
        prevButton.style.display = 'block';
        nextButton.style.display = 'block';
        submitButtons.forEach(btn => btn.style.display = 'none');
      }
    }
  }
  
  // Set up submit button handlers
  submitButtons.forEach(submitButton => {
    submitButton.addEventListener('click', async function() {
      // Validate form
      if (steps.length > 0) {
        const finalStep = formElement.querySelector(`.codform-step[data-step="${steps.length}"]`);
        if (!validateStep(finalStep, validationMessage)) {
          return;
        }
      } else {
        if (!validateForm(formElement, validationMessage)) {
          return;
        }
      }
      
      // Hide validation message
      validationMessage.style.display = 'none';
      
      // Show loading state
      submitButton.classList.add('codform-loading');
      submitButton.disabled = true;
      
      try {
        // Collect form data
        const formFields = {};
        const inputs = formElement.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
          if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) {
              if (!formFields[input.name]) {
                formFields[input.name] = [];
              }
              formFields[input.name].push(input.value);
            }
          } else if (input.name) {
            formFields[input.name] = input.value;
          }
        });
        
        // Add product ID if available
        if (productId) {
          formFields.product_id = productId;
        }
        
        // Submit form data
        const response = await fetch('https://mtyfuwdsshlzqwjujavp.functions.supabase.co/form-submission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg'
          },
          body: JSON.stringify({
            formId: formId,
            shopId: shopDomain,
            data: formFields,
            productId: productId
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Form submission result:', result);
        
        // Hide form and show success message
        formElement.style.display = 'none';
        if (successElement) successElement.style.display = 'block';
        
      } catch (error) {
        console.error('Error submitting form:', error);
        
        // Show error in validation message
        validationMessage.textContent = 'حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.';
        validationMessage.style.display = 'block';
        
      } finally {
        // Reset loading state
        submitButton.classList.remove('codform-loading');
        submitButton.disabled = false;
      }
    });
  });
  
  // Load cart items if needed
  if (formElement.querySelector('#codform-cart-items') || formElement.querySelector('#codform-cart-summary')) {
    loadCartItems(formElement);
  }
}

// Function to validate a specific step in a multi-step form
function validateStep(stepElement, validationMessage) {
  if (!stepElement) return true;
  
  const inputs = stepElement.querySelectorAll('input, textarea, select');
  let isValid = true;
  
  inputs.forEach(input => {
    if (input.hasAttribute('required') && !input.value) {
      isValid = false;
      input.classList.add('codform-field-error');
    } else {
      input.classList.remove('codform-field-error');
    }
    
    // Validate email format if it's an email input
    if (input.type === 'email' && input.value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(input.value)) {
        isValid = false;
        input.classList.add('codform-field-error');
      }
    }
    
    // Validate phone format if it's a phone input
    if (input.name && input.name.includes('phone') && input.value) {
      const phonePattern = /^[0-9+\-\s]{7,15}$/;
      if (!phonePattern.test(input.value)) {
        isValid = false;
        input.classList.add('codform-field-error');
      }
    }
  });
  
  if (!isValid && validationMessage) {
    validationMessage.textContent = 'يرجى إكمال جميع الحقول المطلوبة بشكل صحيح';
    validationMessage.style.display = 'block';
  }
  
  return isValid;
}

// Function to validate the entire form
function validateForm(formElement, validationMessage) {
  const inputs = formElement.querySelectorAll('input, textarea, select');
  let isValid = true;
  
  inputs.forEach(input => {
    if (input.hasAttribute('required') && !input.value) {
      isValid = false;
      input.classList.add('codform-field-error');
    } else {
      input.classList.remove('codform-field-error');
    }
    
    // Validate email format if it's an email input
    if (input.type === 'email' && input.value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(input.value)) {
        isValid = false;
        input.classList.add('codform-field-error');
      }
    }
    
    // Validate phone format if it's a phone input
    if (input.name && input.name.includes('phone') && input.value) {
      const phonePattern = /^[0-9+\-\s]{7,15}$/;
      if (!phonePattern.test(input.value)) {
        isValid = false;
        input.classList.add('codform-field-error');
      }
    }
  });
  
  if (!isValid && validationMessage) {
    validationMessage.textContent = 'يرجى إكمال جميع الحقول المطلوبة بشكل صحيح';
    validationMessage.style.display = 'block';
  }
  
  return isValid;
}

// Function to load cart items from Shopify
async function loadCartItems(formElement) {
  const cartItemsElement = formElement.querySelector('#codform-cart-items');
  const cartSummaryElement = formElement.querySelector('#codform-cart-summary');
  
  if (!cartItemsElement && !cartSummaryElement) return;
  
  try {
    // Fetch current cart
    const response = await fetch('/cart.js');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const cart = await response.json();
    console.log('Cart data:', cart);
    
    // Render cart items if the element exists
    if (cartItemsElement)

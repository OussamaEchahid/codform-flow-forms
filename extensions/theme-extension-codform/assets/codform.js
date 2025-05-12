
// CODFORM - نماذج الدفع عند الاستلام
// This file handles the form loading and submission in the Shopify store

document.addEventListener('DOMContentLoaded', function() {
  // Find all COD form containers on the page
  const containers = document.querySelectorAll('.codform-container');
  
  // Process each container
  containers.forEach(container => {
    initializeForm(container);
  });
  
  // Listen for Shopify section load events (for when sections are dynamically loaded)
  document.addEventListener('shopify:section:load', function(event) {
    const newContainers = event.target.querySelectorAll('.codform-container');
    newContainers.forEach(container => {
      initializeForm(container);
    });
  });

  // تحميل الخط العربي
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap';
  document.head.appendChild(link);
});

// Initialize a single form container
function initializeForm(container) {
  if (!container) return;
  
  // Get form data from container attributes
  const formId = container.getAttribute('data-form-id');
  const productId = container.getAttribute('data-product-id');
  const blockId = container.id.replace('codform-container-', '');
  
  if (!formId) {
    console.error('CODFORM: No form ID specified');
    showError(blockId, 'لم يتم تحديد معرّف النموذج');
    return;
  }
  
  console.log(`CODFORM: Initializing form ${formId} for product ${productId || 'unknown'}`);
  
  // Show loading indicator
  const loaderElement = document.getElementById(`codform-form-loader-${blockId}`);
  if (loaderElement) loaderElement.style.display = 'flex';
  
  // Form container
  const formContainer = document.getElementById(`codform-form-${blockId}`);
  
  // Load the form data
  fetchForm(formId)
    .then(formData => {
      if (!formData) {
        throw new Error('Failed to load form data');
      }
      
      // Hide loader
      if (loaderElement) loaderElement.style.display = 'none';
      
      // Show form
      if (formContainer) {
        formContainer.style.display = 'block';
        renderForm(formContainer, formData, blockId, productId);
      }
    })
    .catch(error => {
      console.error('CODFORM: Error loading form:', error);
      showError(blockId, error.message);
    });
    
  // Set up retry button
  const retryButton = document.getElementById(`codform-retry-${blockId}`);
  if (retryButton) {
    retryButton.addEventListener('click', function() {
      // Hide error
      const errorElement = document.getElementById(`codform-error-${blockId}`);
      if (errorElement) errorElement.style.display = 'none';
      
      // Show loader again
      if (loaderElement) loaderElement.style.display = 'flex';
      
      // Try loading again
      fetchForm(formId)
        .then(formData => {
          // Hide loader
          if (loaderElement) loaderElement.style.display = 'none';
          
          // Show form
          if (formContainer) {
            formContainer.style.display = 'block';
            renderForm(formContainer, formData, blockId, productId);
          }
        })
        .catch(error => {
          console.error('CODFORM: Error reloading form:', error);
          showError(blockId, error.message);
        });
    });
  }
}

// Show error message
function showError(blockId, errorMessage) {
  // Hide loader
  const loaderElement = document.getElementById(`codform-form-loader-${blockId}`);
  if (loaderElement) loaderElement.style.display = 'none';
  
  // Hide form
  const formContainer = document.getElementById(`codform-form-${blockId}`);
  if (formContainer) formContainer.style.display = 'none';
  
  // Show error
  const errorElement = document.getElementById(`codform-error-${blockId}`);
  if (errorElement) {
    errorElement.style.display = 'block';
    const errorText = errorElement.querySelector('p') || errorElement.querySelector('h4');
    if (errorText) {
      errorText.textContent = errorMessage || 'خطأ في تحميل النموذج';
    }
  }
}

// Fetch form data from API
async function fetchForm(formId) {
  try {
    // Create API key header
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';
    
    // Ensure formId is properly formatted
    if (!formId || typeof formId !== 'string') {
      throw new Error('Invalid form ID');
    }
    
    console.log(`CODFORM: Fetching form ${formId}`);
    
    // Create headers with both Authorization and X-API-Key
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', `Bearer ${apiKey}`);
    headers.append('X-API-Key', apiKey);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    
    // Fetch from the API with proper headers
    const response = await fetch(`https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1/api-forms/${formId}?t=${timestamp}&u=${uniqueId}`, {
      method: 'GET',
      headers: headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData && errorData.error 
        ? errorData.error 
        : `API error: ${response.status} - ${response.statusText}`;
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data || data.error) {
      throw new Error(data.error || 'Invalid response from API');
    }
    
    console.log(`CODFORM: Form ${formId} loaded successfully`);
    return data;
  } catch (error) {
    console.error(`CODFORM: Error fetching form ${formId}:`, error);
    throw error;
  }
}

// Submit form data to API
async function submitFormData(formId, data) {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';
  
  try {
    // Create headers with both Authorization and X-API-Key
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', `Bearer ${apiKey}`);
    headers.append('X-API-Key', apiKey);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    
    const response = await fetch(`https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1/api-submissions?t=${timestamp}&u=${uniqueId}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        form_id: formId,
        data: data
      }),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('CODFORM: Error submitting form data:', error);
    throw error;
  }
}

// Check if field type is supported in the store
function isFieldTypeSupported(type) {
  const supportedTypes = [
    'text', 'email', 'phone', 'textarea', 'select', 
    'checkbox', 'radio', 'submit', 'title', 'text/html',
    'image', 'whatsapp', 'cart-items', 'cart-summary', 'form-title'
  ];
  
  return supportedTypes.includes(type);
}

// Render the form with the fetched data
function renderForm(container, formData, blockId, productId) {
  if (!container || !formData) return;
  
  console.log('CODFORM: Rendering form', formData);
  
  // Create actual form element
  const form = document.createElement('form');
  form.id = `form-${blockId}`;
  form.className = 'codform-form-element';
  form.setAttribute('data-form-id', formData.id);
  if (productId) {
    form.setAttribute('data-product-id', productId);
  }
  
  // Primary color styling
  const primaryColor = formData.primaryColor || '#9b87f5';
  const style = document.createElement('style');
  style.textContent = `
    .codform-container .codform-header {
      background-color: ${primaryColor};
    }
    
    .codform-container .codform-button {
      background-color: ${primaryColor};
      color: white;
      border: none;
      border-radius: ${formData.borderRadius || '0.5rem'};
      padding: 0.75rem 1.5rem;
      cursor: pointer;
      font-size: ${formData.fontSize || '1rem'};
      transition: opacity 0.2s;
    }
    
    .codform-container .codform-button:hover {
      opacity: 0.9;
    }
    
    .codform-container input[type="text"],
    .codform-container input[type="tel"],
    .codform-container input[type="email"],
    .codform-container textarea,
    .codform-container select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: ${formData.borderRadius || '0.5rem'};
      font-size: ${formData.fontSize || '1rem'};
      margin-bottom: 1rem;
      font-family: 'Cairo', sans-serif;
    }
    
    .codform-container .codform-submit-btn {
      background-color: ${primaryColor};
      color: white;
      border: none;
      border-radius: ${formData.buttonStyle === 'pill' ? '9999px' : (formData.buttonStyle === 'square' ? '0' : formData.borderRadius || '0.5rem')};
      width: 100%;
      padding: 0.85rem 1.5rem;
      font-weight: bold;
      cursor: pointer;
      font-size: ${formData.fontSize || '1rem'};
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 1rem;
    }
    
    .codform-container .codform-submit-btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .codform-form-element {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    
    .codform-field {
      margin-bottom: 1rem;
    }
    
    .codform-submit {
      text-align: center;
      margin-top: 1rem;
    }
    
    .codform-required {
      color: red;
    }
    
    .codform-error-message {
      color: red;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    /* تحسينات لمحاذاة العنوان */
    .codform-field[data-title-align="center"] h3,
    .codform-field[data-title-align="center"] p {
      text-align: center !important;
    }

    .codform-field[data-title-align="right"] h3,
    .codform-field[data-title-align="right"] p {
      text-align: right !important;
    }

    .codform-field[data-title-align="left"] h3,
    .codform-field[data-title-align="left"] p {
      text-align: left !important;
    }

    /* تنسيق خلفية العنوان */
    .codform-field[data-has-bg="true"] {
      padding: 0 !important;
    }

    .codform-field[data-has-bg="true"] > div {
      padding: 15px !important;
      border-radius: 8px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    /* تحسينات لملخص العربة */
    .codform-cart-summary {
      background-color: #f9fafb !important;
      border-radius: 8px !important;
      padding: 15px !important;
      margin: 15px 0 !important;
      border: 1px solid #e5e7eb !important;
    }
    
    /* تحسينات لعناصر العربة */
    .codform-cart-items {
      border: 1px solid #e5e7eb !important;
      border-radius: 8px !important;
      margin: 15px 0 !important;
    }
    
    .codform-cart-item {
      display: flex !important;
      padding: 15px !important;
      border-bottom: 1px solid #e5e7eb !important;
      align-items: center !important;
    }
    
    /* تحسين صور المنتجات */
    .codform-cart-item img {
      width: 80px !important;
      height: 80px !important;
      border-radius: 4px !important;
      object-fit: cover !important;
      margin-left: 15px !important;
    }
  `;
  
  container.appendChild(style);
  
  // Filter out unsupported field types
  const supportedFields = formData.fields ? formData.fields.filter(field => 
    isFieldTypeSupported(field.type)
  ) : [];
  
  // Check if we have any fields
  if (!supportedFields || supportedFields.length === 0) {
    const noFields = document.createElement('p');
    noFields.className = 'codform-no-fields';
    noFields.innerText = 'لا توجد حقول في هذا النموذج';
    
    container.innerHTML = '';
    container.appendChild(noFields);
    return;
  }
  
  // Process fields and create form inputs
  let currentStep = null;
  let currentStepDiv = null;
  let stepCount = 0;
  
  supportedFields.forEach(field => {
    if (field.type === 'step') {
      // New step - create step container
      currentStep = field;
      stepCount++;
      
      currentStepDiv = document.createElement('div');
      currentStepDiv.className = 'codform-step';
      currentStepDiv.setAttribute('data-step', stepCount);
      currentStepDiv.style.display = stepCount === 1 ? 'block' : 'none';
      
      const stepTitle = document.createElement('h4');
      stepTitle.className = 'codform-step-title';
      stepTitle.innerText = field.label || `الخطوة ${stepCount}`;
      
      currentStepDiv.appendChild(stepTitle);
      form.appendChild(currentStepDiv);
    } else if (field.type) {
      // Regular field - add to current step or directly to form
      const fieldContainer = renderField(field, formData, productId);
      
      if (currentStepDiv) {
        currentStepDiv.appendChild(fieldContainer);
      } else {
        form.appendChild(fieldContainer);
      }
    }
  });
  
  // If we have multiple steps, add navigation buttons
  if (stepCount > 1) {
    const steps = form.querySelectorAll('.codform-step');
    steps.forEach((step, index) => {
      const stepNav = document.createElement('div');
      stepNav.className = 'codform-step-nav';
      
      if (index > 0) {
        // Add previous button
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'codform-button codform-prev-btn';
        prevBtn.innerText = 'السابق';
        prevBtn.addEventListener('click', function() {
          step.style.display = 'none';
          steps[index - 1].style.display = 'block';
        });
        stepNav.appendChild(prevBtn);
      }
      
      if (index < steps.length - 1) {
        // Add next button
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'codform-button codform-next-btn';
        nextBtn.innerText = 'التالي';
        nextBtn.addEventListener('click', function() {
          // Validate current step before proceeding
          const inputs = step.querySelectorAll('input, select, textarea');
          let isValid = true;
          
          inputs.forEach(input => {
            if (input.required && !input.value) {
              isValid = false;
              const errorMsg = input.parentElement.querySelector('.codform-error-message');
              if (!errorMsg) {
                const error = document.createElement('div');
                error.className = 'codform-error-message';
                error.innerText = 'هذا الحقل مطلوب';
                input.parentElement.appendChild(error);
              }
            }
          });
          
          if (isValid) {
            step.style.display = 'none';
            steps[index + 1].style.display = 'block';
          }
        });
        stepNav.appendChild(nextBtn);
      }
      
      if (index === steps.length - 1) {
        // Add submit button on last step
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'codform-button codform-submit-btn';
        
        // Find the submit button field to get its configuration
        const submitField = supportedFields.find(field => field.type === 'submit');
        if (submitField) {
          let btnLabel = submitField.label || 'شراء بخاصية الدفع عند الاستلام';
          submitBtn.innerText = btnLabel;
          
          // Add icon if configured
          if (submitField.style && submitField.style.iconPosition !== undefined) {
            const cartIcon = document.createElement('span');
            cartIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>';
            
            if (submitField.style.iconPosition === 'right') {
              submitBtn.appendChild(document.createTextNode(btnLabel));
              submitBtn.appendChild(cartIcon);
            } else {
              submitBtn.appendChild(cartIcon);
              submitBtn.appendChild(document.createTextNode(btnLabel));
            }
          } else {
            submitBtn.innerText = btnLabel;
          }
          
          // Apply animation class if configured
          if (submitField.style && submitField.style.animation) {
            submitBtn.classList.add(submitField.style.animationType + '-animation');
          }
        } else {
          submitBtn.innerText = 'إرسال';
        }
        
        stepNav.appendChild(submitBtn);
      }
      
      step.appendChild(stepNav);
    });
  } else {
    // Single step form - just add submit button
    const submitContainer = document.createElement('div');
    submitContainer.className = 'codform-submit';
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'codform-submit-btn';
    
    // Find the submit button field to get its configuration
    const submitField = supportedFields.find(field => field.type === 'submit');
    if (submitField) {
      let btnLabel = submitField.label || 'شراء بخاصية الدفع عند الاستلام';
      
      // Add icon if configured
      if (submitField.style && submitField.style.iconPosition !== undefined) {
        const cartIcon = document.createElement('span');
        cartIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>';
        
        if (submitField.style.iconPosition === 'right') {
          submitBtn.appendChild(document.createTextNode(btnLabel));
          submitBtn.appendChild(cartIcon);
        } else {
          submitBtn.appendChild(cartIcon);
          submitBtn.appendChild(document.createTextNode(btnLabel));
        }
      } else {
        submitBtn.innerText = btnLabel;
      }
      
      // Apply animation class if configured
      if (submitField.style && submitField.style.animation) {
        submitBtn.classList.add(submitField.style.animationType + '-animation');
      }
      
      // Apply custom colors if available
      if (submitField.style && submitField.style.backgroundColor) {
        submitBtn.style.backgroundColor = submitField.style.backgroundColor;
      }
      
      if (submitField.style && submitField.style.color) {
        submitBtn.style.color = submitField.style.color;
      }
    } else {
      submitBtn.innerText = 'إرسال';
    }
    
    submitContainer.appendChild(submitBtn);
    form.appendChild(submitContainer);
  }
  
  // Handle form submission
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Show loading state
    const submitBtn = form.querySelector('.codform-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'جاري الإرسال...';
    }
    
    // Gather form data
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    // Add product information if available
    if (productId) {
      data.product_id = productId;
      
      // Try to get product details from the page
      try {
        const productTitle = document.querySelector('.product__title')?.innerText || 
                            document.querySelector('.product-title')?.innerText ||
                            document.querySelector('h1.title')?.innerText;
                            
        const productPrice = document.querySelector('.price')?.innerText ||
                            document.querySelector('.product-price')?.innerText;
                            
        if (productTitle) data.product_title = productTitle;
        if (productPrice) data.product_price = productPrice;
        
        // Get product image if available
        const productImage = document.querySelector('.product__media img')?.src ||
                            document.querySelector('.product-image img')?.src ||
                            document.querySelector('.product-single__photo img')?.src;
                            
        if (productImage) data.product_image = productImage;
      } catch (e) {
        console.error('CODFORM: Error getting product details:', e);
      }
    }
    
    // Send form data
    submitFormData(form.getAttribute('data-form-id'), data)
      .then(response => {
        console.log('CODFORM: Form submitted successfully:', response);
        
        // Hide form
        formContainer.style.display = 'none';
        
        // Show success message
        const successElement = document.getElementById(`codform-success-${blockId}`);
        if (successElement) successElement.style.display = 'block';
      })
      .catch(error => {
        console.error('CODFORM: Error submitting form:', error);
        
        // Reset submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'إرسال';
        }
        
        // Show error message
        alert('حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.');
      });
  });
  
  // Add form to container
  container.innerHTML = '';
  container.appendChild(form);
}

// Render a single form field based on its type
function renderField(field, formData, productId) {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'codform-field';
  fieldDiv.setAttribute('data-field-type', field.type);
  
  // Skip hidden fields from rendering
  if (field.type === 'hidden') {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = field.name || field.id;
    input.value = field.value || '';
    fieldDiv.appendChild(input);
    return fieldDiv;
  }
  
  // Special case for submit button
  if (field.type === 'submit') {
    return fieldDiv; // Skip rendering here, handle in form submission section
  }
  
  // Special case for title field
  if (field.type === 'title' || field.type === 'form-title') {
    const fieldStyle = field.style || {};
    const hasBackground = fieldStyle.backgroundColor && fieldStyle.backgroundColor !== '';
    
    // Set alignment data attribute
    const alignment = fieldStyle.textAlign || 'right'; // Default to right for Arabic
    fieldDiv.setAttribute('data-title-align', alignment);
    
    // Set background data attribute
    fieldDiv.setAttribute('data-has-bg', hasBackground ? 'true' : 'false');

    // Create div for title and description with background
    const titleContainer = document.createElement('div');
    if (hasBackground) {
      titleContainer.style.backgroundColor = fieldStyle.backgroundColor;
      titleContainer.style.padding = '15px';
      titleContainer.style.borderRadius = '8px';
      titleContainer.style.width = '100%';
      titleContainer.style.boxSizing = 'border-box';
    }
    
    const title = document.createElement('h3');
    title.innerText = field.label || '';
    
    // Apply styles directly to title
    if (fieldStyle.color) {
      title.style.color = hasBackground ? '#ffffff' : fieldStyle.color;
    }
    
    if (fieldStyle.fontSize) {
      title.style.fontSize = fieldStyle.fontSize;
    }
    
    if (fieldStyle.fontFamily) {
      title.style.fontFamily = fieldStyle.fontFamily;
    }
    
    if (fieldStyle.fontWeight) {
      title.style.fontWeight = fieldStyle.fontWeight;
    }
    
    if (alignment) {
      title.style.textAlign = alignment;
    }
    
    titleContainer.appendChild(title);
    
    // Add description if available
    if (field.helpText) {
      const description = document.createElement('p');
      description.innerText = field.helpText;
      description.style.color = hasBackground ? '#ffffff' : (fieldStyle.descriptionColor || '#6b7280');
      description.style.fontSize = fieldStyle.descriptionFontSize || '0.875rem';
      description.style.textAlign = alignment;
      titleContainer.appendChild(description);
    }
    
    fieldDiv.appendChild(titleContainer);
    
    return fieldDiv;
  }
  
  // Special case for HTML content
  if (field.type === 'text/html') {
    const htmlContent = document.createElement('div');
    htmlContent.className = 'codform-html-content';
    htmlContent.innerHTML = field.value || '';
    fieldDiv.appendChild(htmlContent);
    return fieldDiv;
  }
  
  // Special case for whatsapp button
  if (field.type === 'whatsapp') {
    const whatsappBtn = document.createElement('a');
    whatsappBtn.className = 'codform-whatsapp-button';
    whatsappBtn.href = `https://wa.me/${field.value}`;
    whatsappBtn.target = '_blank';
    whatsappBtn.rel = 'noopener noreferrer';
    
    const whatsappIcon = document.createElement('span');
    whatsappIcon.className = 'codform-whatsapp-icon';
    whatsappIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
    
    whatsappBtn.appendChild(whatsappIcon);
    whatsappBtn.appendChild(document.createTextNode(field.label || 'تواصل معنا عبر واتساب'));
    
    if (field.style && field.style.backgroundColor) {
      whatsappBtn.style.backgroundColor = field.style.backgroundColor;
    }
    
    fieldDiv.appendChild(whatsappBtn);
    return fieldDiv;
  }
  
  // Special case for image field
  if (field.type === 'image') {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'codform-image-container';
    
    if (field.value) {
      const image = document.createElement('img');
      image.className = 'codform-image';
      image.src = field.value;
      image.alt = field.label || 'Image';
      imageContainer.appendChild(image);
    }
    
    fieldDiv.appendChild(imageContainer);
    
    if (field.label) {
      const caption = document.createElement('p');
      caption.className = 'codform-image-caption';
      caption.innerText = field.label;
      fieldDiv.appendChild(caption);
    }
    
    return fieldDiv;
  }
  
  // Special case for cart items
  if (field.type === 'cart-items') {
    const cartItemsContainer = document.createElement('div');
    cartItemsContainer.className = 'codform-cart-items';
    
    // Add title
    const cartTitle = document.createElement('h3');
    cartTitle.className = 'codform-cart-title';
    cartTitle.innerText = field.label || 'المنتج المختار';
    cartTitle.style.fontSize = field.style?.fontSize || '1.2rem';
    cartTitle.style.color = field.style?.color || '#1f2937';
    
    fieldDiv.appendChild(cartTitle);
    
    // Create cart item from product info
    try {
      const cartItem = document.createElement('div');
      cartItem.className = 'codform-cart-item';
      
      // Try to get product info
      const productTitle = document.querySelector('.product__title')?.innerText || 
                          document.querySelector('.product-title')?.innerText ||
                          document.querySelector('h1.title')?.innerText || 'منتج تجريبي';
                          
      const productPrice = document.querySelector('.price')?.innerText ||
                          document.querySelector('.product-price')?.innerText || '$99.00';
                          
      const productImage = document.querySelector('.product__media img')?.src ||
                          document.querySelector('.product-image img')?.src ||
                          document.querySelector('.product-single__photo img')?.src || 
                          'https://via.placeholder.com/80';
      
      // Create product image
      const img = document.createElement('img');
      img.src = productImage;
      img.alt = productTitle;
      img.className = 'codform-cart-item-image';
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '4px';
      img.style.marginLeft = '15px';
      
      // Create content div
      const contentDiv = document.createElement('div');
      contentDiv.className = 'codform-cart-item-details';
      contentDiv.style.flex = '1';
      
      const title = document.createElement('h4');
      title.className = 'codform-cart-item-title';
      title.innerText = productTitle;
      title.style.fontSize = field.style?.fontSize || '1.1rem';
      title.style.color = field.style?.color || '#1f2937';
      title.style.fontWeight = 'medium';
      title.style.marginBottom = '5px';
      
      const quantity = document.createElement('div');
      quantity.className = 'codform-cart-item-quantity';
      quantity.innerText = 'الكمية: ١';
      quantity.style.fontSize = field.style?.descriptionFontSize || '0.9rem';
      quantity.style.color = field.style?.descriptionColor || '#6b7280';
      quantity.style.marginTop = '0.25rem';
      
      contentDiv.appendChild(title);
      contentDiv.appendChild(quantity);
      
      // Create price div
      const priceDiv = document.createElement('div');
      priceDiv.className = 'codform-cart-item-price';
      priceDiv.style.textAlign = 'right';
      
      const price = document.createElement('div');
      price.innerText = productPrice;
      price.style.fontSize = field.style?.priceFontSize || '1rem';
      price.style.color = field.style?.priceColor || '#1f2937';
      price.style.fontWeight = 'medium';
      
      priceDiv.appendChild(price);
      
      // Append all elements
      cartItem.appendChild(img);
      cartItem.appendChild(contentDiv);
      cartItem.appendChild(priceDiv);
      
      cartItemsContainer.appendChild(cartItem);
      fieldDiv.appendChild(cartItemsContainer);
    } catch (e) {
      console.error('Error creating cart item:', e);
      
      // Fallback cart item
      const fallbackItem = document.createElement('div');
      fallbackItem.className = 'codform-cart-item';
      fallbackItem.innerText = 'منتج تجريبي - $99.00';
      cartItemsContainer.appendChild(fallbackItem);
      fieldDiv.appendChild(cartItemsContainer);
    }
    
    return fieldDiv;
  }
  
  // Special case for cart summary
  if (field.type === 'cart-summary') {
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'codform-cart-summary';
    
    // Add title
    const summaryTitle = document.createElement('h3');
    summaryTitle.className = 'codform-summary-title';
    summaryTitle.innerText = field.label || 'ملخص الطلب';
    summaryTitle.style.fontSize = field.style?.fontSize || '1.2rem';
    summaryTitle.style.color = field.style?.color || '#1f2937';
    summaryTitle.style.marginBottom = '0.75rem';
    
    // Try to get product price
    let productPrice = '';
    try {
      productPrice = document.querySelector('.price')?.innerText ||
                    document.querySelector('.product-price')?.innerText || '$99.00';
    } catch (e) {
      productPrice = '$99.00';
    }
    
    // Create summary content
    const content = document.createElement('div');
    content.className = 'codform-summary-content';
    content.style.backgroundColor = field.style?.backgroundColor || '#f9fafb';
    content.style.borderRadius = '0.5rem';
    content.style.padding = '1rem';
    content.style.border = '1px solid ' + (field.style?.borderColor || '#e5e7eb');
    
    // Subtotal row
    const subtotalRow = document.createElement('div');
    subtotalRow.className = 'codform-cart-summary-row';
    subtotalRow.style.display = 'flex';
    subtotalRow.style.justifyContent = 'space-between';
    subtotalRow.style.marginBottom = '0.75rem';
    
    const subtotalLabel = document.createElement('span');
    subtotalLabel.className = 'codform-cart-summary-label';
    subtotalLabel.innerText = 'المجموع الفرعي';
    subtotalLabel.style.fontSize = field.style?.labelFontSize || '1rem';
    subtotalLabel.style.color = field.style?.labelColor || '#6b7280';
    
    const subtotalValue = document.createElement('span');
    subtotalValue.className = 'codform-cart-summary-value';
    subtotalValue.innerText = productPrice;
    subtotalValue.style.fontSize = field.style?.valueFontSize || '1rem';
    subtotalValue.style.color = field.style?.valueColor || '#1f2937';
    subtotalValue.style.fontWeight = '500';
    
    subtotalRow.appendChild(subtotalLabel);
    subtotalRow.appendChild(subtotalValue);
    
    // Shipping row
    const shippingRow = document.createElement('div');
    shippingRow.className = 'codform-cart-summary-row';
    shippingRow.style.display = 'flex';
    shippingRow.style.justifyContent = 'space-between';
    shippingRow.style.marginBottom = '0.75rem';
    
    const shippingLabel = document.createElement('span');
    shippingLabel.className = 'codform-cart-summary-label';
    shippingLabel.innerText = 'الشحن';
    shippingLabel.style.fontSize = field.style?.labelFontSize || '1rem';
    shippingLabel.style.color = field.style?.labelColor || '#6b7280';
    
    const shippingValue = document.createElement('span');
    shippingValue.className = 'codform-cart-summary-value';
    shippingValue.innerText = '$10.00';
    shippingValue.style.fontSize = field.style?.valueFontSize || '1rem';
    shippingValue.style.color = field.style?.valueColor || '#1f2937';
    shippingValue.style.fontWeight = '500';
    
    shippingRow.appendChild(shippingLabel);
    shippingRow.appendChild(shippingValue);
    
    // Total row
    const totalRow = document.createElement('div');
    totalRow.className = 'codform-cart-summary-row';
    totalRow.style.display = 'flex';
    totalRow.style.justifyContent = 'space-between';
    totalRow.style.marginTop = '0.75rem';
    totalRow.style.paddingTop = '0.75rem';
    totalRow.style.borderTop = '1px solid ' + (field.style?.borderColor || '#e5e7eb');
    
    const totalLabel = document.createElement('span');
    totalLabel.className = 'codform-cart-summary-label';
    totalLabel.innerText = 'الإجمالي';
    totalLabel.style.fontSize = field.style?.totalLabelFontSize || '1.1rem';
    totalLabel.style.color = field.style?.totalLabelColor || '#1f2937';
    totalLabel.style.fontWeight = 'bold';
    
    // Parse price and add shipping
    let totalPrice = '$109.00'; // Default fallback value
    try {
      if (productPrice) {
        // Extract numeric value from price string using regex
        const priceMatch = productPrice.match(/[\d,.]+/);
        if (priceMatch) {
          // Convert the matched string to a number, accounting for commas
          const priceNumber = parseFloat(priceMatch[0].replace(/,/g, ''));
          // Add $10 shipping and format back to currency string
          const total = priceNumber + 10;
          totalPrice = '$' + total.toFixed(2);
        }
      }
    } catch (e) {
      console.error('Error calculating total price:', e);
    }
    
    const totalValue = document.createElement('span');
    totalValue.className = 'codform-cart-summary-value';
    totalValue.innerText = totalPrice;
    totalValue.style.fontSize = field.style?.totalValueFontSize || '1.1rem';
    totalValue.style.color = field.style?.totalValueColor || formData.primaryColor || '#9b87f5';
    totalValue.style.fontWeight = 'bold';
    
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    
    // Assemble all rows
    content.appendChild(subtotalRow);
    content.appendChild(shippingRow);
    content.appendChild(totalRow);
    
    fieldDiv.appendChild(summaryTitle);
    fieldDiv.appendChild(content);
    
    return fieldDiv;
  }
  
  // Create label for standard form fields
  const label = document.createElement('label');
  label.setAttribute('for', field.id);
  label.innerText = field.label || field.name || '';
  
  // Add required indicator if field is required
  if (field.required) {
    const requiredSpan = document.createElement('span');
    requiredSpan.className = 'codform-required';
    requiredSpan.innerText = ' *';
    label.appendChild(requiredSpan);
  }
  
  fieldDiv.appendChild(label);
  
  // Create input based on field type
  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'phone':
    case 'number':
    case 'date':
      const input = document.createElement('input');
      input.type = field.type === 'phone' ? 'tel' : field.type; // Map phone to tel input
      input.id = field.id;
      input.name = field.name || field.id;
      input.placeholder = field.placeholder || '';
      input.required = field.required || false;
      input.style.fontFamily = 'Cairo, sans-serif';
      
      if (field.pattern) {
        input.pattern = field.pattern;
      }
      
      if (field.value) {
        input.value = field.value;
      }
      
      if (field.type === 'number') {
        if (field.min !== undefined) input.min = field.min;
        if (field.max !== undefined) input.max = field.max;
      }
      
      fieldDiv.appendChild(input);
      break;
      
    case 'textarea':
      const textarea = document.createElement('textarea');
      textarea.id = field.id;
      textarea.name = field.name || field.id;
      textarea.placeholder = field.placeholder || '';
      textarea.required = field.required || false;
      textarea.rows = field.rows || 4;
      textarea.style.fontFamily = 'Cairo, sans-serif';
      
      if (field.value) {
        textarea.value = field.value;
      }
      
      fieldDiv.appendChild(textarea);
      break;
      
    case 'select':
      const select = document.createElement('select');
      select.id = field.id;
      select.name = field.name || field.id;
      select.required = field.required || false;
      select.style.fontFamily = 'Cairo, sans-serif';
      
      // Add placeholder option
      if (field.placeholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.innerText = field.placeholder;
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        select.appendChild(placeholderOption);
      }
      
      // Add options
      if (field.options && Array.isArray(field.options)) {
        field.options.forEach(option => {
          const optionElement = document.createElement('option');
          
          // Handle option as string or object
          if (typeof option === 'string') {
            optionElement.value = option;
            optionElement.innerText = option;
          } else {
            optionElement.value = option.value || '';
            optionElement.innerText = option.label || option.value || '';
          }
          
          // Check if this option is selected
          if (field.value === optionElement.value) {
            optionElement.selected = true;
          }
          
          select.appendChild(optionElement);
        });
      }
      
      fieldDiv.appendChild(select);
      break;
      
    case 'checkbox':
    case 'radio':
      // Create container for options
      const optionsContainer = document.createElement('div');
      optionsContainer.className = `codform-${field.type}-group`;
      
      // Add options
      if (field.options && Array.isArray(field.options)) {
        field.options.forEach((option, index) => {
          const optionContainer = document.createElement('div');
          optionContainer.className = `codform-${field.type}-container`;
          
          const optionLabel = document.createElement('label');
          optionLabel.className = `codform-${field.type}-label`;
          
          const optionInput = document.createElement('input');
          optionInput.type = field.type;
          
          // Handle option as string or object
          let optionValue = '';
          let optionText = '';
          
          if (typeof option === 'string') {
            optionValue = option;
            optionText = option;
          } else {
            optionValue = option.value || '';
            optionText = option.label || option.value || '';
          }
          
          optionInput.id = `${field.id}-${index}`;
          optionInput.name = field.name || field.id;
          
          if (field.type === 'checkbox') {
            // For checkboxes, append [] to name to get array of values
            optionInput.name = (field.name || field.id) + '[]';
          }
          
          optionInput.value = optionValue;
          
          // Check if this option is selected
          if (field.value === optionValue || 
              (Array.isArray(field.value) && field.value.includes(optionValue))) {
            optionInput.checked = true;
          }
          
          const optionText2 = document.createTextNode(optionText);
          
          optionLabel.appendChild(optionInput);
          optionLabel.appendChild(optionText2);
          
          optionContainer.appendChild(optionLabel);
          optionsContainer.appendChild(optionContainer);
        });
      }
      
      fieldDiv.appendChild(optionsContainer);
      break;
      
    default:
      const unknownField = document.createElement('p');
      unknownField.innerText = `نوع الحقل غير مدعوم: ${field.type}`;
      fieldDiv.appendChild(unknownField);
  }
  
  return fieldDiv;
}


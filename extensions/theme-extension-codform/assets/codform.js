
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

// Fetch form data from API
async function fetchForm(formId) {
  try {
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';
    
    // Ensure formId is properly formatted
    if (!formId || typeof formId !== 'string') {
      throw new Error('Invalid form ID');
    }
    
    console.log(`CODFORM: Fetching form ${formId}`);
    
    // Fetch from the API
    const response = await fetch(`https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1/api-forms/${formId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
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

// Render the form with the fetched data
function renderForm(container, formData, blockId, productId) {
  if (!container || !formData) return;
  
  console.log('CODFORM: Rendering form', formData.title);
  
  // Create form title
  const formTitle = document.createElement('h3');
  formTitle.className = 'codform-title';
  formTitle.innerText = formData.title;
  
  // Create form description
  const formDesc = document.createElement('p');
  formDesc.className = 'codform-description';
  formDesc.innerText = formData.description || '';
  
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
    }
    
    .codform-container label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
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
  `;
  
  container.appendChild(style);
  
  // Check if we have any fields
  if (!formData.fields || !Array.isArray(formData.fields) || formData.fields.length === 0) {
    const noFields = document.createElement('p');
    noFields.className = 'codform-no-fields';
    noFields.innerText = 'لا توجد حقول في هذا النموذج';
    
    container.innerHTML = '';
    container.appendChild(formTitle);
    container.appendChild(formDesc);
    container.appendChild(noFields);
    return;
  }
  
  // Process fields and create form inputs
  let currentStep = null;
  let currentStepDiv = null;
  let stepCount = 0;
  
  formData.fields.forEach(field => {
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
      const fieldContainer = renderField(field);
      
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
        submitBtn.innerText = 'إرسال';
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
    submitBtn.className = 'codform-button codform-submit-btn';
    submitBtn.innerText = 'إرسال';
    
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
  container.appendChild(formTitle);
  container.appendChild(formDesc);
  container.appendChild(form);
}

// Render a single form field based on its type
function renderField(field) {
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
  
  // Create label
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
    case 'number':
    case 'date':
      const input = document.createElement('input');
      input.type = field.type;
      input.id = field.id;
      input.name = field.name || field.id;
      input.placeholder = field.placeholder || '';
      input.required = field.required || false;
      
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
      
      // Add empty option
      if (!field.required) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.innerText = field.placeholder || 'اختر...';
        select.appendChild(emptyOption);
      }
      
      // Add options
      if (field.options && Array.isArray(field.options)) {
        field.options.forEach(option => {
          const optionEl = document.createElement('option');
          optionEl.value = option.value || option.label;
          optionEl.innerText = option.label;
          optionEl.selected = option.selected || false;
          select.appendChild(optionEl);
        });
      }
      
      fieldDiv.appendChild(select);
      break;
      
    case 'checkbox':
      const checkboxDiv = document.createElement('div');
      checkboxDiv.className = 'codform-checkbox';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = field.id;
      checkbox.name = field.name || field.id;
      checkbox.required = field.required || false;
      checkbox.checked = field.checked || false;
      
      const checkboxLabel = document.createElement('label');
      checkboxLabel.setAttribute('for', field.id);
      checkboxLabel.innerText = field.label || '';
      
      checkboxDiv.appendChild(checkbox);
      checkboxDiv.appendChild(checkboxLabel);
      fieldDiv.appendChild(checkboxDiv);
      break;
      
    case 'radio':
      if (field.options && Array.isArray(field.options)) {
        const radioGroup = document.createElement('div');
        radioGroup.className = 'codform-radio-group';
        
        field.options.forEach((option, idx) => {
          const radioDiv = document.createElement('div');
          radioDiv.className = 'codform-radio';
          
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.id = `${field.id}-${idx}`;
          radio.name = field.name || field.id;
          radio.value = option.value || option.label;
          radio.required = field.required || false;
          radio.checked = option.selected || false;
          
          const radioLabel = document.createElement('label');
          radioLabel.setAttribute('for', `${field.id}-${idx}`);
          radioLabel.innerText = option.label;
          
          radioDiv.appendChild(radio);
          radioDiv.appendChild(radioLabel);
          radioGroup.appendChild(radioDiv);
        });
        
        fieldDiv.appendChild(radioGroup);
      }
      break;
      
    case 'html':
      const htmlDiv = document.createElement('div');
      htmlDiv.className = 'codform-html';
      htmlDiv.innerHTML = field.content || '';
      fieldDiv.appendChild(htmlDiv);
      break;
      
    default:
      // Unknown field type, add as text
      const defaultInput = document.createElement('input');
      defaultInput.type = 'text';
      defaultInput.id = field.id;
      defaultInput.name = field.name || field.id;
      defaultInput.placeholder = field.placeholder || '';
      defaultInput.required = field.required || false;
      
      fieldDiv.appendChild(defaultInput);
  }
  
  // Add description if available
  if (field.description) {
    const description = document.createElement('div');
    description.className = 'codform-description';
    description.innerText = field.description;
    fieldDiv.appendChild(description);
  }
  
  return fieldDiv;
}

// Submit form data to API
async function submitFormData(formId, data) {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';
  
  try {
    const response = await fetch('https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1/api-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        form_id: formId,
        data: data
      })
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

// Show error message in the form container
function showError(blockId, message) {
  console.error('CODFORM Error:', message);
  
  // Hide loader
  const loaderElement = document.getElementById(`codform-form-loader-${blockId}`);
  if (loaderElement) loaderElement.style.display = 'none';
  
  // Show error
  const errorElement = document.getElementById(`codform-error-${blockId}`);
  if (errorElement) {
    const errorMessage = errorElement.querySelector('p');
    if (errorMessage) {
      errorMessage.innerText = message || 'حدث خطأ أثناء تحميل النموذج، يرجى المحاولة مرة أخرى.';
    }
    errorElement.style.display = 'block';
  }
}

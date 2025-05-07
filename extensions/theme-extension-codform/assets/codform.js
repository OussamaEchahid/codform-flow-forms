
// CODFORM - نماذج الدفع عند الاستلام

(function() {
  // مباشرة إلى Edge Function Supabase URL - أكثر موثوقية
  const API_BASE_URL = 'https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1';
  
  // Initialize CODFORM when the DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('CODFORM: Script loaded');
    initCODFORM();
  });
  
  function initCODFORM() {
    const codformContainers = document.querySelectorAll('.codform-container');
    console.log('CODFORM: Found containers:', codformContainers.length);
    
    if (codformContainers.length === 0) {
      console.log('CODFORM: No containers found');
      return;
    }
    
    codformContainers.forEach(container => {
      const formId = container.getAttribute('data-form-id');
      const productId = container.getAttribute('data-product-id');
      
      console.log('CODFORM: Container found with formId:', formId, 'productId:', productId);
      
      if (!formId) {
        console.error('CODFORM: No form ID provided');
        showError(container);
        return;
      }
      
      // Load the form
      loadForm(container, formId, productId);
      
      // Set up retry button
      const retryButton = container.querySelector('.codform-retry');
      if (retryButton) {
        retryButton.addEventListener('click', function() {
          hideError(container);
          showLoader(container);
          loadForm(container, formId, productId);
        });
      }
    });
  }
  
  function loadForm(container, formId, productId) {
    console.log('CODFORM: Loading form', formId);
    const apiUrl = API_BASE_URL + '/api-forms/' + formId;
    
    console.log('CODFORM: Fetching form from:', apiUrl);
    
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    })
      .then(response => {
        console.log('CODFORM: API Response status:', response.status);
        if (!response.ok) {
          throw new Error('Failed to load form: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log('CODFORM: Form data received:', data);
        renderForm(container, data, productId);
      })
      .catch(error => {
        console.error('CODFORM: Error loading form', error);
        showError(container);
      });
  }
  
  function renderForm(container, formData, productId) {
    const formContainer = container.querySelector('.codform-form');
    if (!formContainer) {
      console.error('CODFORM: Form container not found');
      return;
    }
    
    console.log('CODFORM: Rendering form with', formData.fields ? formData.fields.length : 0, 'fields');
    formContainer.innerHTML = ''; // Clear any existing content
    
    // Create form element
    const form = document.createElement('form');
    form.id = 'codform-submission-form-' + formData.id;
    form.className = 'codform-submission-form';
    
    // Add hidden fields for product info
    if (productId) {
      const productIdField = document.createElement('input');
      productIdField.type = 'hidden';
      productIdField.name = 'productId';
      productIdField.value = productId;
      form.appendChild(productIdField);
    }
    
    // Add shop domain if available
    if (typeof Shopify !== 'undefined' && Shopify.shop) {
      const shopDomainField = document.createElement('input');
      shopDomainField.type = 'hidden';
      shopDomainField.name = 'shopDomain';
      shopDomainField.value = Shopify.shop;
      form.appendChild(shopDomainField);
    }
    
    // Group fields by steps if steps are present
    let steps = [];
    let currentStep = 0;
    
    // Check if fields have step information
    const hasSteps = formData.fields && formData.fields.some(field => field.stepId || field.stepIndex !== undefined);
    
    if (hasSteps) {
      // Group fields by step
      const fieldsByStep = {};
      formData.fields.forEach(field => {
        const stepIndex = field.stepIndex || 0;
        if (!fieldsByStep[stepIndex]) {
          fieldsByStep[stepIndex] = {
            title: field.stepTitle || `Step ${stepIndex + 1}`,
            fields: []
          };
        }
        fieldsByStep[stepIndex].fields.push(field);
      });
      
      // Convert to array and sort by step index
      steps = Object.keys(fieldsByStep)
        .map(key => fieldsByStep[key])
        .sort((a, b) => parseInt(a.stepIndex) - parseInt(b.stepIndex));
      
      console.log('CODFORM: Form has multiple steps:', steps.length);
      
      // Add step navigation if multiple steps
      if (steps.length > 1) {
        const stepsNav = document.createElement('div');
        stepsNav.className = 'codform-steps-nav';
        
        const stepIndicators = document.createElement('div');
        stepIndicators.className = 'codform-step-indicators';
        
        steps.forEach((step, idx) => {
          const indicator = document.createElement('div');
          indicator.className = 'codform-step-indicator';
          indicator.dataset.step = idx;
          indicator.textContent = idx + 1;
          if (idx === currentStep) {
            indicator.classList.add('codform-step-active');
          }
          stepIndicators.appendChild(indicator);
        });
        
        stepsNav.appendChild(stepIndicators);
        form.appendChild(stepsNav);
      }
      
      // Create container for step content
      const stepsContainer = document.createElement('div');
      stepsContainer.className = 'codform-steps-container';
      
      // Render first step initially
      const stepContent = renderStepFields(steps[currentStep].fields);
      stepsContainer.appendChild(stepContent);
      form.appendChild(stepsContainer);
      
      // Add step navigation buttons if multiple steps
      if (steps.length > 1) {
        const navButtons = document.createElement('div');
        navButtons.className = 'codform-nav-buttons';
        
        const prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.className = 'codform-prev-button';
        prevButton.textContent = 'السابق';
        prevButton.style.display = 'none'; // Hide initially
        prevButton.addEventListener('click', function() {
          navigateStep(form, -1);
        });
        
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'codform-next-button';
        nextButton.textContent = 'التالي';
        nextButton.addEventListener('click', function() {
          navigateStep(form, 1);
        });
        
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'codform-submit-button';
        submitButton.textContent = 'إرسال الطلب';
        submitButton.style.display = 'none'; // Hide initially
        
        navButtons.appendChild(prevButton);
        navButtons.appendChild(nextButton);
        navButtons.appendChild(submitButton);
        form.appendChild(navButtons);
      } else {
        // Single step form - just add submit button
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'codform-submit-button';
        submitButton.textContent = 'إرسال الطلب';
        form.appendChild(submitButton);
      }
      
      // Set data attribute for current step
      form.dataset.currentStep = currentStep;
      form.dataset.totalSteps = steps.length;
    } else {
      // Render form fields based on formData (single step)
      if (formData.fields && Array.isArray(formData.fields)) {
        formData.fields.forEach(field => {
          renderField(form, field);
        });
      }
      
      // Add submit button for single-step form
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'codform-submit-button';
      submitButton.textContent = 'إرسال الطلب';
      form.appendChild(submitButton);
    }
    
    // Add form submission handler
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      submitForm(container, form, formData.id);
    });
    
    // Add form to container and show it
    formContainer.appendChild(form);
    hideLoader(container);
    showForm(container);
    
    console.log('CODFORM: Form rendered successfully');
  }
  
  function renderStepFields(fields) {
    const stepElement = document.createElement('div');
    stepElement.className = 'codform-step';
    
    fields.forEach(field => {
      renderField(stepElement, field);
    });
    
    return stepElement;
  }
  
  function renderField(container, field) {
    console.log('CODFORM: Rendering field', field.type, field.id, field.label);
    
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-field';
    
    // Apply custom styling if available
    if (field.style) {
      Object.keys(field.style).forEach(key => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase(); // Convert camelCase to dash-case
        fieldContainer.style[key] = field.style[key];
      });
    }
    
    if (field.type === 'text/html' || field.type === 'title') {
      // Handle HTML content or title fields
      if (field.type === 'title') {
        const titleElement = document.createElement('h3');
        titleElement.textContent = field.label;
        if (field.style) {
          Object.keys(field.style).forEach(key => {
            titleElement.style[key] = field.style[key];
          });
        }
        fieldContainer.appendChild(titleElement);
      } else if (field.type === 'text/html' && field.content) {
        const htmlContainer = document.createElement('div');
        htmlContainer.innerHTML = field.content;
        fieldContainer.appendChild(htmlContainer);
      }
    } else {
      // Standard form fields
      const label = document.createElement('label');
      label.htmlFor = 'field_' + field.id;
      label.textContent = field.label;
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = ' *';
        label.appendChild(required);
      }
      fieldContainer.appendChild(label);
      
      let input;
      
      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'phone':
        case 'number':
          input = document.createElement('input');
          input.type = field.type === 'phone' ? 'tel' : field.type;
          input.id = 'field_' + field.id;
          input.name = field.id;
          input.placeholder = field.placeholder || '';
          input.required = field.required || false;
          break;
          
        case 'textarea':
          input = document.createElement('textarea');
          input.id = 'field_' + field.id;
          input.name = field.id;
          input.placeholder = field.placeholder || '';
          input.required = field.required || false;
          input.rows = 4;
          break;
          
        case 'select':
          input = document.createElement('select');
          input.id = 'field_' + field.id;
          input.name = field.id;
          input.required = field.required || false;
          
          // Add empty option
          const emptyOption = document.createElement('option');
          emptyOption.value = '';
          emptyOption.textContent = field.placeholder || 'اختر...';
          input.appendChild(emptyOption);
          
          // Add options
          if (field.options && Array.isArray(field.options)) {
            field.options.forEach(option => {
              const optionElement = document.createElement('option');
              optionElement.value = typeof option === 'object' ? option.value : option;
              optionElement.textContent = typeof option === 'object' ? option.label : option;
              input.appendChild(optionElement);
            });
          }
          break;
          
        case 'checkbox':
          const checkboxContainer = document.createElement('div');
          checkboxContainer.className = 'codform-checkbox-container';
          
          input = document.createElement('input');
          input.type = 'checkbox';
          input.id = 'field_' + field.id;
          input.name = field.id;
          input.required = field.required || false;
          
          const checkboxLabel = document.createElement('label');
          checkboxLabel.htmlFor = 'field_' + field.id;
          checkboxLabel.textContent = field.checkboxLabel || field.label;
          
          checkboxContainer.appendChild(input);
          checkboxContainer.appendChild(checkboxLabel);
          fieldContainer.appendChild(checkboxContainer);
          break;
        
        case 'radio':
          if (field.options && Array.isArray(field.options)) {
            const radioGroup = document.createElement('div');
            radioGroup.className = 'codform-radio-group';
            
            field.options.forEach((option, idx) => {
              const radioContainer = document.createElement('div');
              radioContainer.className = 'codform-radio-container';
              
              const radioInput = document.createElement('input');
              radioInput.type = 'radio';
              radioInput.id = `field_${field.id}_${idx}`;
              radioInput.name = field.id;
              radioInput.value = typeof option === 'object' ? option.value : option;
              radioInput.required = field.required || false;
              
              const radioLabel = document.createElement('label');
              radioLabel.htmlFor = `field_${field.id}_${idx}`;
              radioLabel.textContent = typeof option === 'object' ? option.label : option;
              
              radioContainer.appendChild(radioInput);
              radioContainer.appendChild(radioLabel);
              radioGroup.appendChild(radioContainer);
            });
            
            fieldContainer.appendChild(radioGroup);
          }
          break;
          
        default:
          input = document.createElement('input');
          input.type = 'text';
          input.id = 'field_' + field.id;
          input.name = field.id;
          input.required = field.required || false;
      }
      
      // Apply custom styling to inputs
      if (input && field.style) {
        Object.keys(field.style).forEach(key => {
          input.style[key] = field.style[key];
        });
      }
      
      if (field.type !== 'checkbox' && field.type !== 'radio' && input) {
        fieldContainer.appendChild(input);
      }
      
      if (field.helpText) {
        const helpText = document.createElement('div');
        helpText.className = 'codform-help-text';
        helpText.textContent = field.helpText;
        fieldContainer.appendChild(helpText);
      }
    }
    
    container.appendChild(fieldContainer);
  }
  
  function navigateStep(form, direction) {
    const currentStep = parseInt(form.dataset.currentStep);
    const totalSteps = parseInt(form.dataset.totalSteps);
    const newStep = currentStep + direction;
    
    // Validate before going to next step
    if (direction > 0) {
      // Get all required fields in the current step
      const currentStepElement = form.querySelector('.codform-steps-container .codform-step');
      const requiredFields = currentStepElement.querySelectorAll('[required]');
      let isValid = true;
      
      // Check if all required fields are filled
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('codform-field-error');
        } else {
          field.classList.remove('codform-field-error');
        }
      });
      
      if (!isValid) {
        // Show validation message
        let errorMsg = form.querySelector('.codform-validation-message');
        if (!errorMsg) {
          errorMsg = document.createElement('div');
          errorMsg.className = 'codform-validation-message';
          errorMsg.textContent = 'يرجى ملء جميع الحقول المطلوبة';
          form.querySelector('.codform-steps-container').appendChild(errorMsg);
        }
        return;
      } else {
        // Remove validation message if exists
        const errorMsg = form.querySelector('.codform-validation-message');
        if (errorMsg) {
          errorMsg.remove();
        }
      }
    }
    
    // Check if new step is valid
    if (newStep >= 0 && newStep < totalSteps) {
      // Update current step
      form.dataset.currentStep = newStep;
      
      // Update step indicators
      const indicators = form.querySelectorAll('.codform-step-indicator');
      indicators.forEach((indicator, idx) => {
        if (idx === newStep) {
          indicator.classList.add('codform-step-active');
        } else {
          indicator.classList.remove('codform-step-active');
        }
        
        // Show completed steps
        if (idx < newStep) {
          indicator.classList.add('codform-step-completed');
        } else {
          indicator.classList.remove('codform-step-completed');
        }
      });
      
      // Show/hide navigation buttons
      const prevButton = form.querySelector('.codform-prev-button');
      const nextButton = form.querySelector('.codform-next-button');
      const submitButton = form.querySelector('.codform-submit-button');
      
      prevButton.style.display = newStep > 0 ? 'block' : 'none';
      nextButton.style.display = newStep < totalSteps - 1 ? 'block' : 'none';
      submitButton.style.display = newStep === totalSteps - 1 ? 'block' : 'none';
      
      // Update step content
      const stepsContainer = form.querySelector('.codform-steps-container');
      stepsContainer.innerHTML = '';
      
      // Fetch the fields for the current step
      const matchingFields = Array.from(document.querySelectorAll('.codform-fields-data'))
        .find(el => el.dataset.stepIndex === newStep.toString());
      
      if (matchingFields) {
        const fields = JSON.parse(matchingFields.textContent);
        stepsContainer.appendChild(renderStepFields(fields));
      } else {
        console.error('CODFORM: Could not find fields for step', newStep);
      }
    }
  }
  
  function submitForm(container, form, formId) {
    console.log('CODFORM: Submitting form', formId);
    const formData = new FormData(form);
    const data = {};
    
    // Convert FormData to JSON
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    console.log('CODFORM: Form data to submit:', data);
    
    // Show loading state
    form.classList.add('codform-loading');
    const submitButton = form.querySelector('.codform-submit-button');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'جاري الإرسال...';
    
    const apiUrl = API_BASE_URL + '/api-submissions';
    
    console.log('CODFORM: Submitting form to:', apiUrl);
    
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({
        formId: formId,
        data: data
      }),
    })
      .then(response => {
        console.log('CODFORM: Submit response status:', response.status);
        if (!response.ok) {
          throw new Error('Failed to submit form: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log('CODFORM: Form submitted successfully:', data);
        // Show success message
        hideForm(container);
        showSuccess(container);
      })
      .catch(error => {
        console.error('CODFORM: Error submitting form', error);
        
        // Reset button state
        form.classList.remove('codform-loading');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        
        // Show error message
        alert('حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.');
      });
  }
  
  // Helper functions for showing/hiding elements
  function showLoader(container) {
    const loader = container.querySelector('.codform-loader');
    if (loader) loader.style.display = 'flex';
  }
  
  function hideLoader(container) {
    const loader = container.querySelector('.codform-loader');
    if (loader) loader.style.display = 'none';
  }
  
  function showForm(container) {
    const form = container.querySelector('.codform-form');
    if (form) form.style.display = 'block';
  }
  
  function hideForm(container) {
    const form = container.querySelector('.codform-form');
    if (form) form.style.display = 'none';
  }
  
  function showSuccess(container) {
    const success = container.querySelector('.codform-success');
    if (success) success.style.display = 'block';
  }
  
  function hideSuccess(container) {
    const success = container.querySelector('.codform-success');
    if (success) success.style.display = 'none';
  }
  
  function showError(container) {
    hideLoader(container);
    const error = container.querySelector('.codform-error');
    if (error) error.style.display = 'block';
  }
  
  function hideError(container) {
    const error = container.querySelector('.codform-error');
    if (error) error.style.display = 'none';
  }
})();

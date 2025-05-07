
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
    
    console.log('CODFORM: Rendering form');
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
    
    // Render form fields based on formData
    if (formData.fields && Array.isArray(formData.fields)) {
      formData.fields.forEach(field => {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'codform-field';
        
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
          case 'number':
            input = document.createElement('input');
            input.type = field.type;
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
                optionElement.value = option.value;
                optionElement.textContent = option.label;
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
            
          default:
            input = document.createElement('input');
            input.type = 'text';
            input.id = 'field_' + field.id;
            input.name = field.id;
            input.required = field.required || false;
        }
        
        if (field.type !== 'checkbox') {
          fieldContainer.appendChild(input);
        }
        
        if (field.helpText) {
          const helpText = document.createElement('div');
          helpText.className = 'codform-help-text';
          helpText.textContent = field.helpText;
          fieldContainer.appendChild(helpText);
        }
        
        form.appendChild(fieldContainer);
      });
    }
    
    // Add submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'codform-submit-button';
    submitButton.textContent = 'إرسال الطلب';
    form.appendChild(submitButton);
    
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

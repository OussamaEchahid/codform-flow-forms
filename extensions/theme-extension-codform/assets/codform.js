
document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  const API_URL_BASE = 'https://mtyfuwdsshlzqwjujavp.functions.supabase.co';
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // milliseconds
  
  // Log startup
  console.log('COD Form Script loaded');
  
  // Initialize all form containers
  initializeForms();
  
  // Main initialization function
  function initializeForms() {
    const containers = document.querySelectorAll('.codform-container');
    if (containers.length === 0) {
      console.log('No COD form containers found on page');
      return;
    }
    
    console.log(`Found ${containers.length} COD form containers`);
    
    containers.forEach(container => {
      initializeFormContainer(container);
    });
  }
  
  // Initialize a single form container
  function initializeFormContainer(container) {
    const blockId = container.id.replace('codform-container-', '');
    const productId = container.dataset.productId;
    const shopDomain = Shopify ? Shopify.shop : window.location.hostname;
    const hideHeader = container.dataset.hideHeader === 'true';
    
    console.log(`Initializing form block ${blockId} for product ${productId} on shop ${shopDomain}`);
    
    // Get the form loading, form display, success, and error elements
    const formLoader = document.getElementById(`codform-form-loader-${blockId}`);
    const formElement = document.getElementById(`codform-form-${blockId}`);
    const successElement = document.getElementById(`codform-success-${blockId}`);
    const errorElement = document.getElementById(`codform-error-${blockId}`);
    const retryButton = document.getElementById(`codform-retry-${blockId}`);
    
    if (!formLoader || !formElement || !successElement || !errorElement) {
      console.error('Required form elements not found for block', blockId);
      return;
    }
    
    // Add retry functionality
    if (retryButton) {
      retryButton.addEventListener('click', function() {
        errorElement.style.display = 'none';
        formLoader.style.display = 'flex';
        loadForm(0);
      });
    }
    
    // Show loader
    formLoader.style.display = 'flex';
    formElement.style.display = 'none';
    successElement.style.display = 'none';
    errorElement.style.display = 'none';
    
    // Load the form with retry capability
    function loadForm(retryCount = 0) {
      fetchCodForm(shopDomain, productId, blockId, retryCount)
        .then(data => {
          if (data.error || (!data.form && !data)) {
            throw new Error(data.error || 'Failed to fetch form data');
          }
          
          const formData = data.form || data;
          console.log(`Form data retrieved successfully for block ${blockId}`);
          
          // Render the form
          renderForm(formData, formElement, hideHeader);
          
          // Show the form
          formLoader.style.display = 'none';
          formElement.style.display = 'block';
        })
        .catch(error => {
          console.error(`Error loading form (attempt ${retryCount + 1}):`, error);
          
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying form fetch (${retryCount + 1}/${MAX_RETRIES})...`);
            setTimeout(() => loadForm(retryCount + 1), RETRY_DELAY);
          } else {
            console.error('Maximum retry attempts reached, showing error message');
            formLoader.style.display = 'none';
            errorElement.style.display = 'block';
          }
        });
    }
    
    // Start loading the form
    loadForm();
  }
  
  // Function to fetch form data
  function fetchCodForm(shopDomain, productId, blockId, retryCount = 0) {
    const timestamp = Date.now();
    const apiUrl = productId 
      ? `${API_URL_BASE}/forms-product?shop=${shopDomain}&productId=${productId}&_t=${timestamp}`
      : `${API_URL_BASE}/forms-default?shop=${shopDomain}&_t=${timestamp}`;
    
    console.log(`Fetching form from: ${apiUrl} (attempt ${retryCount + 1})`);
    
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache',
        'Shop': shopDomain
      }
    };
    
    // Add extra headers for retry attempts
    if (retryCount > 0) {
      fetchOptions.headers['X-Retry-Count'] = retryCount.toString();
      fetchOptions.headers['X-Request-ID'] = `req_${Math.random().toString(36).substring(2, 10)}`;
      fetchOptions.cache = 'no-store';
    }
    
    return fetch(apiUrl, fetchOptions)
      .then(response => {
        if (!response.ok) {
          console.error(`HTTP error ${response.status} fetching form data:`, response);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data) {
          throw new Error('Empty response received');
        }
        if (data.error) {
          console.error('Error in form data:', data.error);
          throw new Error(data.error);
        }
        return data;
      })
      .catch(error => {
        console.error('Error fetching form:', error);
        throw error;
      });
  }
  
  // Function to render the form
  function renderForm(formData, formElement, hideHeader) {
    if (!formData || !formElement) return;
    
    const form = formData;
    const style = form.style || {
      primaryColor: form.primaryColor || '#9b87f5',
      fontSize: form.fontSize || '1rem',
      borderRadius: form.borderRadius || '0.5rem',
      buttonStyle: form.buttonStyle || 'rounded'
    };
    
    // Set form container styles
    formElement.innerHTML = ''; // Clear previous content
    
    // Create the form header if not hidden
    if (!hideHeader && form.title) {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'codform-header';
      headerDiv.style.backgroundColor = style.primaryColor;
      
      const title = document.createElement('h3');
      title.innerText = form.title;
      
      const description = document.createElement('p');
      description.innerText = form.description || '';
      
      headerDiv.appendChild(title);
      if (form.description) headerDiv.appendChild(description);
      formElement.appendChild(headerDiv);
    }
    
    // Parse the form data
    const formSteps = Array.isArray(form.data) ? form.data : [];
    
    if (formSteps.length > 0) {
      // Create form element
      const formEl = document.createElement('form');
      formEl.className = 'codform-form';
      formEl.id = `form-${form.id}`;
      
      // Add the first step fields
      const firstStep = formSteps[0];
      if (firstStep && Array.isArray(firstStep.fields)) {
        firstStep.fields.forEach(field => {
          formEl.appendChild(createFormField(field, style));
        });
      }
      
      // Add submit button
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'codform-submit-button codform-submit-btn';
      submitButton.innerText = form.submitbuttontext || 'إرسال الطلب';
      submitButton.style.backgroundColor = style.primaryColor;
      
      formEl.appendChild(submitButton);
      
      // Handle form submission
      formEl.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmission(e.target, form, formElement.parentNode);
      });
      
      formElement.appendChild(formEl);
    } else {
      // Display error if no form steps
      const errorDiv = document.createElement('div');
      errorDiv.className = 'codform-error';
      errorDiv.innerText = 'لم يتم العثور على حقول في هذا النموذج';
      formElement.appendChild(errorDiv);
    }
  }
  
  // Create a form field based on its type
  function createFormField(field, style) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'codform-field';
    
    if (field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number') {
      // Text, email, phone, number inputs
      const label = document.createElement('label');
      label.htmlFor = field.id;
      label.innerText = field.label || '';
      
      if (field.required) {
        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'codform-required';
        requiredSpan.innerText = '*';
        label.appendChild(requiredSpan);
      }
      
      const input = document.createElement('input');
      input.type = field.type === 'tel' ? 'tel' : field.type;
      input.id = field.id;
      input.name = field.id;
      input.placeholder = field.placeholder || '';
      input.required = field.required === true;
      
      if (field.type === 'tel') {
        input.pattern = field.pattern || '[0-9]{9,15}';
      }
      
      fieldDiv.appendChild(label);
      fieldDiv.appendChild(input);
      
      if (field.help) {
        const helpText = document.createElement('div');
        helpText.className = 'codform-help-text';
        helpText.innerText = field.help;
        fieldDiv.appendChild(helpText);
      }
    } else if (field.type === 'textarea') {
      // Textarea
      const label = document.createElement('label');
      label.htmlFor = field.id;
      label.innerText = field.label || '';
      
      if (field.required) {
        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'codform-required';
        requiredSpan.innerText = '*';
        label.appendChild(requiredSpan);
      }
      
      const textarea = document.createElement('textarea');
      textarea.id = field.id;
      textarea.name = field.id;
      textarea.placeholder = field.placeholder || '';
      textarea.required = field.required === true;
      textarea.rows = field.rows || 4;
      
      fieldDiv.appendChild(label);
      fieldDiv.appendChild(textarea);
      
      if (field.help) {
        const helpText = document.createElement('div');
        helpText.className = 'codform-help-text';
        helpText.innerText = field.help;
        fieldDiv.appendChild(helpText);
      }
    } else if (field.type === 'checkbox' && Array.isArray(field.options)) {
      // Checkbox group
      const label = document.createElement('label');
      label.innerText = field.label || '';
      
      if (field.required) {
        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'codform-required';
        requiredSpan.innerText = '*';
        label.appendChild(requiredSpan);
      }
      
      fieldDiv.appendChild(label);
      
      field.options.forEach(option => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'codform-checkbox-container';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${field.id}-${option.value}`;
        checkbox.name = field.id;
        checkbox.value = option.value;
        checkbox.required = false; // Individual checkboxes are not required
        
        const checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = `${field.id}-${option.value}`;
        checkboxLabel.innerText = option.label || option.value;
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(checkboxLabel);
        fieldDiv.appendChild(checkboxContainer);
      });
      
      if (field.help) {
        const helpText = document.createElement('div');
        helpText.className = 'codform-help-text';
        helpText.innerText = field.help;
        fieldDiv.appendChild(helpText);
      }
    } else if (field.type === 'radio' && Array.isArray(field.options)) {
      // Radio group
      const label = document.createElement('label');
      label.innerText = field.label || '';
      
      if (field.required) {
        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'codform-required';
        requiredSpan.innerText = '*';
        label.appendChild(requiredSpan);
      }
      
      fieldDiv.appendChild(label);
      
      const radioGroup = document.createElement('div');
      radioGroup.className = 'codform-radio-group';
      
      field.options.forEach(option => {
        const radioContainer = document.createElement('div');
        radioContainer.className = 'codform-radio-container';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = `${field.id}-${option.value}`;
        radio.name = field.id;
        radio.value = option.value;
        radio.required = field.required === true;
        
        const radioLabel = document.createElement('label');
        radioLabel.htmlFor = `${field.id}-${option.value}`;
        radioLabel.innerText = option.label || option.value;
        
        radioContainer.appendChild(radio);
        radioContainer.appendChild(radioLabel);
        radioGroup.appendChild(radioContainer);
      });
      
      fieldDiv.appendChild(radioGroup);
      
      if (field.help) {
        const helpText = document.createElement('div');
        helpText.className = 'codform-help-text';
        helpText.innerText = field.help;
        fieldDiv.appendChild(helpText);
      }
    } else if (field.type === 'select' && Array.isArray(field.options)) {
      // Select dropdown
      const label = document.createElement('label');
      label.htmlFor = field.id;
      label.innerText = field.label || '';
      
      if (field.required) {
        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'codform-required';
        requiredSpan.innerText = '*';
        label.appendChild(requiredSpan);
      }
      
      const select = document.createElement('select');
      select.id = field.id;
      select.name = field.id;
      select.required = field.required === true;
      
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.innerText = field.placeholder || 'اختر...';
      defaultOption.disabled = true;
      defaultOption.selected = true;
      select.appendChild(defaultOption);
      
      field.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.innerText = option.label || option.value;
        select.appendChild(optionElement);
      });
      
      fieldDiv.appendChild(label);
      fieldDiv.appendChild(select);
      
      if (field.help) {
        const helpText = document.createElement('div');
        helpText.className = 'codform-help-text';
        helpText.innerText = field.help;
        fieldDiv.appendChild(helpText);
      }
    } else if (field.type === 'title' || field.type === 'form-title') {
      // Title field
      const title = document.createElement(field.type === 'title' ? 'h3' : 'h2');
      title.innerText = field.text || field.label || '';
      title.style.color = style.primaryColor;
      fieldDiv.appendChild(title);
    }
    
    return fieldDiv;
  }
  
  // Handle form submission
  function handleFormSubmission(form, formData, containerElement) {
    if (!form || !formData || !containerElement) return;
    
    const formLoader = containerElement.querySelector('.codform-form-container .codform-loader');
    const formElement = containerElement.querySelector('.codform-form-container .codform-form');
    const successElement = containerElement.querySelector('.codform-form-container .codform-success');
    const errorElement = containerElement.querySelector('.codform-form-container .codform-error');
    
    if (!formLoader || !formElement || !successElement || !errorElement) {
      console.error('Required elements not found for form submission');
      return;
    }
    
    // Collect form data
    const formValues = {};
    const formElements = form.elements;
    
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      if (element.name && element.name !== '') {
        if (element.type === 'checkbox') {
          if (element.checked) {
            if (!formValues[element.name]) {
              formValues[element.name] = [];
            }
            formValues[element.name].push(element.value);
          }
        } else if (element.type === 'radio') {
          if (element.checked) {
            formValues[element.name] = element.value;
          }
        } else if (element.name !== '') {
          formValues[element.name] = element.value;
        }
      }
    }
    
    // Add metadata to form submission
    const metadata = {
      shop: Shopify ? Shopify.shop : window.location.hostname,
      submitted_at: new Date().toISOString(),
      form_id: formData.id,
      form_title: formData.title,
      page_url: window.location.href,
      product_id: containerElement.dataset.productId
    };
    
    const submissionData = {
      form_id: formData.id,
      shop_id: metadata.shop,
      data: {
        values: formValues,
        metadata
      }
    };
    
    console.log('Submitting form:', submissionData);
    
    // Show loading state
    formElement.style.display = 'none';
    formLoader.style.display = 'flex';
    
    // Send form data to backend
    fetch(`${API_URL_BASE}/api-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Shop': metadata.shop
      },
      body: JSON.stringify(submissionData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(response => {
      // Show success message
      formLoader.style.display = 'none';
      successElement.style.display = 'block';
      console.log('Form submitted successfully:', response);
    })
    .catch(error => {
      // Show error message
      formLoader.style.display = 'none';
      errorElement.style.display = 'block';
      console.error('Error submitting form:', error);
    });
  }
});

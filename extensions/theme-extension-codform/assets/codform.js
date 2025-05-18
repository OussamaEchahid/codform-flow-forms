
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
      headerDiv.style.backgroundColor = style.primaryColor || '#9b87f5';
      
      const title = document.createElement('h3');
      title.innerText = form.title;
      
      headerDiv.appendChild(title);
      
      // Add description if it exists
      if (form.description) {
        const description = document.createElement('p');
        description.innerText = form.description;
        description.className = 'codform-description';
        headerDiv.appendChild(description);
      }
      
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
          const fieldElement = createFormField(field, style);
          if (fieldElement) {
            formEl.appendChild(fieldElement);
          }
        });
      }
      
      // Add submit button if not present in fields
      const hasSubmitButton = firstStep && Array.isArray(firstStep.fields) && 
                             firstStep.fields.some(field => field.type === 'submit');
      
      if (!hasSubmitButton) {
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'codform-submit-button codform-submit-btn';
        submitButton.innerText = form.submitbuttontext || 'إرسال الطلب';
        submitButton.style.backgroundColor = style.primaryColor || '#9b87f5';
        
        // Add animation classes if specified
        if (form.submitButtonAnimation) {
          submitButton.classList.add(`${form.submitButtonAnimation}-animation`);
        }
        
        formEl.appendChild(submitButton);
      }
      
      // Handle form submission
      formEl.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmission(e.target, form, formElement.parentNode);
      });
      
      formElement.appendChild(formEl);
      
      // Add floating button if configured
      if (form.floatingButton && form.floatingButton.enabled) {
        createFloatingButton(form.floatingButton, style);
      }
    } else {
      // Display error if no form steps
      const errorDiv = document.createElement('div');
      errorDiv.className = 'codform-error';
      errorDiv.innerText = 'لم يتم العثور على حقول في هذا النموذج';
      formElement.appendChild(errorDiv);
    }
  }
  
  // Create a floating button
  function createFloatingButton(config, style) {
    // Remove any existing floating button
    const existingButton = document.querySelector('.codform-floating-button-container');
    if (existingButton) {
      existingButton.remove();
    }
    
    if (!config || !config.enabled) return;
    
    const floatingContainer = document.createElement('div');
    floatingContainer.className = 'codform-floating-button-container';
    
    const floatingButton = document.createElement('a');
    floatingButton.className = 'codform-floating-button';
    floatingButton.href = config.link || '#';
    
    // Set button styles
    floatingButton.style.backgroundColor = config.backgroundColor || style.primaryColor || '#9b87f5';
    floatingButton.style.color = config.textColor || '#ffffff';
    floatingButton.style.borderRadius = config.shape === 'pill' ? '9999px' : (config.shape === 'square' ? '0px' : '8px');
    floatingButton.style.fontSize = config.fontSize || '1rem';
    
    // Add icon if specified
    if (config.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'codform-floating-button-icon';
      iconSpan.innerHTML = config.icon;
      floatingButton.appendChild(iconSpan);
    }
    
    // Add text
    const textSpan = document.createElement('span');
    textSpan.innerText = config.text || 'اضغط هنا';
    floatingButton.appendChild(textSpan);
    
    // Add animation if specified
    if (config.animation) {
      floatingButton.classList.add(`${config.animation}-animation`);
    }
    
    floatingContainer.appendChild(floatingButton);
    document.body.appendChild(floatingContainer);
  }
  
  // Create a form field based on its type
  function createFormField(field, style) {
    if (!field || !field.type) {
      console.warn('Invalid field:', field);
      return null;
    }
    
    console.log(`Creating field of type: ${field.type}`, field);
    
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'codform-field';
    fieldDiv.setAttribute('data-field-type', field.type);

    // Handle different field types
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'phone':
      case 'number':
        return createInputField(field, style, fieldDiv);
      
      case 'textarea':
        return createTextareaField(field, style, fieldDiv);
      
      case 'radio':
        return createRadioField(field, style, fieldDiv);
      
      case 'checkbox':
        return createCheckboxField(field, style, fieldDiv);
      
      case 'select':
        return createSelectField(field, style, fieldDiv);
      
      case 'title':
      case 'form-title':
        return createTitleField(field, style, fieldDiv);
      
      case 'image':
        return createImageField(field, style, fieldDiv);
      
      case 'whatsapp':
        return createWhatsAppButton(field, style, fieldDiv);
      
      case 'cart-items':
        return createCartItems(field, style, fieldDiv);
      
      case 'cart-summary':
        return createCartSummary(field, style, fieldDiv);
      
      case 'text/html':
        return createHtmlContent(field, style, fieldDiv);
      
      case 'submit':
        return createSubmitButton(field, style, fieldDiv);
      
      default:
        console.warn(`Unsupported field type: ${field.type}`);
        return null;
    }
  }
  
  // Create input field (text, email, tel, number)
  function createInputField(field, style, container) {
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
    // Convert 'phone' type to 'tel' for better mobile handling
    input.type = field.type === 'phone' ? 'tel' : field.type;
    input.id = field.id;
    input.name = field.id;
    input.placeholder = field.placeholder || '';
    input.required = field.required === true;
    
    // Apply field-specific styles if available
    if (field.style) {
      if (field.style.borderColor) input.style.borderColor = field.style.borderColor;
      if (field.style.backgroundColor) input.style.backgroundColor = field.style.backgroundColor;
      if (field.style.color) input.style.color = field.style.color;
      if (field.style.fontSize) input.style.fontSize = field.style.fontSize;
      if (field.style.borderRadius) input.style.borderRadius = field.style.borderRadius;
    }
    
    container.appendChild(label);
    container.appendChild(input);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.innerText = field.helpText;
      container.appendChild(helpText);
    }
    
    return container;
  }
  
  // Create textarea field
  function createTextareaField(field, style, container) {
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
    
    // Apply field-specific styles if available
    if (field.style) {
      if (field.style.borderColor) textarea.style.borderColor = field.style.borderColor;
      if (field.style.backgroundColor) textarea.style.backgroundColor = field.style.backgroundColor;
      if (field.style.color) textarea.style.color = field.style.color;
      if (field.style.fontSize) textarea.style.fontSize = field.style.fontSize;
      if (field.style.borderRadius) textarea.style.borderRadius = field.style.borderRadius;
    }
    
    container.appendChild(label);
    container.appendChild(textarea);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.innerText = field.helpText;
      container.appendChild(helpText);
    }
    
    return container;
  }
  
  // Create radio button group
  function createRadioField(field, style, container) {
    const label = document.createElement('label');
    label.innerText = field.label || '';
    
    if (field.required) {
      const requiredSpan = document.createElement('span');
      requiredSpan.className = 'codform-required';
      requiredSpan.innerText = '*';
      label.appendChild(requiredSpan);
    }
    
    container.appendChild(label);
    
    const radioGroup = document.createElement('div');
    radioGroup.className = 'codform-radio-group';
    
    if (Array.isArray(field.options)) {
      field.options.forEach(option => {
        const radioContainer = document.createElement('div');
        radioContainer.className = 'codform-radio-container';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = `${field.id}-${option.value}`;
        radio.name = field.id;
        radio.value = option.value;
        radio.required = field.required === true;
        
        // Apply accent color if specified
        if (field.style && field.style.color) {
          radio.style.accentColor = field.style.color;
        } else if (style.primaryColor) {
          radio.style.accentColor = style.primaryColor;
        }
        
        const radioLabel = document.createElement('label');
        radioLabel.htmlFor = `${field.id}-${option.value}`;
        radioLabel.innerText = option.label || option.value;
        
        // Apply text color if specified
        if (field.style && field.style.color) {
          radioLabel.style.color = field.style.color;
        }
        
        radioContainer.appendChild(radio);
        radioContainer.appendChild(radioLabel);
        radioGroup.appendChild(radioContainer);
      });
    }
    
    container.appendChild(radioGroup);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.innerText = field.helpText;
      container.appendChild(helpText);
    }
    
    return container;
  }
  
  // Create checkbox group
  function createCheckboxField(field, style, container) {
    const label = document.createElement('label');
    label.innerText = field.label || '';
    
    if (field.required) {
      const requiredSpan = document.createElement('span');
      requiredSpan.className = 'codform-required';
      requiredSpan.innerText = '*';
      label.appendChild(requiredSpan);
    }
    
    container.appendChild(label);
    
    if (Array.isArray(field.options)) {
      field.options.forEach(option => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'codform-checkbox-container';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${field.id}-${option.value}`;
        checkbox.name = field.id;
        checkbox.value = option.value;
        
        // Apply accent color if specified
        if (field.style && field.style.color) {
          checkbox.style.accentColor = field.style.color;
        } else if (style.primaryColor) {
          checkbox.style.accentColor = style.primaryColor;
        }
        
        const checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = `${field.id}-${option.value}`;
        checkboxLabel.innerText = option.label || option.value;
        
        // Apply text color if specified
        if (field.style && field.style.color) {
          checkboxLabel.style.color = field.style.color;
        }
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(checkboxLabel);
        container.appendChild(checkboxContainer);
      });
    }
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.innerText = field.helpText;
      container.appendChild(helpText);
    }
    
    return container;
  }
  
  // Create select dropdown
  function createSelectField(field, style, container) {
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
    
    // Apply field-specific styles if available
    if (field.style) {
      if (field.style.borderColor) select.style.borderColor = field.style.borderColor;
      if (field.style.backgroundColor) select.style.backgroundColor = field.style.backgroundColor;
      if (field.style.color) select.style.color = field.style.color;
      if (field.style.fontSize) select.style.fontSize = field.style.fontSize;
      if (field.style.borderRadius) select.style.borderRadius = field.style.borderRadius;
    }
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.innerText = field.placeholder || 'اختر...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    if (Array.isArray(field.options)) {
      field.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.innerText = option.label || option.value;
        select.appendChild(optionElement);
      });
    }
    
    container.appendChild(label);
    container.appendChild(select);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.innerText = field.helpText;
      container.appendChild(helpText);
    }
    
    return container;
  }
  
  // Create title field
  function createTitleField(field, style, container) {
    const titleContainer = document.createElement('div');
    titleContainer.className = field.type === 'form-title' ? 'codform-title-container' : 'codform-subtitle-container';
    
    // Apply styling attributes to container
    const hasBackground = !!(field.style && field.style.backgroundColor);
    
    if (hasBackground) {
      titleContainer.style.backgroundColor = field.style.backgroundColor;
      titleContainer.style.padding = '16px';
      titleContainer.style.borderRadius = style.borderRadius || '8px';
    }
    
    // Create title element
    const title = document.createElement(field.type === 'title' ? 'h3' : 'h2');
    title.innerText = field.label || field.text || '';
    
    // Apply all styling from field.style
    if (field.style) {
      if (field.style.color) title.style.color = field.style.color;
      if (field.style.fontSize) title.style.fontSize = field.style.fontSize;
      if (field.style.fontWeight) title.style.fontWeight = field.style.fontWeight;
      if (field.style.textAlign) title.style.textAlign = field.style.textAlign;
      if (field.style.fontFamily) title.style.fontFamily = field.style.fontFamily;
    }
    
    titleContainer.appendChild(title);
    
    // Add description if provided
    if (field.helpText) {
      const description = document.createElement('p');
      description.innerText = field.helpText;
      description.className = 'codform-field-description';
      
      // Apply styling to description
      if (field.style) {
        if (field.style.descriptionColor) description.style.color = field.style.descriptionColor;
        if (field.style.descriptionFontSize) description.style.fontSize = field.style.descriptionFontSize;
        if (field.style.descriptionFontWeight) description.style.fontWeight = field.style.descriptionFontWeight;
        if (field.style.textAlign) description.style.textAlign = field.style.textAlign;
        if (field.style.fontFamily) description.style.fontFamily = field.style.fontFamily;
      }
      
      titleContainer.appendChild(description);
    }
    
    container.appendChild(titleContainer);
    return container;
  }
  
  // Create image field
  function createImageField(field, style, container) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'codform-image-field';
    
    if (field.label) {
      const label = document.createElement('div');
      label.className = 'codform-image-label';
      label.innerText = field.label;
      
      // Apply label styling
      if (field.style && field.style.labelColor) {
        label.style.color = field.style.labelColor;
      }
      if (field.style && field.style.labelFontSize) {
        label.style.fontSize = field.style.labelFontSize;
      }
      
      imageContainer.appendChild(label);
    }
    
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'codform-image-container';
    
    // Apply border radius to the wrapper
    const borderRadius = (field.style && field.style.borderRadius) || style.borderRadius || '0.5rem';
    imgWrapper.style.borderRadius = borderRadius;
    
    const image = document.createElement('img');
    image.className = 'codform-image';
    image.src = field.src || 'https://via.placeholder.com/800x400?text=Image';
    image.alt = field.alt || 'Image';
    
    // Set image width if specified
    if (field.width) {
      imgWrapper.style.width = field.width;
      imgWrapper.style.margin = '0 auto';
    }
    
    imgWrapper.appendChild(image);
    imageContainer.appendChild(imgWrapper);
    
    if (field.helpText) {
      const helpText = document.createElement('p');
      helpText.className = 'codform-help-text';
      helpText.innerText = field.helpText;
      imageContainer.appendChild(helpText);
    }
    
    container.appendChild(imageContainer);
    return container;
  }
  
  // Create WhatsApp button
  function createWhatsAppButton(field, style, container) {
    // Get WhatsApp number from the field
    const whatsappNumber = field.whatsappNumber || '';
    
    // Default message
    const message = field.message || '';
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    
    // Determine button radius based on style
    let buttonRadius = '0.5rem'; // default
    if (style.buttonStyle === 'pill') {
      buttonRadius = '9999px';
    } else if (style.buttonStyle === 'square') {
      buttonRadius = '0';
    } else {
      buttonRadius = style.borderRadius || '0.5rem';
    }
    
    // Create button element
    const button = document.createElement('a');
    button.href = whatsappUrl;
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.className = 'codform-whatsapp-button';
    
    // Apply styling
    const backgroundColor = field.style?.backgroundColor || '#25D366';
    const textColor = field.style?.color || 'white';
    const fontSize = field.style?.fontSize || style.fontSize || '1.1rem';
    const customBorderRadius = field.style?.borderRadius || buttonRadius;
    
    button.style.backgroundColor = backgroundColor;
    button.style.color = textColor;
    button.style.fontSize = fontSize;
    button.style.borderRadius = customBorderRadius;
    
    // Add WhatsApp icon
    const icon = document.createElement('span');
    icon.className = 'codform-whatsapp-icon';
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l1.664 1.664M21 21l-1.5-1.5"></path><path d="M21 3l-3 3"></path><path d="M3 21l9-9"></path><path d="M8.2 8.2c1-1 2.6-1 3.6 0l1.4 1.4c1 1 1 2.6 0 3.6l-.5.5c-.3.3-.3.7 0 1l3 3c.3.3.7.3 1 0l.5-.5c1-1 2.6-1 3.6 0l1.4 1.4c1 1 1 2.6 0 3.6l-1.5 1.5c-1.2 1.2-3.1 1.2-4.2 0L7 16.3c-1.2-1.2-1.2-3.1 0-4.2l1.2-1.9z"></path></svg>';
    
    // Add button label
    const label = document.createElement('span');
    label.innerText = field.label || 'تواصل عبر واتساب';
    
    button.appendChild(icon);
    button.appendChild(label);
    
    container.appendChild(button);
    return container;
  }
  
  // Create cart items display
  function createCartItems(field, style, container) {
    const cartItemsContainer = document.createElement('div');
    cartItemsContainer.className = 'codform-cart-items';
    
    // Add title if provided
    if (field.label && field.label !== '') {
      const title = document.createElement('h3');
      title.innerText = field.label;
      
      // Apply styling to title
      if (field.style) {
        if (field.style.color) title.style.color = field.style.color;
        if (field.style.fontSize) title.style.fontSize = field.style.fontSize;
      }
      
      cartItemsContainer.appendChild(title);
    }
    
    // Create cart item container
    const cartItemWrapper = document.createElement('div');
    cartItemWrapper.className = 'codform-cart-item';
    cartItemWrapper.setAttribute('data-product-item', '');
    
    // Apply border radius
    const borderRadius = style.borderRadius || '0.5rem';
    cartItemWrapper.style.borderRadius = borderRadius;
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'codform-cart-item-image-container';
    imageContainer.style.width = '80px';
    imageContainer.style.height = '80px';
    imageContainer.style.backgroundColor = '#f3f4f6';
    imageContainer.style.borderRadius = '0.25rem';
    imageContainer.style.marginLeft = '15px';
    imageContainer.style.flexShrink = '0';
    imageContainer.style.overflow = 'hidden';
    
    // Add product image (placeholder for demo)
    const image = document.createElement('img');
    image.className = 'product-image codform-cart-item-image';
    image.src = 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=80&h=80&q=80';
    image.alt = 'Product';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';
    
    // Add fallback for image error
    image.onerror = function() {
      this.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.style.width = '100%';
      fallback.style.height = '100%';
      fallback.style.display = 'flex';
      fallback.style.alignItems = 'center';
      fallback.style.justifyContent = 'center';
      fallback.style.color = '#9ca3af';
      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
      this.parentNode.appendChild(fallback);
    };
    
    imageContainer.appendChild(image);
    
    // Create item details
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'codform-cart-item-details';
    detailsContainer.style.flex = '1';
    
    const productTitle = document.createElement('h4');
    productTitle.className = 'product-title codform-cart-item-title';
    productTitle.innerText = 'منتج تجريبي';
    
    // Apply styling to title
    if (field.style) {
      if (field.style.color) productTitle.style.color = field.style.color;
      if (field.style.fontSize) productTitle.style.fontSize = field.style.fontSize;
    } else {
      productTitle.style.fontSize = '1.1rem';
      productTitle.style.color = '#1f2937';
    }
    productTitle.style.fontWeight = '500';
    
    const productQuantity = document.createElement('div');
    productQuantity.className = 'product-quantity codform-cart-item-quantity';
    productQuantity.innerText = 'الكمية: ١';
    
    // Apply styling to quantity
    if (field.style) {
      if (field.style.descriptionColor) productQuantity.style.color = field.style.descriptionColor;
      if (field.style.descriptionFontSize) productQuantity.style.fontSize = field.style.descriptionFontSize;
    } else {
      productQuantity.style.fontSize = '0.9rem';
      productQuantity.style.color = '#6b7280';
    }
    productQuantity.style.marginTop = '5px';
    
    detailsContainer.appendChild(productTitle);
    detailsContainer.appendChild(productQuantity);
    
    // Create price container
    const priceContainer = document.createElement('div');
    priceContainer.className = 'codform-cart-item-price-container';
    priceContainer.style.textAlign = 'right';
    
    const priceText = document.createElement('div');
    priceText.className = 'product-price codform-cart-item-price';
    priceText.innerText = '$99.00';
    
    // Apply styling to price
    if (field.style) {
      if (field.style.priceColor) priceText.style.color = field.style.priceColor;
      if (field.style.priceFontSize) priceText.style.fontSize = field.style.priceFontSize;
    } else {
      priceText.style.fontSize = '1rem';
      priceText.style.color = '#1f2937';
    }
    priceText.style.fontWeight = '500';
    
    priceContainer.appendChild(priceText);
    
    // Assemble cart item
    cartItemWrapper.appendChild(imageContainer);
    cartItemWrapper.appendChild(detailsContainer);
    cartItemWrapper.appendChild(priceContainer);
    
    // Create container for cart items
    const itemsListContainer = document.createElement('div');
    itemsListContainer.className = 'codform-cart-items-list';
    itemsListContainer.style.border = '1px solid #e5e7eb';
    itemsListContainer.style.borderRadius = borderRadius;
    itemsListContainer.style.overflow = 'hidden';
    
    // Set the appropriate direction based on language
    const isRTL = document.dir === 'rtl' || document.documentElement.lang === 'ar';
    itemsListContainer.style.direction = isRTL ? 'rtl' : 'ltr';
    
    itemsListContainer.appendChild(cartItemWrapper);
    cartItemsContainer.appendChild(itemsListContainer);
    
    container.appendChild(cartItemsContainer);
    return container;
  }
  
  // Create cart summary display
  function createCartSummary(field, style, container) {
    const cartSummaryContainer = document.createElement('div');
    cartSummaryContainer.className = 'codform-cart-summary';
    
    // Add title if provided and not empty
    if (field.label && field.label !== '') {
      const title = document.createElement('h3');
      title.innerText = field.label;
      
      // Apply styling to title
      if (field.style) {
        if (field.style.color) title.style.color = field.style.color;
        if (field.style.fontSize) title.style.fontSize = field.style.fontSize || '1.2rem';
      } else {
        title.style.fontSize = '1.2rem';
        title.style.color = '#1f2937';
      }
      title.style.marginBottom = '10px';
      
      cartSummaryContainer.appendChild(title);
    }
    
    // Create summary box
    const summaryBox = document.createElement('div');
    summaryBox.className = 'codform-cart-summary-box';
    
    // Apply styling to summary box
    const borderRadius = style.borderRadius || '0.5rem';
    summaryBox.style.border = '1px solid ' + (field.style?.borderColor || '#e5e7eb');
    summaryBox.style.borderRadius = borderRadius;
    summaryBox.style.padding = '15px';
    summaryBox.style.backgroundColor = field.style?.backgroundColor || '#f9fafb';
    
    // Set the appropriate direction based on language
    const isRTL = document.dir === 'rtl' || document.documentElement.lang === 'ar';
    summaryBox.style.direction = isRTL ? 'rtl' : 'ltr';
    
    // Create subtotal row
    const subtotalRow = document.createElement('div');
    subtotalRow.className = 'codform-cart-summary-row';
    subtotalRow.setAttribute('data-product-price-display', 'subtotal');
    subtotalRow.style.display = 'flex';
    subtotalRow.style.justifyContent = 'space-between';
    subtotalRow.style.marginBottom = '10px';
    
    const subtotalLabel = document.createElement('span');
    subtotalLabel.innerText = isRTL ? 'المجموع الفرعي' : 'Subtotal';
    subtotalLabel.style.color = field.style?.labelColor || '#6b7280';
    subtotalLabel.style.fontSize = field.style?.labelFontSize || '1rem';
    
    const subtotalValue = document.createElement('span');
    subtotalValue.className = 'product-price';
    subtotalValue.innerText = '$99.00';
    subtotalValue.style.color = field.style?.valueColor || '#1f2937';
    subtotalValue.style.fontSize = field.style?.valueFontSize || '1rem';
    subtotalValue.style.fontWeight = '500';
    
    subtotalRow.appendChild(subtotalLabel);
    subtotalRow.appendChild(subtotalValue);
    
    // Create shipping row
    const shippingRow = document.createElement('div');
    shippingRow.className = 'codform-cart-summary-row';
    shippingRow.style.display = 'flex';
    shippingRow.style.justifyContent = 'space-between';
    shippingRow.style.marginBottom = '10px';
    
    const shippingLabel = document.createElement('span');
    shippingLabel.innerText = isRTL ? 'الشحن' : 'Shipping';
    shippingLabel.style.color = field.style?.labelColor || '#6b7280';
    shippingLabel.style.fontSize = field.style?.labelFontSize || '1rem';
    
    const shippingValue = document.createElement('span');
    shippingValue.className = 'shipping-price';
    shippingValue.innerText = '$10.00';
    shippingValue.style.color = field.style?.valueColor || '#1f2937';
    shippingValue.style.fontSize = field.style?.valueFontSize || '1rem';
    shippingValue.style.fontWeight = '500';
    
    shippingRow.appendChild(shippingLabel);
    shippingRow.appendChild(shippingValue);
    
    // Create total row with separator
    const totalRow = document.createElement('div');
    totalRow.className = 'codform-cart-summary-row';
    totalRow.style.display = 'flex';
    totalRow.style.justifyContent = 'space-between';
    totalRow.style.borderTop = '1px solid ' + (field.style?.borderColor || '#e5e7eb');
    totalRow.style.paddingTop = '10px';
    totalRow.style.marginTop = '10px';
    
    const totalLabel = document.createElement('span');
    totalLabel.innerText = isRTL ? 'الإجمالي' : 'Total';
    totalLabel.style.color = field.style?.totalLabelColor || '#1f2937';
    totalLabel.style.fontSize = field.style?.totalLabelFontSize || '1.1rem';
    totalLabel.style.fontWeight = 'bold';
    
    const totalValue = document.createElement('span');
    totalValue.className = 'total-price';
    totalValue.innerText = '$109.00';
    totalValue.style.color = field.style?.totalValueColor || style.primaryColor || '#9b87f5';
    totalValue.style.fontSize = field.style?.totalValueFontSize || '1.1rem';
    totalValue.style.fontWeight = 'bold';
    
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    
    // Assemble the summary box
    summaryBox.appendChild(subtotalRow);
    summaryBox.appendChild(shippingRow);
    summaryBox.appendChild(totalRow);
    
    cartSummaryContainer.appendChild(summaryBox);
    container.appendChild(cartSummaryContainer);
    
    return container;
  }
  
  // Create HTML content block
  function createHtmlContent(field, style, container) {
    const htmlContainer = document.createElement('div');
    htmlContainer.className = 'codform-html-content';
    
    // If content is provided, set it
    if (field.content) {
      htmlContainer.innerHTML = field.content;
    } else {
      htmlContainer.innerHTML = field.label || '';
    }
    
    container.appendChild(htmlContainer);
    return container;
  }
  
  // Create submit button
  function createSubmitButton(field, style, container) {
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'codform-submit-button codform-submit-btn';
    
    // Apply label
    button.innerText = field.label || 'إرسال الطلب';
    
    // Apply styling
    const bgColor = field.style?.backgroundColor || style.primaryColor || '#9b87f5';
    const textColor = field.style?.color || '#ffffff';
    const fontSize = field.style?.fontSize || '1.2rem';
    
    button.style.backgroundColor = bgColor;
    button.style.color = textColor;
    button.style.fontSize = fontSize;
    
    // Determine button radius based on style
    if (style.buttonStyle === 'pill') {
      button.style.borderRadius = '9999px';
    } else if (style.buttonStyle === 'square') {
      button.style.borderRadius = '0';
    } else {
      button.style.borderRadius = style.borderRadius || '8px';
    }
    
    // Add animation if specified
    if (field.style && field.style.animation && field.style.animationType) {
      button.classList.add(`${field.style.animationType}-animation`);
    }
    
    container.appendChild(button);
    return container;
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

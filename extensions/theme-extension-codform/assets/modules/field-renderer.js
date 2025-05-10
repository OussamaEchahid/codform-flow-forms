
// CODFORM Field Renderer Module
function CODFORMFieldRenderer() {
  // Render a single form field based on its type
  function renderField(form, field, primaryColor) {
    if (!field || !field.type) {
      console.error('CODFORM: Invalid field:', field);
      return;
    }

    console.log('CODFORM: Rendering field type:', field.type, field);
    
    // Create field container
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-field';
    fieldContainer.dataset.fieldType = field.type;
    fieldContainer.dataset.fieldId = field.id;
    
    // Apply field's custom styles if available
    if (field.style) {
      if (field.style.marginTop) fieldContainer.style.marginTop = field.style.marginTop;
      if (field.style.marginBottom) fieldContainer.style.marginBottom = field.style.marginBottom;
      if (field.style.textAlign) fieldContainer.style.textAlign = field.style.textAlign;
    }
    
    // Handle different field types
    switch(field.type) {
      case 'text':
      case 'email':
      case 'phone':
        renderTextInput(fieldContainer, field);
        break;
      case 'textarea':
        renderTextarea(fieldContainer, field);
        break;
      case 'select':
        renderSelect(fieldContainer, field);
        break;
      case 'checkbox':
        renderCheckboxGroup(fieldContainer, field);
        break;
      case 'radio':
        renderRadioGroup(fieldContainer, field, primaryColor);
        break;
      case 'title':
        renderTitle(fieldContainer, field);
        break;
      case 'text/html':
        renderHtmlContent(fieldContainer, field);
        break;
      case 'whatsapp':
        renderWhatsAppButton(fieldContainer, field, primaryColor);
        break;
      case 'image':
        renderImageField(fieldContainer, field);
        break;
      case 'cart-items':
        renderCartItems(fieldContainer, field);
        break;
      case 'cart-summary':
        renderCartSummary(fieldContainer, field);
        break;
      case 'shipping':
        renderShippingOptions(fieldContainer, field, primaryColor);
        break;
      case 'countdown':
        renderCountdownTimer(fieldContainer, field);
        break;
      default:
        console.warn('CODFORM: Unknown field type:', field.type);
        fieldContainer.textContent = `Unsupported field type: ${field.type}`;
    }
    
    // Add validation error message container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'codform-error-message';
    errorContainer.style.display = 'none';
    fieldContainer.appendChild(errorContainer);
    
    form.appendChild(fieldContainer);
  }

  // Render a text input field (text, email, phone)
  function renderTextInput(container, field) {
    if (field.label) {
      const label = document.createElement('label');
      label.setAttribute('for', `field-${field.id}`);
      label.textContent = field.label;
      
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = '*';
        label.appendChild(required);
      }
      
      container.appendChild(label);
    }
    
    const input = document.createElement('input');
    input.type = field.type === 'email' ? 'email' : 
                 field.type === 'phone' ? 'tel' : 'text';
    input.id = `field-${field.id}`;
    input.name = field.name || field.id;
    input.placeholder = field.placeholder || '';
    input.className = 'codform-input';
    input.required = field.required || false;
    
    // Apply pattern for phone validation
    if (field.type === 'phone') {
      // Simple pattern that accepts various phone formats
      input.pattern = field.pattern || '[0-9+\-\s()]{7,15}';
    }
    
    container.appendChild(input);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      container.appendChild(helpText);
    }
  }

  // Render a textarea field
  function renderTextarea(container, field) {
    if (field.label) {
      const label = document.createElement('label');
      label.setAttribute('for', `field-${field.id}`);
      label.textContent = field.label;
      
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = '*';
        label.appendChild(required);
      }
      
      container.appendChild(label);
    }
    
    const textarea = document.createElement('textarea');
    textarea.id = `field-${field.id}`;
    textarea.name = field.name || field.id;
    textarea.placeholder = field.placeholder || '';
    textarea.className = 'codform-textarea';
    textarea.required = field.required || false;
    textarea.rows = field.rows || 4;
    
    container.appendChild(textarea);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      container.appendChild(helpText);
    }
  }

  // Render a select dropdown field
  function renderSelect(container, field) {
    if (field.label) {
      const label = document.createElement('label');
      label.setAttribute('for', `field-${field.id}`);
      label.textContent = field.label;
      
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = '*';
        label.appendChild(required);
      }
      
      container.appendChild(label);
    }
    
    const select = document.createElement('select');
    select.id = `field-${field.id}`;
    select.name = field.name || field.id;
    select.className = 'codform-select';
    select.required = field.required || false;
    
    // Add placeholder option if available
    if (field.placeholder) {
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = field.placeholder;
      placeholderOption.disabled = true;
      placeholderOption.selected = true;
      select.appendChild(placeholderOption);
    }
    
    // Add options
    if (field.options && Array.isArray(field.options)) {
      field.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value || option;
        optionElement.textContent = option.label || option;
        select.appendChild(optionElement);
      });
    }
    
    container.appendChild(select);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      container.appendChild(helpText);
    }
  }

  // Render a checkbox group
  function renderCheckboxGroup(container, field) {
    if (field.label) {
      const label = document.createElement('label');
      label.textContent = field.label;
      
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = '*';
        label.appendChild(required);
      }
      
      container.appendChild(label);
    }
    
    const checkboxGroup = document.createElement('div');
    checkboxGroup.className = 'codform-checkbox-group';
    
    // Add checkbox options
    if (field.options && Array.isArray(field.options)) {
      field.options.forEach((option, index) => {
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'codform-checkbox-container';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `field-${field.id}-${index}`;
        checkbox.name = `${field.name || field.id}[]`;
        checkbox.value = option.value || option;
        
        const label = document.createElement('label');
        label.setAttribute('for', `field-${field.id}-${index}`);
        label.textContent = option.label || option;
        
        // Adjust ordering for RTL/LTR
        const isRtl = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
        if (isRtl) {
          checkboxWrapper.appendChild(label);
          checkboxWrapper.appendChild(checkbox);
        } else {
          checkboxWrapper.appendChild(checkbox);
          checkboxWrapper.appendChild(label);
        }
        
        checkboxGroup.appendChild(checkboxWrapper);
      });
    }
    
    container.appendChild(checkboxGroup);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      container.appendChild(helpText);
    }
  }

  // Render a radio button group
  function renderRadioGroup(container, field, primaryColor) {
    if (field.label) {
      const label = document.createElement('label');
      label.textContent = field.label;
      
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = '*';
        label.appendChild(required);
      }
      
      container.appendChild(label);
    }
    
    const radioGroup = document.createElement('div');
    radioGroup.className = 'codform-radio-group';
    
    // Add radio options
    if (field.options && Array.isArray(field.options)) {
      field.options.forEach((option, index) => {
        const radioWrapper = document.createElement('div');
        radioWrapper.className = 'codform-radio-container';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = `field-${field.id}-${index}`;
        radio.name = field.name || field.id;
        radio.value = option.value || option;
        if (index === 0) radio.checked = true;
        
        // Apply primary color to radio button
        if (primaryColor) {
          radio.style.accentColor = primaryColor;
        }
        
        const label = document.createElement('label');
        label.setAttribute('for', `field-${field.id}-${index}`);
        label.textContent = option.label || option;
        
        // Adjust ordering for RTL/LTR
        const isRtl = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
        if (isRtl) {
          radioWrapper.appendChild(label);
          radioWrapper.appendChild(radio);
        } else {
          radioWrapper.appendChild(radio);
          radioWrapper.appendChild(label);
        }
        
        radioGroup.appendChild(radioWrapper);
      });
    }
    
    container.appendChild(radioGroup);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      container.appendChild(helpText);
    }
  }

  // Render a title field
  function renderTitle(container, field) {
    const titleElem = document.createElement(field.titleLevel || 'h3');
    titleElem.textContent = field.label || field.content || 'Section Title';
    
    if (field.style) {
      if (field.style.color) titleElem.style.color = field.style.color;
      if (field.style.fontSize) titleElem.style.fontSize = field.style.fontSize;
      if (field.style.textAlign) titleElem.style.textAlign = field.style.textAlign;
      if (field.style.fontWeight) titleElem.style.fontWeight = field.style.fontWeight;
    }
    
    container.appendChild(titleElem);
  }

  // Render HTML content field
  function renderHtmlContent(container, field) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'codform-html-content';
    
    if (field.content) {
      contentDiv.innerHTML = field.content;
    } else {
      contentDiv.textContent = 'HTML Content goes here';
    }
    
    // Apply custom styles if available
    if (field.style) {
      if (field.style.color) contentDiv.style.color = field.style.color;
      if (field.style.fontSize) contentDiv.style.fontSize = field.style.fontSize;
      if (field.style.textAlign) contentDiv.style.textAlign = field.style.textAlign;
    }
    
    container.appendChild(contentDiv);
  }

  // Render WhatsApp button
  function renderWhatsAppButton(container, field, primaryColor) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'codform-whatsapp-button-container';
    
    let phoneNumber = field.phoneNumber || '';
    // Remove any non-digit characters except for the plus sign
    phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    const buttonMessage = encodeURIComponent(field.message || 'Hello!');
    const whatsAppLink = `https://wa.me/${phoneNumber}?text=${buttonMessage}`;
    
    const button = document.createElement('a');
    button.href = whatsAppLink;
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.className = 'codform-whatsapp-button';
    
    // Apply custom background color if specified
    if (field.style && field.style.backgroundColor) {
      button.style.backgroundColor = field.style.backgroundColor;
    }
    
    // Add WhatsApp icon
    const icon = document.createElement('span');
    icon.className = 'codform-whatsapp-icon';
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"></path></svg>`;
    
    button.appendChild(icon);
    button.appendChild(document.createTextNode(field.label || 'WhatsApp'));
    
    buttonContainer.appendChild(button);
    container.appendChild(buttonContainer);
  }
  
  // Render image field
  function renderImageField(container, field) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'codform-image-field';
    
    if (field.imageUrl) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'codform-image-container';
      
      const img = document.createElement('img');
      img.src = field.imageUrl;
      img.alt = field.label || 'Form image';
      img.className = 'codform-image';
      
      // Apply custom styles if available
      if (field.style) {
        if (field.style.borderRadius) img.style.borderRadius = field.style.borderRadius;
        if (field.style.maxHeight) img.style.maxHeight = field.style.maxHeight;
      }
      
      imgWrapper.appendChild(img);
      imageContainer.appendChild(imgWrapper);
      
      if (field.caption) {
        const caption = document.createElement('p');
        caption.className = 'codform-image-caption';
        caption.textContent = field.caption;
        imageContainer.appendChild(caption);
      }
    } else {
      // Placeholder for images that haven't been uploaded
      const placeholder = document.createElement('div');
      placeholder.className = 'codform-image-placeholder';
      placeholder.textContent = 'No image uploaded';
      imageContainer.appendChild(placeholder);
    }
    
    container.appendChild(imageContainer);
  }
  
  // Render cart items
  function renderCartItems(container, field) {
    const cartItems = document.createElement('div');
    cartItems.className = 'codform-cart-items';
    
    // In a real implementation, we would fetch cart data from Shopify
    // For now, we'll use placeholder data
    const demoItems = [
      {
        title: 'Sample Product',
        price: '$99.99',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?format=webp&v=1530129081',
        quantity: 1,
        variant: 'Default'
      }
    ];
    
    demoItems.forEach(item => {
      const cartItem = document.createElement('div');
      cartItem.className = 'codform-cart-item';
      
      const img = document.createElement('img');
      img.src = item.image;
      img.className = 'codform-cart-item-image';
      img.alt = item.title;
      
      const details = document.createElement('div');
      details.className = 'codform-cart-item-details';
      
      const title = document.createElement('div');
      title.className = 'codform-cart-item-title';
      title.textContent = item.title;
      
      const variant = document.createElement('div');
      variant.className = 'codform-cart-item-variant';
      variant.textContent = item.variant;
      
      const price = document.createElement('div');
      price.className = 'codform-cart-item-price';
      price.textContent = item.price;
      
      const quantity = document.createElement('div');
      quantity.className = 'codform-cart-item-quantity';
      
      const quantityLabel = document.createElement('span');
      quantityLabel.className = 'codform-cart-item-quantity-label';
      quantityLabel.textContent = 'Quantity:';
      
      const quantityValue = document.createElement('span');
      quantityValue.textContent = item.quantity;
      
      quantity.appendChild(quantityLabel);
      quantity.appendChild(quantityValue);
      
      details.appendChild(title);
      details.appendChild(variant);
      details.appendChild(price);
      details.appendChild(quantity);
      
      cartItem.appendChild(img);
      cartItem.appendChild(details);
      
      cartItems.appendChild(cartItem);
    });
    
    container.appendChild(cartItems);
  }
  
  // Render cart summary
  function renderCartSummary(container, field) {
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'codform-cart-summary';
    
    // In a real implementation, we would calculate these totals from cart data
    // For now, we'll use placeholder data
    const demoSummary = {
      subtotal: '$99.99',
      shipping: '$5.00',
      tax: '$10.50',
      total: '$115.49'
    };
    
    // Subtotal row
    const subtotalRow = document.createElement('div');
    subtotalRow.className = 'codform-cart-summary-row';
    
    const subtotalLabel = document.createElement('div');
    subtotalLabel.className = 'codform-cart-summary-label';
    subtotalLabel.textContent = 'Subtotal:';
    
    const subtotalValue = document.createElement('div');
    subtotalValue.className = 'codform-cart-summary-value';
    subtotalValue.textContent = demoSummary.subtotal;
    
    subtotalRow.appendChild(subtotalLabel);
    subtotalRow.appendChild(subtotalValue);
    
    // Shipping row
    const shippingRow = document.createElement('div');
    shippingRow.className = 'codform-cart-summary-row';
    
    const shippingLabel = document.createElement('div');
    shippingLabel.className = 'codform-cart-summary-label';
    shippingLabel.textContent = 'Shipping:';
    
    const shippingValue = document.createElement('div');
    shippingValue.className = 'codform-cart-summary-value';
    shippingValue.textContent = demoSummary.shipping;
    
    shippingRow.appendChild(shippingLabel);
    shippingRow.appendChild(shippingValue);
    
    // Tax row
    const taxRow = document.createElement('div');
    taxRow.className = 'codform-cart-summary-row';
    
    const taxLabel = document.createElement('div');
    taxLabel.className = 'codform-cart-summary-label';
    taxLabel.textContent = 'Tax:';
    
    const taxValue = document.createElement('div');
    taxValue.className = 'codform-cart-summary-value';
    taxValue.textContent = demoSummary.tax;
    
    taxRow.appendChild(taxLabel);
    taxRow.appendChild(taxValue);
    
    // Total row
    const totalRow = document.createElement('div');
    totalRow.className = 'codform-cart-summary-row';
    
    const totalLabel = document.createElement('div');
    totalLabel.className = 'codform-cart-summary-label';
    totalLabel.textContent = 'Total:';
    
    const totalValue = document.createElement('div');
    totalValue.className = 'codform-cart-summary-value';
    totalValue.textContent = demoSummary.total;
    
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    
    // Add all rows to the summary container
    summaryContainer.appendChild(subtotalRow);
    summaryContainer.appendChild(shippingRow);
    summaryContainer.appendChild(taxRow);
    summaryContainer.appendChild(totalRow);
    
    container.appendChild(summaryContainer);
  }
  
  // Render shipping options
  function renderShippingOptions(container, field, primaryColor) {
    const shippingOptions = document.createElement('div');
    shippingOptions.className = 'codform-shipping-options';
    
    // Add a title if provided
    if (field.label) {
      const title = document.createElement('label');
      title.className = 'codform-shipping-title';
      title.textContent = field.label;
      
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = '*';
        title.appendChild(required);
      }
      
      shippingOptions.appendChild(title);
    }
    
    // Default shipping options if none provided
    const options = field.options || [
      {
        id: 'standard',
        name: 'Standard Delivery',
        price: '$5.00',
        time: '3-5 business days'
      },
      {
        id: 'express',
        name: 'Express Delivery',
        price: '$15.00',
        time: '1-2 business days'
      }
    ];
    
    const radioGroup = document.createElement('div');
    radioGroup.className = 'codform-radio-group codform-shipping-radio-group';
    
    options.forEach((option, index) => {
      const optionContainer = document.createElement('div');
      optionContainer.className = 'codform-shipping-option';
      
      const radioContainer = document.createElement('div');
      radioContainer.className = 'codform-radio-container';
      
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.id = `shipping-${field.id}-${index}`;
      radio.name = `shipping-${field.id}`;
      radio.value = option.id;
      if (index === 0) radio.checked = true;
      
      // Apply primary color
      if (primaryColor) {
        radio.style.accentColor = primaryColor;
      }
      
      const label = document.createElement('div');
      label.className = 'codform-shipping-option-label';
      
      const nameElem = document.createElement('span');
      nameElem.className = 'codform-shipping-name';
      nameElem.textContent = option.name;
      
      const timeElem = document.createElement('span');
      timeElem.className = 'codform-shipping-time';
      timeElem.textContent = option.time;
      
      label.appendChild(nameElem);
      label.appendChild(document.createElement('br'));
      label.appendChild(timeElem);
      
      const priceElem = document.createElement('span');
      priceElem.className = 'codform-shipping-price';
      priceElem.textContent = option.price;
      
      // Check if RTL
      const isRtl = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
      
      if (isRtl) {
        radioContainer.appendChild(label);
        radioContainer.appendChild(radio);
      } else {
        radioContainer.appendChild(radio);
        radioContainer.appendChild(label);
      }
      
      optionContainer.appendChild(radioContainer);
      optionContainer.appendChild(priceElem);
      radioGroup.appendChild(optionContainer);
    });
    
    shippingOptions.appendChild(radioGroup);
    container.appendChild(shippingOptions);
  }
  
  // Render countdown timer
  function renderCountdownTimer(container, field) {
    const countdownContainer = document.createElement('div');
    countdownContainer.className = 'codform-countdown-container';
    countdownContainer.style.textAlign = 'center';
    countdownContainer.style.padding = '15px';
    countdownContainer.style.margin = '15px 0';
    countdownContainer.style.border = '1px solid #e5e7eb';
    countdownContainer.style.borderRadius = '8px';
    countdownContainer.style.backgroundColor = '#f9fafb';
    
    // Add title if provided
    if (field.label) {
      const title = document.createElement('div');
      title.className = 'codform-countdown-title';
      title.textContent = field.label;
      title.style.fontSize = '1.1rem';
      title.style.fontWeight = '600';
      title.style.marginBottom = '10px';
      countdownContainer.appendChild(title);
    }
    
    // Create timer display
    const timerDisplay = document.createElement('div');
    timerDisplay.className = 'codform-countdown-timer';
    timerDisplay.style.fontSize = '1.5rem';
    timerDisplay.style.fontWeight = '700';
    timerDisplay.style.fontFamily = 'monospace, sans-serif';
    
    // Default expiration time: 24 hours from now
    const hoursLeft = field.hours || 24;
    const minutesLeft = field.minutes || 0;
    const secondsLeft = field.seconds || 0;
    
    timerDisplay.textContent = `${padZero(hoursLeft)}:${padZero(minutesLeft)}:${padZero(secondsLeft)}`;
    
    // Add countdown styles
    if (field.style) {
      if (field.style.color) timerDisplay.style.color = field.style.color;
      if (field.style.backgroundColor) countdownContainer.style.backgroundColor = field.style.backgroundColor;
    }
    
    countdownContainer.appendChild(timerDisplay);
    
    // Add message if provided
    if (field.message) {
      const message = document.createElement('div');
      message.className = 'codform-countdown-message';
      message.textContent = field.message;
      message.style.marginTop = '10px';
      message.style.fontSize = '0.9rem';
      countdownContainer.appendChild(message);
    }
    
    container.appendChild(countdownContainer);
  }
  
  // Helper function for countdown timer
  function padZero(num) {
    return num.toString().padStart(2, '0');
  }
  
  // Render fields for a specific step
  function renderStepFields(fields, primaryColor) {
    const stepContainer = document.createElement('div');
    stepContainer.className = 'codform-step';
    
    if (fields && Array.isArray(fields)) {
      fields.forEach(field => {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'codform-field';
        fieldContainer.dataset.fieldType = field.type;
        fieldContainer.dataset.fieldId = field.id;
        
        // Apply custom styles if available
        if (field.style) {
          if (field.style.marginTop) fieldContainer.style.marginTop = field.style.marginTop;
          if (field.style.marginBottom) fieldContainer.style.marginBottom = field.style.marginBottom;
          if (field.style.textAlign) fieldContainer.style.textAlign = field.style.textAlign;
        }
        
        switch(field.type) {
          case 'text':
          case 'email':
          case 'phone':
            renderTextInput(fieldContainer, field);
            break;
          case 'textarea':
            renderTextarea(fieldContainer, field);
            break;
          case 'select':
            renderSelect(fieldContainer, field);
            break;
          case 'checkbox':
            renderCheckboxGroup(fieldContainer, field);
            break;
          case 'radio':
            renderRadioGroup(fieldContainer, field, primaryColor);
            break;
          case 'title':
            renderTitle(fieldContainer, field);
            break;
          case 'text/html':
            renderHtmlContent(fieldContainer, field);
            break;
          case 'whatsapp':
            renderWhatsAppButton(fieldContainer, field, primaryColor);
            break;
          case 'image':
            renderImageField(fieldContainer, field);
            break;
          case 'cart-items':
            renderCartItems(fieldContainer, field);
            break;
          case 'cart-summary':
            renderCartSummary(fieldContainer, field);
            break;
          case 'shipping':
            renderShippingOptions(fieldContainer, field, primaryColor);
            break;
          case 'countdown':
            renderCountdownTimer(fieldContainer, field);
            break;
          default:
            console.warn('CODFORM: Unknown field type:', field.type);
            fieldContainer.textContent = `Unsupported field type: ${field.type}`;
        }
        
        stepContainer.appendChild(fieldContainer);
      });
    }
    
    return stepContainer;
  }
  
  return {
    renderField,
    renderWhatsAppButton,
    renderImageField,
    renderCountdownTimer,
    renderShippingOptions,
    renderStepFields
  };
}

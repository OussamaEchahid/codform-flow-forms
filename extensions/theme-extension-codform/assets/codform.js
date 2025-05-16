// CODForm - Shopify Form Builder and Order Collector
// Version: 1.0.0
// Author: CODForm Team
// License: Commercial

(function() {
  // Constants
  const DEBUG_MODE = false;
  
  // Initialize form on page load
  document.addEventListener('DOMContentLoaded', initializeCODForm);
  
  // Main initialization function
  function initializeCODForm() {
    try {
      // Find all form containers
      const formContainers = document.querySelectorAll('.codform-container');
      if (formContainers.length === 0 && DEBUG_MODE) {
        console.log('CODForm: No form containers found on page');
        return;
      }
      
      // Initialize each container
      formContainers.forEach(container => {
        initializeFormContainer(container);
      });
    } catch (error) {
      if (DEBUG_MODE) console.error('CODForm initialization error:', error);
    }
  }
  
  // Initialize a specific form container
  function initializeFormContainer(container) {
    try {
      // Get form data from container
      const formDataElement = container.querySelector('.codform-data');
      if (!formDataElement) {
        if (DEBUG_MODE) console.error('CODForm: Form data element not found');
        return;
      }
      
      // Extract and parse the form data
      const formDataContent = formDataElement.textContent;
      let formData;
      try {
        formData = JSON.parse(formDataContent);
      } catch (e) {
        if (DEBUG_MODE) console.error('CODForm: Failed to parse form data', e);
        return;
      }
      
      // Remove the data element
      formDataElement.remove();
      
      // Create form structure
      createFormStructure(container, formData);
      
      // Initialize form functionality
      initializeFormFunctionality(container, formData);
    } catch (error) {
      if (DEBUG_MODE) console.error('CODForm container initialization error:', error);
    }
  }
  
  // Create the form structure
  function createFormStructure(container, formData) {
    try {
      // Create form element
      const form = document.createElement('form');
      form.className = 'codform-form';
      form.id = `codform-${formData.id || Date.now()}`;
      
      // Set form styles
      form.style.fontSize = formData.style?.fontSize || '16px';
      form.dataset.primaryColor = formData.style?.primaryColor || '#9b87f5';
      form.dataset.borderRadius = formData.style?.borderRadius || '0.5rem';
      form.dataset.fontSize = formData.style?.fontSize || '16px';
      form.dataset.buttonStyle = formData.style?.buttonStyle || 'rounded';
      form.style.setProperty('--form-primary-color', formData.style?.primaryColor || '#9b87f5');
      
      // Add the form to container
      container.appendChild(form);
      
      // Get language direction
      const isRTL = document.documentElement.dir === 'rtl' || 
                    document.documentElement.lang === 'ar' ||
                    document.body.classList.contains('rtl');

      const formInnerContainer = document.createElement('div');
      formInnerContainer.className = 'p-3';
      formInnerContainer.style.borderRadius = `0 0 ${formData.style?.borderRadius || '0.5rem'} ${formData.style?.borderRadius || '0.5rem'}`;
      formInnerContainer.style.direction = isRTL ? 'rtl' : 'ltr';
      formInnerContainer.dataset.direction = isRTL ? 'rtl' : 'ltr';
      form.appendChild(formInnerContainer);
      
      // Create step indicator if multi-step form
      if (formData.totalSteps > 1) {
        createStepIndicator(form, formData.currentStep, formData.totalSteps);
      }

      // Process and add form fields
      const fieldsContainer = document.createElement('div');
      fieldsContainer.className = 'space-y-2';
      formInnerContainer.appendChild(fieldsContainer);

      formData.fields.forEach(field => {
        // Force showIcon to follow the same logic as in the React component
        if (field.icon && field.icon !== 'none') {
          if (!field.style) field.style = {};
          
          // Only set showIcon if it's not already defined
          if (field.style.showIcon === undefined) {
            field.style.showIcon = true;
          }
        }
        
        // Create field
        const fieldElement = createFormField(field, formData.style || {}, isRTL);
        if (fieldElement) {
          fieldsContainer.appendChild(fieldElement);
        }
      });
    } catch (error) {
      if (DEBUG_MODE) console.error('CODForm structure creation error:', error);
    }
  }
  
  // Create individual form field based on type
  function createFormField(field, formStyle, isRTL) {
    if (!field || !field.type) {
      if (DEBUG_MODE) console.warn('Invalid field:', field);
      return null;
    }
    
    // Generate a unique field key
    const fieldKey = `field-${field.id}-${field.label || ''}-${field.placeholder || ''}-${field.type}-${field.icon || 'none'}-${Date.now()}`;
    
    // Create field container
    const fieldContainer = document.createElement('div');
    fieldContainer.className = field.type === 'submit' ? 'mt-0' : 'mb-1';
    fieldContainer.id = fieldKey;
    
    // Add data attributes to help with styling and debugging
    fieldContainer.dataset.fieldType = field.type;
    fieldContainer.dataset.fieldId = field.id;
    fieldContainer.dataset.hasIcon = field.icon && field.icon !== 'none' ? 'true' : 'false';
    fieldContainer.dataset.showIcon = field.style?.showIcon ? 'true' : 'false';
    fieldContainer.dataset.icon = field.icon || 'none';
    fieldContainer.dataset.required = field.required ? 'true' : 'false';

    let fieldElement = null;
    
    // Create field based on type
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        fieldElement = createInputField(field, formStyle, isRTL);
        break;
      case 'textarea':
        fieldElement = createTextAreaField(field, formStyle, isRTL);
        break;
      case 'radio':
        fieldElement = createRadioGroupField(field, formStyle, isRTL);
        break;
      case 'checkbox':
        fieldElement = createCheckboxGroupField(field, formStyle, isRTL);
        break;
      case 'title':
      case 'form-title':
        fieldElement = createTitleField(field, formStyle, isRTL);
        break;
      case 'text/html':
        fieldElement = createHtmlContent(field, formStyle, isRTL);
        break;
      case 'cart-items':
        fieldElement = createCartItems(field, formStyle, isRTL);
        break;
      case 'cart-summary':
        fieldElement = createCartSummary(field, formStyle, isRTL);
        break;
      case 'submit':
        fieldElement = createSubmitButton(field, formStyle, isRTL);
        break;
      case 'whatsapp':
        fieldElement = createWhatsAppButton(field, formStyle, isRTL);
        break;
      case 'image':
        fieldElement = createImageField(field, formStyle, isRTL);
        break;
      default:
        if (DEBUG_MODE) console.warn(`Unknown field type: ${field.type}`);
        return null;
    }
    
    if (fieldElement) {
      fieldContainer.appendChild(fieldElement);
      return fieldContainer;
    }
    
    return null;
  }
  
  // Create an input field (text, email, phone)
  function createInputField(field, formStyle, isRTL) {
    try {
      const container = document.createElement('div');
      container.className = "mb-0";
      
      // Process field style properties with fallbacks
      const fieldStyle = field.style || {};
      const showLabel = fieldStyle.showLabel !== false;
      const labelColor = fieldStyle.labelColor || '#334155';
      const labelFontSize = fieldStyle.labelFontSize || formStyle.fontSize || '16px';
      const labelFontWeight = fieldStyle.labelFontWeight || '500';
      
      const fontFamily = fieldStyle.fontFamily || 'inherit';
      const textColor = fieldStyle.color || '#1f2937';
      const fontSize = fieldStyle.fontSize || formStyle.fontSize || '16px';
      const fontWeight = fieldStyle.fontWeight || '400';
      
      const backgroundColor = fieldStyle.backgroundColor || '#ffffff';
      const borderColor = fieldStyle.borderColor || '#d1d5db';
      const borderWidth = fieldStyle.borderWidth || '1px';
      const borderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '8px';
      const paddingY = fieldStyle.paddingY ? `${fieldStyle.paddingY}px` : '8px';
      
      // Handle icon display - following exactly the React component logic
      const showIcon = fieldStyle.showIcon !== undefined 
        ? fieldStyle.showIcon 
        : (field.icon && field.icon !== 'none');
      
      // Add label if not hidden
      if (showLabel) {
        const label = document.createElement('label');
        label.htmlFor = field.id;
        label.className = `block mb-1 ${field.required ? 'relative pr-2' : ''}`;
        label.style.color = labelColor;
        label.style.fontSize = labelFontSize;
        label.style.fontWeight = labelFontWeight;
        label.style.fontFamily = fontFamily;
        
        // Label text
        const labelText = field.label || (isRTL ? 'حقل نصي' : 'Text field');
        label.appendChild(document.createTextNode(labelText));
        
        // Required asterisk
        if (field.required) {
          const required = document.createElement('span');
          required.className = 'text-red-500 absolute right-0 top-0';
          required.textContent = '*';
          label.appendChild(required);
        }
        
        container.appendChild(label);
      }
      
      // Create input wrapper for positioning icon
      const inputWrapper = document.createElement('div');
      inputWrapper.className = 'relative';
      
      // Add icon if needed and handle RTL direction
      if (showIcon && field.icon && field.icon !== 'none') {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 codform-field-icon';
        iconWrapper.style.visibility = 'visible';
        
        // Adjust position based on language
        if (isRTL) {
          iconWrapper.style.left = 'auto';
          iconWrapper.style.right = '12px';
        } else {
          iconWrapper.style.left = '12px';
          iconWrapper.style.right = 'auto';
        }
        
        // Insert SVG icon based on icon name
        const iconSvg = createIconSvg(field.icon);
        if (iconSvg) {
          iconWrapper.innerHTML = iconSvg;
          inputWrapper.appendChild(iconWrapper);
        }
      }
      
      // Create input element
      const input = document.createElement('input');
      input.type = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text';
      input.id = field.id;
      input.placeholder = field.placeholder || '';
      input.name = field.id;
      input.className = 'w-full outline-none transition-all codform-input';
      
      // Set aria-label
      input.setAttribute('aria-label', field.inputFor || field.label || (isRTL ? 'حقل نصي' : 'Text field'));
      
      // Apply styles
      input.style.color = textColor;
      input.style.fontSize = fontSize;
      input.style.fontWeight = fontWeight;
      input.style.fontFamily = fontFamily;
      input.style.backgroundColor = backgroundColor;
      input.style.borderColor = borderColor;
      input.style.borderRadius = borderRadius;
      input.style.borderWidth = borderWidth;
      input.style.borderStyle = 'solid';
      input.style.paddingTop = paddingY;
      input.style.paddingBottom = paddingY;
      
      // Adjust padding based on icon presence and RTL
      if (showIcon && field.icon && field.icon !== 'none') {
        if (isRTL) {
          input.style.paddingRight = '2.5rem';
          input.style.paddingLeft = '0.75rem';
        } else {
          input.style.paddingLeft = '2.5rem';
          input.style.paddingRight = '0.75rem';
        }
      } else {
        input.style.paddingLeft = '0.75rem';
        input.style.paddingRight = '0.75rem';
      }
      
      input.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
      input.style.marginBottom = '0';
      
      // Add required attribute if needed
      if (field.required) {
        input.required = true;
      }
      
      // Add input to wrapper
      inputWrapper.appendChild(input);
      container.appendChild(inputWrapper);
      
      // Add help text if exists
      if (field.helpText) {
        const helpText = document.createElement('p');
        helpText.className = 'mt-1 text-xs text-gray-500 codform-help-text';
        helpText.textContent = field.helpText;
        container.appendChild(helpText);
      }
      
      // Add error message container if field is required
      if (field.errorMessage && field.required) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'hidden error-message text-sm text-red-500 mt-1 codform-error-message';
        errorDiv.textContent = field.errorMessage;
        container.appendChild(errorDiv);
      }
      
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating input field:', error);
      return null;
    }
  }
  
  // Create a title field
  function createTitleField(field, formStyle, isRTL) {
    try {
      const fieldStyle = field.style || {};
      
      // Extract description from field
      const description = field.helpText || '';
      
      // Get text alignment with RTL support
      const defaultAlignment = isRTL ? 'right' : 'left';
      const alignment = fieldStyle.textAlign || defaultAlignment;
      
      // Check if it's a form title
      const isFormTitle = field.type === 'form-title';
      
      // Use consistent pixel values
      const fontSize = isFormTitle ? '24px' : '20px';
      const descriptionFontSize = '14px';
      
      // Get background color
      const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
      
      // Create the container
      const container = document.createElement('div');
      container.id = `title-field-${field.id}-${Date.now()}`;
      container.className = `mb-4 ${isFormTitle ? 'codform-title' : ''}`;
      container.dir = isRTL ? 'rtl' : 'ltr';
      
      // Add data attributes
      container.dataset.testid = 'title-field';
      container.dataset.titleAlign = alignment;
      container.dataset.hasBg = 'true';
      container.dataset.titleColor = fieldStyle.color || '#ffffff';
      container.dataset.bgColor = backgroundColor;
      container.dataset.fontFamily = fieldStyle.fontFamily || '';
      container.dataset.fieldType = field.type;
      container.dataset.fontSize = fieldStyle.fontSize || fontSize;
      container.dataset.fontWeight = fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium');
      container.dataset.descFontSize = fieldStyle.descriptionFontSize || descriptionFontSize;
      container.dataset.descFontWeight = 'normal';
      
      // Create background container
      const backgroundContainer = document.createElement('div');
      backgroundContainer.className = 'codform-title-container';
      backgroundContainer.style.backgroundColor = backgroundColor;
      backgroundContainer.style.padding = '16px';
      backgroundContainer.style.borderRadius = formStyle.borderRadius || '8px';
      backgroundContainer.style.width = '100%';
      backgroundContainer.style.boxSizing = 'border-box';
      backgroundContainer.style.marginBottom = '16px';
      
      // Create title
      const title = document.createElement('h3');
      title.className = isFormTitle ? 'codform-form-title' : '';
      title.style.color = fieldStyle.color || '#ffffff';
      title.style.fontSize = fieldStyle.fontSize || fontSize;
      title.style.textAlign = alignment;
      title.style.fontWeight = fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium');
      title.style.fontFamily = fieldStyle.fontFamily || 'inherit';
      title.style.margin = '0';
      title.style.padding = '0';
      title.style.lineHeight = '1.3';
      title.textContent = field.label;
      
      backgroundContainer.appendChild(title);
      
      // Add description if exists
      if (description) {
        const desc = document.createElement('p');
        desc.className = 'codform-title-description';
        desc.style.color = fieldStyle.descriptionColor || '#ffffff';
        desc.style.fontSize = fieldStyle.descriptionFontSize || descriptionFontSize;
        desc.style.margin = '8px 0 0 0';
        desc.style.padding = '0';
        desc.style.textAlign = alignment;
        desc.style.fontFamily = fieldStyle.fontFamily || 'inherit';
        desc.style.fontWeight = 'normal';
        desc.style.lineHeight = '1.5';
        desc.textContent = description;
        
        backgroundContainer.appendChild(desc);
      }
      
      container.appendChild(backgroundContainer);
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating title field:', error);
      return null;
    }
  }
  
  // Create a textarea field
  function createTextAreaField(field, formStyle, isRTL) {
    try {
      const container = document.createElement('div');
      container.className = "mb-4";
      
      const fieldStyle = field.style || {};
      
      // Set default values for border styling
      const inputBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
      const inputBorderWidth = fieldStyle.borderWidth || '1px';
      
      // Set default rows
      const rows = field.rows || 4;
      
      // Create label
      const label = document.createElement('label');
      label.htmlFor = field.id;
      label.className = `block mb-2 ${field.required ? 'relative pr-2' : ''}`;
      label.style.color = fieldStyle.labelColor || '#334155';
      label.style.fontSize = fieldStyle.labelFontSize || formStyle.fontSize || '1rem';
      label.style.fontWeight = '500';
      
      // Label text
      const labelText = field.label || (isRTL ? 'ملاحظات إضافية' : 'Additional notes');
      label.appendChild(document.createTextNode(labelText));
      
      // Required asterisk
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'text-red-500 absolute right-0 top-0';
        required.textContent = '*';
        label.appendChild(required);
      }
      
      container.appendChild(label);
      
      // Create textarea
      const textarea = document.createElement('textarea');
      textarea.id = field.id;
      textarea.name = field.id;
      textarea.rows = rows;
      textarea.placeholder = field.placeholder || '';
      textarea.className = 'w-full py-2 px-3 bg-white border outline-none focus:ring-2 focus:ring-opacity-50 transition-all';
      
      // Apply styles
      textarea.style.color = fieldStyle.color || '#1f2937';
      textarea.style.fontSize = fieldStyle.fontSize || formStyle.fontSize || '1rem';
      textarea.style.borderColor = fieldStyle.borderColor || '#d1d5db';
      textarea.style.borderRadius = inputBorderRadius;
      textarea.style.borderWidth = inputBorderWidth;
      textarea.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
      
      // Add required attribute if needed
      if (field.required) {
        textarea.required = true;
      }
      
      container.appendChild(textarea);
      
      // Add help text if exists
      if (field.helpText) {
        const helpText = document.createElement('p');
        helpText.className = 'mt-1 text-sm text-gray-500';
        helpText.textContent = field.helpText;
        container.appendChild(helpText);
      }
      
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating textarea field:', error);
      return null;
    }
  }
  
  // Create a radio group field
  function createRadioGroupField(field, formStyle, isRTL) {
    try {
      const container = document.createElement('div');
      container.className = "mb-4";
      
      const fieldStyle = field.style || {};
      
      // Create label
      const label = document.createElement('label');
      label.className = `block mb-2 ${field.required ? 'relative pr-2' : ''}`;
      label.style.color = fieldStyle.labelColor || '#334155';
      label.style.fontSize = fieldStyle.labelFontSize || formStyle.fontSize || '1rem';
      label.style.fontWeight = '500';
      
      // Label text
      const labelText = field.label || (isRTL ? 'اختيار واحد' : 'Single choice');
      label.appendChild(document.createTextNode(labelText));
      
      // Required asterisk
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'text-red-500 absolute right-0 top-0';
        required.textContent = '*';
        label.appendChild(required);
      }
      
      container.appendChild(label);
      
      // Create options container
      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'space-y-2';
      
      // Ensure options are available and have correct format
      const options = Array.isArray(field.options) ? field.options : [];
      
      // Create radio options
      options.forEach((option, index) => {
        const optionContainer = document.createElement('div');
        optionContainer.className = 'flex items-center';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.id = `${field.id}-${index}`;
        input.name = field.id;
        input.value = option.value;
        input.className = 'mr-2 h-4 w-4 text-blue-600';
        input.style.borderColor = fieldStyle.borderColor || '#d1d5db';
        input.style.accentColor = fieldStyle.color || formStyle.primaryColor || '#9b87f5';
        
        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = `${field.id}-${index}`;
        optionLabel.style.color = fieldStyle.color || '#1f2937';
        optionLabel.style.fontSize = fieldStyle.fontSize || formStyle.fontSize || '1rem';
        optionLabel.textContent = option.label;
        
        optionContainer.appendChild(input);
        optionContainer.appendChild(optionLabel);
        optionsContainer.appendChild(optionContainer);
      });
      
      container.appendChild(optionsContainer);
      
      // Add help text if exists
      if (field.helpText) {
        const helpText = document.createElement('p');
        helpText.className = 'mt-1 text-sm text-gray-500';
        helpText.textContent = field.helpText;
        container.appendChild(helpText);
      }
      
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating radio group field:', error);
      return null;
    }
  }
  
  // Create a checkbox group field
  function createCheckboxGroupField(field, formStyle, isRTL) {
    try {
      const container = document.createElement('div');
      container.className = "mb-6";
      
      const fieldStyle = field.style || {};
      
      // Create label if exists
      if (field.label) {
        const label = document.createElement('label');
        label.className = 'block font-medium mb-2';
        label.style.color = fieldStyle.labelColor || '#374151';
        label.style.fontSize = fieldStyle.labelFontSize || formStyle.fontSize;
        label.textContent = field.label;
        
        // Required asterisk
        if (field.required) {
          const required = document.createElement('span');
          required.className = 'text-red-500 ml-1';
          required.textContent = '*';
          label.appendChild(required);
        }
        
        container.appendChild(label);
      }
      
      // Create options container
      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'space-y-2';
      
      // Check if options is an array and if not, create a default array
      const options = Array.isArray(field.options) 
        ? field.options 
        : [
            { value: 'option1', label: isRTL ? 'الخيار الأول' : 'First Option' },
            { value: 'option2', label: isRTL ? 'الخيار الثاني' : 'Second Option' }
          ];
      
      // Create checkbox options
      options.forEach((option, index) => {
        const optionContainer = document.createElement('div');
        optionContainer.className = 'flex items-center';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `${field.id}-option-${index}`;
        input.name = field.id;
        input.value = typeof option === 'string' ? option : option.value;
        input.className = 'rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4';
        input.style.accentColor = formStyle.primaryColor || '#9b87f5';
        
        // Set default checked state
        if (field.defaultValue === (typeof option === 'string' ? option : option.value)) {
          input.checked = true;
        }
        
        // Set disabled state
        if (field.disabled) {
          input.disabled = true;
        }
        
        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = `${field.id}-option-${index}`;
        optionLabel.className = 'ml-2 block';
        optionLabel.style.color = fieldStyle.color || '#374151';
        optionLabel.style.fontSize = fieldStyle.fontSize || formStyle.fontSize;
        optionLabel.textContent = typeof option === 'string' ? option : option.label;
        
        optionContainer.appendChild(input);
        optionContainer.appendChild(optionLabel);
        optionsContainer.appendChild(optionContainer);
      });
      
      container.appendChild(optionsContainer);
      
      // Add help text if exists
      if (field.helpText) {
        const helpText = document.createElement('p');
        helpText.className = 'text-gray-500 text-sm mt-1';
        helpText.textContent = field.helpText;
        container.appendChild(helpText);
      }
      
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating checkbox group field:', error);
      return null;
    }
  }
  
  // Create HTML content
  function createHtmlContent(field, formStyle, isRTL) {
    try {
      const container = document.createElement('div');
      container.className = "mb-4";
      container.style.color = field.style?.color || 'inherit';
      container.style.fontSize = field.style?.fontSize || formStyle.fontSize;
      container.dir = isRTL ? 'rtl' : 'ltr';
      
      if (field.content) {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'html-content';
        contentDiv.innerHTML = field.content;
        container.appendChild(contentDiv);
      } else {
        const placeholder = document.createElement('p');
        placeholder.className = isRTL ? 'text-right' : 'text-left';
        placeholder.textContent = isRTL 
          ? 'أضف محتوى HTML هنا. يمكنك إضافة فقرات، صور، روابط وغيرها.'
          : 'Add HTML content here. You can add paragraphs, images, links and more.';
        container.appendChild(placeholder);
      }
      
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating HTML content:', error);
      return null;
    }
  }
  
  // Create cart items
  function createCartItems(field, formStyle, isRTL) {
    try {
      const container = document.createElement('div');
      container.className = "mb-6 codform-cart-items";
      
      const fieldStyle = field.style || {};
      
      // Use border radius from form style if available
      const borderRadius = formStyle.borderRadius || '0.5rem';
      
      // Check if we should show the title (default to true if not explicitly set to false)
      const showTitle = field.label !== '' && field.label !== undefined;
      
      if (showTitle) {
        const title = document.createElement('h3');
        title.className = 'text-lg font-medium mb-3';
        title.style.color = fieldStyle.color || '#1f2937';
        title.style.fontSize = fieldStyle.fontSize || formStyle.fontSize || '1.2rem';
        title.textContent = field.label || (isRTL ? 'المنتج المختار' : 'Selected Product');
        container.appendChild(title);
      }
      
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'border rounded-md overflow-hidden';
      itemsContainer.style.borderRadius = borderRadius;
      itemsContainer.style.direction = isRTL ? 'rtl' : 'ltr';
      
      // Create a sample cart item
      const cartItem = document.createElement('div');
      cartItem.className = 'flex items-center p-4 border-b codform-cart-item';
      cartItem.dataset.productItem = '';
      
      // Image container
      const imageContainer = document.createElement('div');
      imageContainer.className = 'w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 ml-4 flex items-center justify-center';
      imageContainer.style.borderRadius = '0.25rem';
      
      const image = document.createElement('img');
      image.src = 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=80&h=80&q=80';
      image.alt = 'Product';
      image.className = 'w-full h-full object-cover product-image';
      image.style.borderRadius = '0.25rem';
      
      // Add error handling for image
      image.onerror = function() {
        this.onerror = null;
        this.style.display = 'none';
        const iconElement = document.createElement('div');
        iconElement.className = 'w-full h-full flex items-center justify-center text-gray-400';
        iconElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
        this.parentElement.appendChild(iconElement);
      };
      
      imageContainer.appendChild(image);
      
      // Product details
      const detailsContainer = document.createElement('div');
      detailsContainer.className = 'flex-1';
      
      const productTitle = document.createElement('h4');
      productTitle.className = 'font-medium product-title';
      productTitle.style.fontSize = fieldStyle.fontSize || '1.1rem';
      productTitle.style.color = fieldStyle.color || '#1f2937';
      productTitle.textContent = isRTL ? 'منتج تجريبي' : 'Sample Product';
      
      const productQuantity = document.createElement('div');
      productQuantity.className = 'text-sm text-gray-500 mt-1 product-quantity';
      productQuantity.style.fontSize = fieldStyle.descriptionFontSize || '0.9rem';
      productQuantity.style.color = fieldStyle.descriptionColor || '#6b7280';
      productQuantity.textContent = isRTL ? 'الكمية: ١' : 'Quantity: 1';
      
      detailsContainer.appendChild(productTitle);
      detailsContainer.appendChild(productQuantity);
      
      // Price
      const priceContainer = document.createElement('div');
      priceContainer.className = 'text-right';
      
      const price = document.createElement('div');
      price.className = 'font-medium product-price';
      price.style.fontSize = fieldStyle.priceFontSize || '1rem';
      price.style.color = fieldStyle.priceColor || '#1f2937';
      price.textContent = '$99.00';
      
      priceContainer.appendChild(price);
      
      // Assemble cart item
      cartItem.appendChild(imageContainer);
      cartItem.appendChild(detailsContainer);
      cartItem.appendChild(priceContainer);
      
      itemsContainer.appendChild(cartItem);
      container.appendChild(itemsContainer);
      
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating cart items:', error);
      return null;
    }
  }
  
  // Create cart summary
  function createCartSummary(field, formStyle, isRTL) {
    try {
      const container = document.createElement('div');
      container.className = "mb-6 codform-cart-summary";
      
      const fieldStyle = field.style || {};
      
      // Use border radius from form style if available
      const borderRadius = formStyle.borderRadius || '0.5rem';
      
      // Check if we should show the title (default to true if not explicitly set to false)
      const showTitle = field.label !== '' && field.label !== undefined;
      
      if (showTitle) {
        const title = document.createElement('h3');
        title.className = 'text-lg font-medium mb-3';
        title.style.color = fieldStyle.color || '#1f2937';
        title.style.fontSize = fieldStyle.fontSize || formStyle.fontSize || '1.2rem';
        title.textContent = field.label || (isRTL ? 'ملخص الطلب' : 'Order Summary');
        container.appendChild(title);
      }
      
      const summaryContainer = document.createElement('div');
      summaryContainer.className = 'border rounded-md p-4';
      summaryContainer.style.borderRadius = borderRadius;
      summaryContainer.style.backgroundColor = fieldStyle.backgroundColor || '#f9fafb';
      summaryContainer.style.borderColor = fieldStyle.borderColor || '#e5e7eb';
      summaryContainer.style.direction = isRTL ? 'rtl' : 'ltr';
      
      // Subtotal row
      const subtotalRow = document.createElement('div');
      subtotalRow.className = 'flex justify-between mb-3';
      subtotalRow.dataset.productPriceDisplay = 'subtotal';
      
      const subtotalLabel = document.createElement('span');
      subtotalLabel.style.fontSize = fieldStyle.labelFontSize || '1rem';
      subtotalLabel.style.color = fieldStyle.labelColor || '#6b7280';
      subtotalLabel.textContent = isRTL ? 'المجموع الفرعي' : 'Subtotal';
      
      const subtotalValue = document.createElement('span');
      subtotalValue.style.fontSize = fieldStyle.valueFontSize || '1rem';
      subtotalValue.style.color = fieldStyle.valueColor || '#1f2937';
      subtotalValue.style.fontWeight = '500';
      subtotalValue.className = 'product-price';
      subtotalValue.textContent = '$99.00';
      
      subtotalRow.appendChild(subtotalLabel);
      subtotalRow.appendChild(subtotalValue);
      
      // Shipping row
      const shippingRow = document.createElement('div');
      shippingRow.className = 'flex justify-between mb-3';
      
      const shippingLabel = document.createElement('span');
      shippingLabel.style.fontSize = fieldStyle.labelFontSize || '1rem';
      shippingLabel.style.color = fieldStyle.labelColor || '#6b7280';
      shippingLabel.textContent = isRTL ? 'الشحن' : 'Shipping';
      
      const shippingValue = document.createElement('span');
      shippingValue.style.fontSize = fieldStyle.valueFontSize || '1rem';
      shippingValue.style.color = fieldStyle.valueColor || '#1f2937';
      shippingValue.style.fontWeight = '500';
      shippingValue.className = 'shipping-price';
      shippingValue.textContent = '$10.00';
      
      shippingRow.appendChild(shippingLabel);
      shippingRow.appendChild(shippingValue);
      
      // Total row
      const totalRow = document.createElement('div');
      totalRow.className = 'border-t pt-3 mt-3 flex justify-between';
      
      const totalLabel = document.createElement('span');
      totalLabel.style.fontSize = fieldStyle.totalLabelFontSize || '1.1rem';
      totalLabel.style.color = fieldStyle.totalLabelColor || '#1f2937';
      totalLabel.style.fontWeight = 'bold';
      totalLabel.textContent = isRTL ? 'الإجمالي' : 'Total';
      
      const totalValue = document.createElement('span');
      totalValue.style.fontSize = fieldStyle.totalValueFontSize || '1.1rem';
      totalValue.style.color = fieldStyle.totalValueColor || formStyle.primaryColor || '#9b87f5';
      totalValue.style.fontWeight = 'bold';
      totalValue.className = 'total-price';
      totalValue.textContent = '$109.00';
      
      totalRow.appendChild(totalLabel);
      totalRow.appendChild(totalValue);
      
      // Assemble summary
      summaryContainer.appendChild(subtotalRow);
      summaryContainer.appendChild(shippingRow);
      summaryContainer.appendChild(totalRow);
      
      container.appendChild(summaryContainer);
      
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating cart summary:', error);
      return null;
    }
  }
  
  // Create submit button
  function createSubmitButton(field, formStyle, isRTL) {
    try {
      const style = field.style || {};
      
      // Get animation class
      const getAnimationClass = () => {
        if (style.animation !== true) return '';
        
        const animationType = style.animationType || 'pulse';
        switch (animationType) {
          case 'pulse': return 'pulse-animation';
          case 'shake': return 'shake-animation';
          case 'bounce': return 'bounce-animation';
          case 'wiggle': return 'wiggle-animation';
          case 'flash': return 'flash-animation';
          default: return '';
        }
      };
      
      const animationClass = getAnimationClass();
      
      // Create button element
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `codform-submit-btn ${animationClass}`;
      
      // Set button styles
      button.style.backgroundColor = style.backgroundColor || formStyle.primaryColor || '#9b87f5';
      button.style.color = style.color || '#ffffff';
      button.style.fontSize = style.fontSize || '19px';
      button.style.fontWeight = style.fontWeight || 'bold';
      button.style.borderRadius = style.borderRadius || formStyle.borderRadius || '8px';
      button.style.borderColor = style.borderColor || 'transparent';
      button.style.borderWidth = style.borderWidth || '0px';
      button.style.borderStyle = 'solid';
      button.style.paddingTop = style.paddingY || '15px';
      button.style.paddingBottom = style.paddingY || '15px';
      button.style.paddingLeft = '20px';
      button.style.paddingRight = '20px';
      button.style.width = style.fullWidth === false ? 'auto' : '100%';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.gap = '8px';
      button.style.fontFamily = style.fontFamily || 'inherit';
      button.style.cursor = 'pointer';
      button.style.transition = 'all 0.2s ease';
      button.style.marginTop = '0px';
      
      // Set direction
      button.dir = isRTL ? 'rtl' : 'ltr';
      
      // Add data attributes
      button.dataset.animationType = style.animationType || 'none';
      button.dataset.buttonStyle = formStyle.buttonStyle || 'rounded';
      
      // Icon rendering
      const renderIcon = () => {
        if (!style.showIcon) return null;
        
        return createIconSvg(style.icon?.toLowerCase());
      };
      
      // Determine icon position
      const iconPosition = style.iconPosition || 'right';
      const iconSvg = renderIcon();
      
      // Button content with proper order based on icon position and RTL
      const buttonContent = document.createElement('div');
      buttonContent.style.display = 'flex';
      buttonContent.style.alignItems = 'center';
      buttonContent.style.justifyContent = 'center';
      buttonContent.style.gap = '8px';
      buttonContent.style.width = '100%';
      
      // Label span
      const labelSpan = document.createElement('span');
      labelSpan.textContent = field.label || (isRTL ? 'إرسال الطلب' : 'Submit Order');
      
      // Add icon and text in the right order
      if ((iconPosition === 'left' && !isRTL) || (iconPosition === 'right' && isRTL)) {
        if (iconSvg) {
          const iconContainer = document.createElement('span');
          iconContainer.innerHTML = iconSvg;
          buttonContent.appendChild(iconContainer);
        }
        buttonContent.appendChild(labelSpan);
      } else {
        buttonContent.appendChild(labelSpan);
        if (iconSvg) {
          const iconContainer = document.createElement('span');
          iconContainer.innerHTML = iconSvg;
          buttonContent.appendChild(iconContainer);
        }
      }
      
      button.appendChild(buttonContent);
      return button;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating submit button:', error);
      return null;
    }
  }
  
  // Create WhatsApp button
  function createWhatsAppButton(field, formStyle, isRTL) {
    try {
      const container = document.createElement('div');
      container.className = "mb-4";
      
      const fieldStyle = field.style || {};
      
      // Get WhatsApp number from the field
      const whatsappNumber = field.whatsappNumber || '';
      
      // Default message
      const message = field.message || '';
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
      
      // Determine button radius based on style
      let buttonRadius = '0.5rem'; // default
      if (formStyle.buttonStyle === 'pill') {
        buttonRadius = '9999px';
      } else if (formStyle.buttonStyle === 'square') {
        buttonRadius = '0';
      } else {
        buttonRadius = formStyle.borderRadius || '0.5rem';
      }
      
      // Create button
      const button = document.createElement('a');
      button.href = whatsappUrl;
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
      button.className = 'w-full py-3 px-4 flex items-center justify-center gap-2 text-white font-medium transition-all duration-200 hover:opacity-90';
      
      // Apply styles
      button.style.backgroundColor = fieldStyle.backgroundColor || '#25D366';
      button.style.color = fieldStyle.color || 'white';
      button.style.fontSize = fieldStyle.fontSize || formStyle.fontSize || '1.1rem';
      button.style.borderRadius = fieldStyle.borderRadius || buttonRadius;
      button.style.textDecoration = 'none';
      button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.gap = '8px';
      
      // Add icon
      const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
      const iconSpan = document.createElement('span');
      iconSpan.innerHTML = iconSvg;
      
      // Add text
      const textSpan = document.createElement('span');
      textSpan.textContent = field.label || (isRTL ? 'تواصل عبر واتساب' : 'Contact via WhatsApp');
      
      button.appendChild(iconSpan);
      button.appendChild(textSpan);
      
      container.appendChild(button);
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating WhatsApp button:', error);
      return null;
    }
  }
  
  // Create image field
  function createImageField(field, formStyle, isRTL) {
    try {
      const container = document.createElement('div');
      container.className = "mb-4";
      
      const fieldStyle = field.style || {};
      
      // Use image source or placeholder
      const imageSrc = field.src || 'https://via.placeholder.com/800x400?text=Image';
      const imageAlt = field.alt || (isRTL ? 'صورة' : 'Image');
      
      // Get width from field or default to 100%
      const imageWidth = field.width || '100%';
      
      // Set border radius for the image
      const imageBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
      
      // Add label if exists
      if (field.label) {
        const label = document.createElement('div');
        label.className = 'mb-2';
        label.style.color = fieldStyle.labelColor || '#334155';
        label.style.fontSize = fieldStyle.labelFontSize || formStyle.fontSize || '1rem';
        label.style.fontWeight = '500';
        label.textContent = field.label;
        container.appendChild(label);
      }
      
      // Create image container
      const imageContainer = document.createElement('div');
      imageContainer.className = 'overflow-hidden';
      imageContainer.style.maxWidth = '100%';
      imageContainer.style.width = imageWidth;
      imageContainer.style.margin = '0 auto';
      imageContainer.style.borderRadius = imageBorderRadius;
      
      // Create image
      const image = document.createElement('img');
      image.src = imageSrc;
      image.alt = imageAlt;
      image.className = 'w-full h-auto';
      image.style.objectFit = 'cover';
      image.style.display = 'block';
      
      imageContainer.appendChild(image);
      container.appendChild(imageContainer);
      
      // Add help text if exists
      if (field.helpText) {
        const helpText = document.createElement('p');
        helpText.className = 'mt-1 text-sm text-gray-500';
        helpText.textContent = field.helpText;
        container.appendChild(helpText);
      }
      
      return container;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating image field:', error);
      return null;
    }
  }
  
  // Create step indicator for multi-step forms
  function createStepIndicator(form, currentStep, totalSteps) {
    try {
      const stepContainer = document.createElement('div');
      stepContainer.className = 'px-4 py-2 bg-gray-50';
      
      const stepsWrapper = document.createElement('div');
      stepsWrapper.className = 'flex items-center';
      
      const stepsInner = document.createElement('div');
      stepsInner.className = 'flex-1 flex';
      
      // Create steps
      for (let i = 0; i < totalSteps; i++) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'flex-1 flex items-center';
        
        // Add line before step indicator (except for first step)
        if (i > 0) {
          const lineBeforeDiv = document.createElement('div');
          lineBeforeDiv.className = i < currentStep ? 'h-2 flex-1 bg-[var(--form-primary-color)]' : 'h-2 flex-1 bg-gray-200';
          stepDiv.appendChild(lineBeforeDiv);
        }
        
        // Step indicator circle
        const stepIndicator = document.createElement('div');
        
        if (i + 1 === currentStep) {
          stepIndicator.className = 'rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium bg-[var(--form-primary-color)] text-white';
        } else if (i < currentStep) {
          stepIndicator.className = 'rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium bg-[var(--form-primary-color)] text-white';
        } else {
          stepIndicator.className = 'rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium bg-gray-200 text-gray-600';
        }
        
        stepIndicator.textContent = (i + 1).toString();
        stepDiv.appendChild(stepIndicator);
        
        // Add line after step indicator (except for last step)
        if (i < totalSteps - 1) {
          const lineAfterDiv = document.createElement('div');
          lineAfterDiv.className = i + 1 < currentStep ? 'h-2 flex-1 bg-[var(--form-primary-color)]' : 'h-2 flex-1 bg-gray-200';
          stepDiv.appendChild(lineAfterDiv);
        }
        
        stepsInner.appendChild(stepDiv);
      }
      
      stepsWrapper.appendChild(stepsInner);
      stepContainer.appendChild(stepsWrapper);
      form.prepend(stepContainer);
    } catch (error) {
      if (DEBUG_MODE) console.error('Error creating step indicator:', error);
    }
  }
  
  // Initialize form functionality
  function initializeFormFunctionality(container, formData) {
    try {
      const form = container.querySelector('form');
      if (!form) return;
      
      // Find submit button
      const submitButton = form.querySelector('.codform-submit-btn');
      if (submitButton) {
        submitButton.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Validate form
          const isValid = validateForm(form);
          
          if (isValid) {
            // Collect form data
            const formValues = collectFormData(form);
            
            // Submit form data
            submitFormData(formValues, formData, container);
          }
        });
      }
      
      // Add input validation listeners
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('blur', function() {
          validateField(input);
        });
      });
    } catch (error) {
      if (DEBUG_MODE) console.error('Error initializing form functionality:', error);
    }
  }
  
  // Validate the entire form
  function validateForm(form) {
    try {
      let isValid = true;
      const inputs = form.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        if (!validateField(input)) {
          isValid = false;
        }
      });
      
      return isValid;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error validating form:', error);
      return false;
    }
  }
  
  // Validate a single field
  function validateField(field) {
    try {
      if (!field.required) return true;
      
      let isValid = true;
      const errorMessage = field.closest('div').querySelector('.codform-error-message');
      
      // Check if field is empty
      if (field.value.trim() === '') {
        isValid = false;
      }
      
      // Check email format
      if (field.type === 'email' && field.value.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
          isValid = false;
        }
      }
      
      // Show/hide error message
      if (errorMessage) {
        if (!isValid) {
          errorMessage.classList.remove('hidden');
        } else {
          errorMessage.classList.add('hidden');
        }
      }
      
      return isValid;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error validating field:', error);
      return true; // Default to valid to prevent blocking submission
    }
  }
  
  // Collect form data
  function collectFormData(form) {
    try {
      const formData = {};
      const inputs = form.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        if (input.type === 'radio' || input.type === 'checkbox') {
          if (input.checked) {
            if (formData[input.name]) {
              if (Array.isArray(formData[input.name])) {
                formData[input.name].push(input.value);
              } else {
                formData[input.name] = [formData[input.name], input.value];
              }
            } else {
              formData[input.name] = input.value;
            }
          }
        } else {
          formData[input.name] = input.value;
        }
      });
      
      return formData;
    } catch (error) {
      if (DEBUG_MODE) console.error('Error collecting form data:', error);
      return {};
    }
  }
  
  // Submit form data
  function submitFormData(formValues, formData, container) {
    try {
      // Show loading state
      const submitButton = container.querySelector('.codform-submit-btn');
      if (submitButton) {
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;
      }
      
      // TODO: Implement actual form submission logic
      console.log('Form data to submit:', formValues);
      
      // Simulate submission delay
      setTimeout(() => {
        // Reset button state
        if (submitButton) {
          submitButton.textContent = 'Submitted!';
          submitButton.disabled = false;
        }
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'p-4 mt-4 bg-green-100 text-green-800 rounded-md';
        successMessage.textContent = 'Form submitted successfully!';
        container.appendChild(successMessage);
      }, 1500);
    } catch (error) {
      if (DEBUG_MODE) console.error('Error submitting form data:', error);
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'p-4 mt-4 bg-red-100 text-red-800 rounded-md';
      errorMessage.textContent = 'An error occurred while submitting the form. Please try again.';
      container.appendChild(errorMessage);
      
      // Reset button state
      const submitButton = container.querySelector('.codform-submit-btn');
      if (submitButton) {
        submitButton.textContent = 'Submit';
        submitButton.disabled = false;
      }
    }
  }
  
  // Helper function to create SVG icons
  function createIconSvg(iconName) {
    if (!iconName) return null;
    
    // Base SVG attributes
    const baseAttrs = 'xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"';
    
    switch (iconName) {
      case 'user':
        return `<svg ${baseAttrs}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
      case 'phone':
        return `<svg ${baseAttrs}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
      case 'map-pin':
        return `<svg ${baseAttrs}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      case 'mail':
        return `<svg ${baseAttrs}><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`;
      case 'message-square':
        return `<svg ${baseAttrs}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
      case 'check-square':
        return `<svg ${baseAttrs}><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`;
      case 'circle-check':
        return `<svg ${baseAttrs}><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>`;
      case 'image':
        return `<svg ${baseAttrs}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>`;
      case 'file-text':
        return `<svg ${baseAttrs}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>`;
      case 'shopping-cart':
        return `<svg ${baseAttrs}><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>`;
      case 'arrow-right':
        return `<svg ${baseAttrs}><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`;
      case 'check':
        return `<svg ${baseAttrs}><path d="M20 6 9 17l-5-5"></path></svg>`;
      case 'send':
        return `<svg ${baseAttrs}><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>`;
      case 'cart':
        return `<svg ${baseAttrs}><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>`;
      default:
        return null;
    }
  }
  
  // Add CSS needed for animations and visual elements
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse-animation {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    @keyframes shake-animation {
      0% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes bounce-animation {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    
    @keyframes wiggle-animation {
      0%, 100% { transform: rotate(0); }
      25% { transform: rotate(-3deg); }
      75% { transform: rotate(3deg); }
    }
    
    @keyframes flash-animation {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    .pulse-animation {
      animation: pulse-animation 2s infinite ease-in-out !important;
    }
    
    .shake-animation {
      animation: shake-animation 2s infinite ease-in-out !important;
    }
    
    .bounce-animation {
      animation: bounce-animation 2s infinite ease-in-out !important;
    }
    
    .wiggle-animation {
      animation: wiggle-animation 2s infinite ease-in-out !important;
    }
    
    .flash-animation {
      animation: flash-animation 2s infinite ease-in-out !important;
    }

    /* Critical styling for icon visibility */
    .codform-field-icon {
      visibility: visible !important;
      opacity: 1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    /* RTL text alignment */
    [dir="rtl"] .codform-title-container h3,
    [dir="rtl"] .codform-title-container p {
      text-align: right !important;
    }
    
    [dir="ltr"] .codform-title-container h3,
    [dir="ltr"] .codform-title-container p {
      text-align: left !important;
    }

    /* Force consistent styling */
    .codform-title-container {
      padding: 16px !important;
      margin-bottom: 16px !important;
      box-sizing: border-box !important;
      width: 100% !important;
    }
    
    .codform-form-title, .codform-title-description {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    .codform-title-description {
      margin-top: 8px !important;
    }
  `;
  document.head.appendChild(style);
  
})();

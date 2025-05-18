// Function to load the form dynamically
function loadCodForm(formId, productId, containerId, hideHeader) {
  const formContainer = document.getElementById(containerId);
  const formLoader = document.getElementById(`codform-form-loader-${containerId.split('-').pop()}`);
  const formElement = document.getElementById(`codform-form-${containerId.split('-').pop()}`);
  const successElement = document.getElementById(`codform-success-${containerId.split('-').pop()}`);
  const errorElement = document.getElementById(`codform-error-${containerId.split('-').pop()}`);
  const retryButton = document.getElementById(`codform-retry-${containerId.split('-').pop()}`);

  if (!formContainer || !formLoader || !formElement || !successElement || !errorElement) {
    console.error('Required elements not found in the DOM.');
    return;
  }

  formLoader.style.display = 'flex';
  formElement.style.display = 'none';
  successElement.style.display = 'none';
  errorElement.style.display = 'none';

  const apiUrl = `https://lovassy.com/api/forms/${formId}/render?product_id=${productId}&shopify=true&hide_header=${hideHeader}`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(formData => {
      formLoader.style.display = 'none';
      formElement.style.display = 'block';
      formElement.innerHTML = '';

      if (!formData || !formData.fields) {
        console.error('No form data received.');
        errorElement.style.display = 'block';
        return;
      }

      // Inject CSS for button styling and animations immediately when form loads
      injectButtonStyling(formData);
      injectAnimationStyles();

      const form = document.createElement('form');
      form.className = 'codform';
      form.id = 'codform-' + containerId.split('-').pop();
      form.setAttribute('data-form-id', formId);

      formData.fields.forEach(field => {
        const formControl = createFormControl(formData, field);
        form.appendChild(formControl);
      });

      const submitButton = createSubmitButton(formData, formData.fields.find(f => f.type === 'submit') || {
        type: 'submit',
        label: formData.language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {}
      });
      form.appendChild(submitButton);

      formElement.appendChild(form);

      form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitForm(formId, productId, form, successElement, errorElement, formElement);
      });
    })
    .catch(error => {
      console.error('Form loading error:', error);
      formLoader.style.display = 'none';
      errorElement.style.display = 'block';
    });

  if (retryButton) {
    retryButton.addEventListener('click', function() {
      loadCodForm(formId, productId, containerId, hideHeader);
    });
  }
}

// Create form control element
function createFormControl(formData, field) {
  const formControl = document.createElement('div');
  formControl.className = 'form-control';

  let label = document.createElement('label');
  label.className = 'form-label';
  label.textContent = field.label;
  label.htmlFor = field.id;
  formControl.appendChild(label);

  let input;
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      input = document.createElement('input');
      input.type = field.type === 'email' ? 'email' : (field.type === 'phone' ? 'tel' : 'text');
      input.className = 'form-input';
      input.id = field.id;
      input.name = field.id;
      input.placeholder = field.placeholder || '';
      break;
    case 'textarea':
      input = document.createElement('textarea');
      input.className = 'form-input';
      input.id = field.id;
      input.name = field.id;
      input.placeholder = field.placeholder || '';
      break;
    case 'radio':
      field.options.forEach(option => {
        let radioLabel = document.createElement('label');
        radioLabel.className = 'radio-label';

        let radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = field.id;
        radioInput.value = option.value;

        radioLabel.appendChild(radioInput);
        radioLabel.append(option.label);
        formControl.appendChild(radioLabel);
      });
      break;
    case 'checkbox':
      field.options.forEach(option => {
        let checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'checkbox-label';

        let checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.name = field.id;
        checkboxInput.value = option.value;

        checkboxLabel.appendChild(checkboxInput);
        checkboxLabel.append(option.label);
        formControl.appendChild(checkboxLabel);
      });
      break;
    default:
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input';
      input.id = field.id;
      input.name = field.id;
      input.placeholder = field.placeholder || '';
      break;
  }

  if (input) {
    formControl.appendChild(input);
  }

  return formControl;
}

// Create submit button function with fixed color handling that mirrors title field approach
function createSubmitButton(formData, field) {
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'codform-submit-btn';
  
  // Get field style or initialize if not present
  const style = field.style || {};
  
  // CRITICAL FIX: Use explicit approach for button background color - same as title fields
  // Get backgroundColor from field style first, then form style, then fallback
  const backgroundColor = style.backgroundColor || formData.formStyle?.primaryColor || '#9b87f5';
  
  // Debug: Log detailed button styling to help track the issue
  console.log('Shopify store: Submit button rendered with ID:', field.id);
  console.log('Shopify store: Submit button backgroundColor =', backgroundColor);
  console.log('Shopify store: Raw field style =', JSON.stringify(style, null, 2));
  console.log('Shopify store: Form primary color =', formData.formStyle?.primaryColor);
  
  // Set CSS variable for background color - mirrors approach used with title fields
  const rootStyles = document.documentElement.style;
  rootStyles.setProperty('--button-bg-color', backgroundColor);
  
  // Set button styles with guaranteed background color through CSS variable
  submitButton.style.backgroundColor = 'var(--button-bg-color)';
  submitButton.style.backgroundColor = backgroundColor; // Direct backup application
  submitButton.style.color = style.color || '#ffffff';
  submitButton.style.fontSize = style.fontSize || '19px';
  submitButton.style.fontWeight = style.fontWeight || 'bold';
  submitButton.style.borderRadius = style.borderRadius || formData.formStyle?.borderRadius || '8px';
  submitButton.style.border = style.borderWidth ? 
    `${style.borderWidth} solid ${style.borderColor || 'transparent'}` : 
    '0px solid transparent';
  submitButton.style.padding = `${style.paddingY || '15px'} 20px`;
  submitButton.style.width = style.fullWidth === false ? 'auto' : '100%';
  submitButton.style.display = 'flex';
  submitButton.style.alignItems = 'center';
  submitButton.style.justifyContent = 'center'; 
  submitButton.style.gap = '8px';
  submitButton.style.fontFamily = style.fontFamily || 'inherit';
  submitButton.style.cursor = 'pointer';
  submitButton.style.transition = 'all 0.2s ease';
  submitButton.style.marginTop = '15px';
  
  // Set data attributes for additional styling
  submitButton.dataset.animationType = style.animationType || 'none';
  submitButton.dataset.buttonStyle = formData.formStyle?.buttonStyle || 'rounded';
  submitButton.dataset.buttonBgColor = backgroundColor;
  submitButton.dataset.bgColor = backgroundColor.replace('#', ''); // Add hex color without # for reference
  
  // Create button content
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.alignItems = 'center';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.width = '100%';
  buttonContainer.style.gap = '8px';
  buttonContainer.style.direction = formData.language === 'ar' ? 'rtl' : 'ltr';
  
  // Add animation class if animation is enabled
  if (style.animation === true) {
    const animationType = style.animationType || 'pulse';
    submitButton.classList.add(`${animationType}-animation`);
  }
  
  // Show icon if configured
  if (style.showIcon && style.icon && style.icon !== 'none') {
    const iconSvg = createIconElement(style.icon, style.color || '#ffffff');
    if (style.iconPosition === 'left') {
      buttonContainer.appendChild(iconSvg);
    }
    
    const textSpan = document.createElement('span');
    textSpan.textContent = field.label || (formData.language === 'ar' ? 'إرسال الطلب' : 'Submit Order');
    buttonContainer.appendChild(textSpan);
    
    if (style.iconPosition !== 'left') {
      buttonContainer.appendChild(iconSvg);
    }
  } else {
    // No icon, just text
    const textSpan = document.createElement('span');
    textSpan.textContent = field.label || (formData.language === 'ar' ? 'إرسال الطلب' : 'Submit Order');
    buttonContainer.appendChild(textSpan);
  }
  
  submitButton.appendChild(buttonContainer);
  
  return submitButton;
}

// Create icon element function
function createIconElement(iconName, iconColor) {
  const iconContainer = document.createElement('div');
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.style.justifyContent = 'center';
  
  // Set SVG based on icon name
  let svgContent = '';
  switch(iconName.toLowerCase()) {
    case 'shopping-cart':
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`;
      break;
    case 'arrow-right':
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      break;
    case 'check':
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      break;
    case 'send':
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
      break;
    default:
      // Default to shopping cart
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`;
  }
  
  iconContainer.innerHTML = svgContent;
  return iconContainer;
}

// Inject button styling CSS to the page
function injectButtonStyling(formData) {
  // Find existing style element or create a new one
  let styleElement = document.getElementById('codform-button-styles');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'codform-button-styles';
    document.head.appendChild(styleElement);
  }
  
  // Get primary color from form style
  const primaryColor = formData.formStyle?.primaryColor || '#9b87f5';
  
  // Find submit button settings if available
  const submitButtonField = formData.fields.find(f => f.type === 'submit');
  const buttonColor = submitButtonField?.style?.backgroundColor || primaryColor;
  
  // Create CSS for button styling that will apply to all buttons
  styleElement.textContent = `
    .codform-submit-btn {
      background-color: ${buttonColor} !important;
      transition: all 0.3s ease;
    }
    
    /* Add hover effect */
    .codform-submit-btn:hover {
      background-color: ${adjustColor(buttonColor, -10)} !important;
    }
  `;
  
  console.log('Shopify store: Button styling injected with color:', buttonColor);
}

// Helper function to darken/lighten a color
function adjustColor(color, percent) {
  // Convert color to RGB
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  // Adjust each component
  r = Math.max(Math.min(Math.round(r * (1 + percent / 100)), 255), 0);
  g = Math.max(Math.min(Math.round(g * (1 + percent / 100)), 255), 0);
  b = Math.max(Math.min(Math.round(b * (1 + percent / 100)), 255), 0);

  // Convert back to hex
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Make sure to add or update the animation styles in the CSS or inject them
function injectAnimationStyles() {
  const style = document.createElement('style');
  style.id = 'codform-animation-styles';
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
      0% { transform: rotate(0); }
      25% { transform: rotate(-3deg); }
      75% { transform: rotate(3deg); }
    }
    
    @keyframes flash-animation {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    .pulse-animation {
      animation: pulse-animation 2s infinite ease-in-out;
    }
    
    .shake-animation {
      animation: shake-animation 2s infinite ease-in-out;
    }
    
    .bounce-animation {
      animation: bounce-animation 2s infinite ease-in-out;
    }
    
    .wiggle-animation {
      animation: wiggle-animation 2s infinite ease-in-out;
    }
    
    .flash-animation {
      animation: flash-animation 2s infinite ease-in-out;
    }
  `;
  
  // Only add if it doesn't exist already
  if (!document.getElementById('codform-animation-styles')) {
    document.head.appendChild(style);
  }
}

// Submit form function
function submitForm(formId, productId, form, successElement, errorElement, formElement) {
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  const apiUrl = `https://lovassy.com/api/forms/${formId}/submit`;

  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...data,
      product_id: productId
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(responseData => {
      formElement.style.display = 'none';
      successElement.style.display = 'block';
      console.log('Form submission success:', responseData);
    })
    .catch(error => {
      console.error('Form submission error:', error);
      formElement.style.display = 'none';
      errorElement.style.display = 'block';
    });
}

document.addEventListener('DOMContentLoaded', function() {
  injectAnimationStyles();
  const containers = document.querySelectorAll('.codform-container');

  containers.forEach(container => {
    const containerId = container.id;
    const productId = container.dataset.productId;
    const formId = container.dataset.formId;
    const hideHeader = container.dataset.hideHeader === 'true';

    if (formId && productId) {
      loadCodForm(formId, productId, containerId, hideHeader);
    } else {
      console.error('Form ID or Product ID missing from container.');
    }
  });
});


// CODFORM Field Renderer Module
function CODFORMFieldRenderer() {
  function renderField(container, field, primaryColor) {
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
    } else if (field.type === 'whatsapp') {
      renderWhatsAppButton(fieldContainer, field);
    } else if (field.type === 'image') {
      renderImageField(fieldContainer, field, primaryColor);
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
          if (field.disabled) {
            input.disabled = true;
          }
          break;
          
        case 'textarea':
          input = document.createElement('textarea');
          input.id = 'field_' + field.id;
          input.name = field.id;
          input.placeholder = field.placeholder || '';
          input.required = field.required || false;
          input.rows = 4;
          if (field.disabled) {
            input.disabled = true;
          }
          break;
          
        case 'select':
          input = document.createElement('select');
          input.id = 'field_' + field.id;
          input.name = field.id;
          input.required = field.required || false;
          if (field.disabled) {
            input.disabled = true;
          }
          
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
          if (field.disabled) {
            input.disabled = true;
          }
          
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
              if (field.disabled) {
                radioInput.disabled = true;
              }
              
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
          if (field.disabled) {
            input.disabled = true;
          }
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
  
  function renderStepFields(fields, primaryColor) {
    const stepElement = document.createElement('div');
    stepElement.className = 'codform-step';
    
    fields.forEach(field => {
      renderField(stepElement, field, primaryColor);
    });
    
    return stepElement;
  }
  
  function renderWhatsAppButton(container, field) {
    // Create WhatsApp button container
    const whatsappContainer = document.createElement('div');
    whatsappContainer.className = 'codform-field';
    
    // Create a link element for the WhatsApp button
    const whatsappLink = document.createElement('a');
    whatsappLink.className = 'codform-whatsapp-button';
    
    // Set the background color and text color from field.style
    if (field.style) {
      if (field.style.backgroundColor) {
        whatsappLink.style.backgroundColor = field.style.backgroundColor;
      }
      if (field.style.color) {
        whatsappLink.style.color = field.style.color;
      }
    }
    
    // Set the WhatsApp URL with the number and message
    const whatsappNumber = field.whatsappNumber || '';
    const message = field.message || '';
    const encodedMessage = encodeURIComponent(message);
    whatsappLink.href = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    whatsappLink.target = '_blank';
    whatsappLink.rel = 'noopener noreferrer';
    
    // Create the WhatsApp icon
    const whatsappIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    whatsappIcon.setAttribute('viewBox', '0 0 24 24');
    whatsappIcon.setAttribute('width', '24');
    whatsappIcon.setAttribute('height', '24');
    whatsappIcon.setAttribute('fill', 'currentColor');
    whatsappIcon.classList.add('codform-whatsapp-icon');
    
    // Add the WhatsApp logo path
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('d', 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z');
    
    whatsappIcon.appendChild(iconPath);
    
    // Add the icon and text to the link
    whatsappLink.appendChild(whatsappIcon);
    whatsappLink.appendChild(document.createTextNode(field.label || 'تواصل عبر واتساب'));
    
    // Add the link to the container
    whatsappContainer.appendChild(whatsappLink);
    
    // Add the container to the parent container
    container.appendChild(whatsappContainer);
  }
  
  function renderImageField(container, field, primaryColor) {
    const imageFieldContainer = document.createElement('div');
    imageFieldContainer.className = 'codform-image-field';
    
    // Create label
    const label = document.createElement('label');
    label.textContent = field.label || 'إضافة صورة';
    if (field.required) {
      const required = document.createElement('span');
      required.className = 'codform-required';
      required.textContent = ' *';
      label.appendChild(required);
    }
    imageFieldContainer.appendChild(label);
    
    // Create image placeholder/preview
    const imageContainer = document.createElement('div');
    imageContainer.className = 'codform-image-placeholder';
    imageContainer.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <p style="margin-top: 10px;">انقر لتحميل صورة أو اسحب وأفلت الملف هنا</p>
    `;
    
    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = `field_${field.id}`;
    fileInput.name = field.id;
    fileInput.accept = 'image/*';
    fileInput.className = 'codform-image-upload-input';
    fileInput.required = field.required || false;
    if (field.disabled) {
      fileInput.disabled = true;
    }
    
    // Create upload button
    const uploadButton = document.createElement('button');
    uploadButton.type = 'button';
    uploadButton.className = 'codform-image-upload-label';
    uploadButton.textContent = 'اختيار صورة';
    uploadButton.style.backgroundColor = field.style?.backgroundColor || primaryColor || '#9b87f5';
    uploadButton.onclick = () => fileInput.click();
    
    // Handle file selection
    fileInput.onchange = function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          // Replace placeholder with actual image
          imageContainer.innerHTML = '';
          imageContainer.className = 'codform-image-container';
          const img = document.createElement('img');
          img.src = e.target.result;
          img.className = 'codform-image';
          img.alt = field.label || '';
          imageContainer.appendChild(img);
          
          // Add remove button
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'codform-button';
          removeBtn.textContent = 'حذف الصورة';
          removeBtn.style.backgroundColor = '#ef4444';
          removeBtn.style.marginTop = '10px';
          removeBtn.onclick = function() {
            fileInput.value = '';
            // Reset to placeholder
            imageContainer.className = 'codform-image-placeholder';
            imageContainer.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p style="margin-top: 10px;">انقر لتحميل صورة أو اسحب وأفلت الملف هنا</p>
            `;
            imageFieldContainer.appendChild(uploadButton);
          };
          imageContainer.appendChild(removeBtn);
          uploadButton.remove();
        };
        reader.readAsDataURL(this.files[0]);
      }
    };
    
    // Add drag and drop support
    imageContainer.ondragover = function(e) {
      e.preventDefault();
      this.style.borderColor = primaryColor || '#9b87f5';
      this.style.backgroundColor = '#f0f0f0';
    };
    
    imageContainer.ondragleave = function(e) {
      e.preventDefault();
      this.style.borderColor = '#d1d5db';
      this.style.backgroundColor = '#f3f4f6';
    };
    
    imageContainer.ondrop = function(e) {
      e.preventDefault();
      this.style.borderColor = '#d1d5db';
      this.style.backgroundColor = '#f3f4f6';
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        const event = new Event('change');
        fileInput.dispatchEvent(event);
      }
    };
    
    // Add elements to container
    imageFieldContainer.appendChild(fileInput);
    imageFieldContainer.appendChild(imageContainer);
    imageFieldContainer.appendChild(uploadButton);
    
    // Add help text if provided
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      imageFieldContainer.appendChild(helpText);
    }
    
    container.appendChild(imageFieldContainer);
  }
  
  return {
    renderField,
    renderStepFields,
    renderWhatsAppButton,
    renderImageField
  };
}

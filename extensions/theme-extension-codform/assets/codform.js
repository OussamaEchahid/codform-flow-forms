
// CODFORM - نماذج الدفع عند الاستلام

(function() {
  // مباشرة إلى Edge Function Supabase URL - أكثر موثوقية
  const API_BASE_URL = 'https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1';
  
  // وحدات لتقديم الحقول وعناصر النماذج
  function CODFORMFieldRenderer() {
    function renderField(form, field, primaryColor) {
      // تنفيذ عرض الحقل حسب النوع
      switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
          return renderTextField(form, field, primaryColor);
        case 'textarea':
          return renderTextArea(form, field, primaryColor);
        case 'radio':
          return renderRadioGroup(form, field, primaryColor);
        case 'checkbox':
          return renderCheckboxGroup(form, field, primaryColor);
        case 'title':
          return renderTitle(form, field, primaryColor);
        case 'text/html':
          return renderHtml(form, field);
        case 'cart-items':
          return renderCartItems(form, field);
        case 'cart-summary':
          return renderCartSummary(form, field);
        case 'submit':
          return renderSubmitButton(form, field, primaryColor);
        case 'shipping':
          return renderShippingOptions(form, field, primaryColor);
        case 'countdown':
          return renderCountdownTimer(form, field, primaryColor);
        case 'whatsapp':
          return renderWhatsAppButton(form, field, primaryColor);
        case 'image':
          return renderImageField(form, field);
        default:
          console.warn('CODFORM: Unknown field type:', field.type);
          return null;
      }
    }
    
    // وظائف تقديم الحقول حسب النوع
    function renderTextField(form, field, primaryColor) {
      const container = document.createElement('div');
      container.className = 'codform-field-container';
      
      const label = document.createElement('label');
      label.className = 'codform-field-label';
      label.htmlFor = field.id;
      label.textContent = field.label || '';
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = ' *';
        label.appendChild(required);
      }
      container.appendChild(label);
      
      const input = document.createElement('input');
      input.className = 'codform-text-input';
      input.type = field.inputType || 'text';
      input.id = field.id;
      input.name = field.id;
      input.placeholder = field.placeholder || '';
      if (field.required) input.required = true;
      if (field.defaultValue) input.value = field.defaultValue;
      
      // Apply primary color if available
      if (primaryColor) {
        input.style.borderColor = primaryColor;
        input.addEventListener('focus', function() {
          this.style.borderColor = primaryColor;
          this.style.boxShadow = `0 0 0 1px ${primaryColor}`;
        });
      }
      
      container.appendChild(input);
      
      if (field.description) {
        const description = document.createElement('div');
        description.className = 'codform-field-description';
        description.textContent = field.description;
        container.appendChild(description);
      }
      
      form.appendChild(container);
      return container;
    }
    
    function renderTextArea(form, field, primaryColor) {
      const container = document.createElement('div');
      container.className = 'codform-field-container';
      
      const label = document.createElement('label');
      label.className = 'codform-field-label';
      label.htmlFor = field.id;
      label.textContent = field.label || '';
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = ' *';
        label.appendChild(required);
      }
      container.appendChild(label);
      
      const textarea = document.createElement('textarea');
      textarea.className = 'codform-textarea';
      textarea.id = field.id;
      textarea.name = field.id;
      textarea.placeholder = field.placeholder || '';
      if (field.required) textarea.required = true;
      if (field.defaultValue) textarea.value = field.defaultValue;
      if (field.rows) textarea.rows = field.rows;
      
      // Apply primary color if available
      if (primaryColor) {
        textarea.style.borderColor = primaryColor;
        textarea.addEventListener('focus', function() {
          this.style.borderColor = primaryColor;
          this.style.boxShadow = `0 0 0 1px ${primaryColor}`;
        });
      }
      
      container.appendChild(textarea);
      
      if (field.description) {
        const description = document.createElement('div');
        description.className = 'codform-field-description';
        description.textContent = field.description;
        container.appendChild(description);
      }
      
      form.appendChild(container);
      return container;
    }
    
    function renderRadioGroup(form, field, primaryColor) {
      const container = document.createElement('div');
      container.className = 'codform-field-container';
      
      const label = document.createElement('div');
      label.className = 'codform-field-label';
      label.textContent = field.label || '';
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = ' *';
        label.appendChild(required);
      }
      container.appendChild(label);
      
      const options = field.options || [];
      const radioGroup = document.createElement('div');
      radioGroup.className = 'codform-radio-group';
      
      options.forEach((option, index) => {
        const radioContainer = document.createElement('div');
        radioContainer.className = 'codform-radio-container';
        
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.className = 'codform-radio';
        radioInput.id = `${field.id}-${index}`;
        radioInput.name = field.id;
        radioInput.value = option.value || option;
        if (index === 0 && field.required) radioInput.required = true;
        if (field.defaultValue && field.defaultValue === option.value) radioInput.checked = true;
        
        // Apply primary color for custom radio button styles
        if (primaryColor) {
          radioContainer.style.setProperty('--primary-color', primaryColor);
        }
        
        const radioLabel = document.createElement('label');
        radioLabel.className = 'codform-radio-label';
        radioLabel.htmlFor = `${field.id}-${index}`;
        radioLabel.textContent = option.label || option;
        
        radioContainer.appendChild(radioInput);
        radioContainer.appendChild(radioLabel);
        radioGroup.appendChild(radioContainer);
      });
      
      container.appendChild(radioGroup);
      
      if (field.description) {
        const description = document.createElement('div');
        description.className = 'codform-field-description';
        description.textContent = field.description;
        container.appendChild(description);
      }
      
      form.appendChild(container);
      return container;
    }
    
    function renderCheckboxGroup(form, field, primaryColor) {
      const container = document.createElement('div');
      container.className = 'codform-field-container';
      
      const label = document.createElement('div');
      label.className = 'codform-field-label';
      label.textContent = field.label || '';
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = ' *';
        label.appendChild(required);
      }
      container.appendChild(label);
      
      const options = field.options || [];
      const checkboxGroup = document.createElement('div');
      checkboxGroup.className = 'codform-checkbox-group';
      
      options.forEach((option, index) => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'codform-checkbox-container';
        
        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.className = 'codform-checkbox';
        checkboxInput.id = `${field.id}-${index}`;
        checkboxInput.name = `${field.id}[]`;
        checkboxInput.value = option.value || option;
        
        // Apply primary color for custom checkbox styles
        if (primaryColor) {
          checkboxContainer.style.setProperty('--primary-color', primaryColor);
        }
        
        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'codform-checkbox-label';
        checkboxLabel.htmlFor = `${field.id}-${index}`;
        checkboxLabel.textContent = option.label || option;
        
        checkboxContainer.appendChild(checkboxInput);
        checkboxContainer.appendChild(checkboxLabel);
        checkboxGroup.appendChild(checkboxContainer);
      });
      
      container.appendChild(checkboxGroup);
      
      if (field.description) {
        const description = document.createElement('div');
        description.className = 'codform-field-description';
        description.textContent = field.description;
        container.appendChild(description);
      }
      
      form.appendChild(container);
      return container;
    }
    
    function renderTitle(form, field) {
      const container = document.createElement('div');
      container.className = 'codform-title-container';
      
      const title = document.createElement(field.headingLevel || 'h3');
      title.className = 'codform-title';
      title.textContent = field.label || field.title || '';
      container.appendChild(title);
      
      if (field.description) {
        const description = document.createElement('div');
        description.className = 'codform-title-description';
        description.textContent = field.description;
        container.appendChild(description);
      }
      
      form.appendChild(container);
      return container;
    }
    
    function renderHtml(form, field) {
      const container = document.createElement('div');
      container.className = 'codform-html-container';
      container.innerHTML = field.content || '';
      
      form.appendChild(container);
      return container;
    }
    
    function renderCartItems(form, field) {
      const container = document.createElement('div');
      container.className = 'codform-cart-items-container';
      
      const title = document.createElement('h4');
      title.className = 'codform-cart-items-title';
      title.textContent = field.label || 'العناصر في سلة التسوق';
      container.appendChild(title);
      
      // Placeholder for cart items, will be populated if data is available
      const itemsList = document.createElement('div');
      itemsList.className = 'codform-cart-items-list';
      
      // Sample item or placeholder
      const placeholderItem = document.createElement('div');
      placeholderItem.className = 'codform-cart-item';
      placeholderItem.innerHTML = '<div class="codform-cart-item-image"></div>' +
                                   '<div class="codform-cart-item-info">' +
                                   '<div class="codform-cart-item-title">اسم المنتج</div>' +
                                   '<div class="codform-cart-item-variant">نوع المنتج</div>' +
                                   '<div class="codform-cart-item-price">100 ر.س</div>' +
                                   '</div>' +
                                   '<div class="codform-cart-item-quantity">1</div>';
      
      itemsList.appendChild(placeholderItem);
      container.appendChild(itemsList);
      
      form.appendChild(container);
      
      // Try to fetch cart data if available
      if (typeof Shopify !== 'undefined' && Shopify.shop) {
        // Attempt to get cart data
        fetch('/cart.js', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(cartData => {
          // Clear placeholder
          itemsList.innerHTML = '';
          
          if (cartData.items && cartData.items.length > 0) {
            cartData.items.forEach(item => {
              const cartItem = document.createElement('div');
              cartItem.className = 'codform-cart-item';
              
              const itemImage = document.createElement('div');
              itemImage.className = 'codform-cart-item-image';
              if (item.image) {
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.title;
                itemImage.appendChild(img);
              }
              cartItem.appendChild(itemImage);
              
              const itemInfo = document.createElement('div');
              itemInfo.className = 'codform-cart-item-info';
              
              const itemTitle = document.createElement('div');
              itemTitle.className = 'codform-cart-item-title';
              itemTitle.textContent = item.title;
              itemInfo.appendChild(itemTitle);
              
              if (item.variant_title) {
                const itemVariant = document.createElement('div');
                itemVariant.className = 'codform-cart-item-variant';
                itemVariant.textContent = item.variant_title;
                itemInfo.appendChild(itemVariant);
              }
              
              const itemPrice = document.createElement('div');
              itemPrice.className = 'codform-cart-item-price';
              itemPrice.textContent = `${(item.price / 100).toFixed(2)} ر.س`;
              itemInfo.appendChild(itemPrice);
              
              cartItem.appendChild(itemInfo);
              
              const itemQuantity = document.createElement('div');
              itemQuantity.className = 'codform-cart-item-quantity';
              itemQuantity.textContent = item.quantity;
              cartItem.appendChild(itemQuantity);
              
              itemsList.appendChild(cartItem);
              
              // Add hidden input to include in form submission
              const hiddenInput = document.createElement('input');
              hiddenInput.type = 'hidden';
              hiddenInput.name = `cart_items[${item.id}]`;
              hiddenInput.value = JSON.stringify({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity
              });
              form.appendChild(hiddenInput);
            });
          } else {
            const emptyCart = document.createElement('div');
            emptyCart.className = 'codform-cart-empty';
            emptyCart.textContent = 'سلة التسوق فارغة';
            itemsList.appendChild(emptyCart);
          }
        })
        .catch(error => {
          console.error('CODFORM: Error fetching cart data', error);
          const errorMessage = document.createElement('div');
          errorMessage.className = 'codform-cart-error';
          errorMessage.textContent = 'تعذر تحميل بيانات سلة التسوق';
          itemsList.innerHTML = '';
          itemsList.appendChild(errorMessage);
        });
      }
      
      return container;
    }
    
    function renderCartSummary(form, field) {
      const container = document.createElement('div');
      container.className = 'codform-cart-summary-container';
      
      const title = document.createElement('h4');
      title.className = 'codform-cart-summary-title';
      title.textContent = field.label || 'ملخص سلة التسوق';
      container.appendChild(title);
      
      const summaryTable = document.createElement('div');
      summaryTable.className = 'codform-cart-summary-table';
      
      const subtotalRow = document.createElement('div');
      subtotalRow.className = 'codform-cart-summary-row';
      subtotalRow.innerHTML = '<div>المبلغ</div><div class="codform-cart-subtotal">0 ر.س</div>';
      summaryTable.appendChild(subtotalRow);
      
      const shippingRow = document.createElement('div');
      shippingRow.className = 'codform-cart-summary-row';
      shippingRow.innerHTML = '<div>الشحن</div><div class="codform-cart-shipping">0 ر.س</div>';
      summaryTable.appendChild(shippingRow);
      
      const totalRow = document.createElement('div');
      totalRow.className = 'codform-cart-summary-row codform-cart-summary-total';
      totalRow.innerHTML = '<div>المجموع</div><div class="codform-cart-total">0 ر.س</div>';
      summaryTable.appendChild(totalRow);
      
      container.appendChild(summaryTable);
      form.appendChild(container);
      
      // Try to fetch cart data if available
      if (typeof Shopify !== 'undefined' && Shopify.shop) {
        // Attempt to get cart data
        fetch('/cart.js', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(cartData => {
          if (cartData.total_price !== undefined) {
            document.querySelector('.codform-cart-subtotal').textContent = 
              `${(cartData.items_subtotal_price / 100).toFixed(2)} ر.س`;
            
            // If shipping is calculated
            if (cartData.shipping_price !== undefined) {
              document.querySelector('.codform-cart-shipping').textContent = 
                `${(cartData.shipping_price / 100).toFixed(2)} ر.س`;
            }
            
            document.querySelector('.codform-cart-total').textContent = 
              `${(cartData.total_price / 100).toFixed(2)} ر.س`;
              
            // Add hidden input to include total in form submission
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'cart_total';
            hiddenInput.value = cartData.total_price;
            form.appendChild(hiddenInput);
          }
        })
        .catch(error => {
          console.error('CODFORM: Error fetching cart data', error);
        });
      }
      
      return container;
    }
    
    function renderSubmitButton(form, field, primaryColor) {
      const container = document.createElement('div');
      container.className = 'codform-submit-container';
      
      const button = document.createElement('button');
      button.type = 'submit';
      button.className = 'codform-submit-button';
      button.textContent = field.label || 'إرسال';
      
      // Apply primary color if available
      if (primaryColor) {
        button.style.backgroundColor = primaryColor;
      }
      
      container.appendChild(button);
      form.appendChild(container);
      return container;
    }
    
    function renderShippingOptions(form, field, primaryColor) {
      const container = document.createElement('div');
      container.className = 'codform-field-container';
      
      const label = document.createElement('div');
      label.className = 'codform-field-label';
      label.textContent = field.label || 'خيارات الشحن';
      if (field.required) {
        const required = document.createElement('span');
        required.className = 'codform-required';
        required.textContent = ' *';
        label.appendChild(required);
      }
      container.appendChild(label);
      
      const options = field.options || [
        { label: 'شحن قياسي (3-5 أيام)', value: 'standard', price: 15 },
        { label: 'شحن سريع (1-2 يوم)', value: 'express', price: 30 }
      ];
      
      const shippingGroup = document.createElement('div');
      shippingGroup.className = 'codform-shipping-group';
      
      options.forEach((option, index) => {
        const shippingOption = document.createElement('div');
        shippingOption.className = 'codform-shipping-option';
        
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.className = 'codform-shipping-radio';
        radioInput.id = `${field.id || 'shipping'}-${index}`;
        radioInput.name = field.id || 'shipping';
        radioInput.value = option.value;
        if (index === 0 && field.required) radioInput.required = true;
        if (field.defaultValue && field.defaultValue === option.value) radioInput.checked = true;
        
        // Apply primary color for custom radio button styles
        if (primaryColor) {
          shippingOption.style.setProperty('--primary-color', primaryColor);
        }
        
        const radioLabel = document.createElement('label');
        radioLabel.className = 'codform-shipping-label';
        radioLabel.htmlFor = `${field.id || 'shipping'}-${index}`;
        
        const labelText = document.createElement('span');
        labelText.className = 'codform-shipping-label-text';
        labelText.textContent = option.label;
        radioLabel.appendChild(labelText);
        
        if (option.price !== undefined) {
          const priceText = document.createElement('span');
          priceText.className = 'codform-shipping-price';
          priceText.textContent = `${option.price} ر.س`;
          radioLabel.appendChild(priceText);
        }
        
        shippingOption.appendChild(radioInput);
        shippingOption.appendChild(radioLabel);
        shippingGroup.appendChild(shippingOption);
      });
      
      container.appendChild(shippingGroup);
      
      if (field.description) {
        const description = document.createElement('div');
        description.className = 'codform-field-description';
        description.textContent = field.description;
        container.appendChild(description);
      }
      
      form.appendChild(container);
      return container;
    }
    
    function renderCountdownTimer(form, field, primaryColor) {
      const container = document.createElement('div');
      container.className = 'codform-countdown-container';
      
      const title = document.createElement('div');
      title.className = 'codform-countdown-title';
      title.textContent = field.label || 'ينتهي العرض خلال:';
      container.appendChild(title);
      
      const timer = document.createElement('div');
      timer.className = 'codform-countdown-timer';
      
      // Calculate end time
      const now = new Date();
      let endTime;
      
      if (field.endTime) {
        // Use provided end time if available
        endTime = new Date(field.endTime);
      } else {
        // Default: 24 hours from now
        endTime = new Date(now);
        endTime.setHours(endTime.getHours() + 24);
      }
      
      const timeUnits = document.createElement('div');
      timeUnits.className = 'codform-countdown-units';
      
      ['ساعات', 'دقائق', 'ثوان'].forEach(unit => {
        const unitElement = document.createElement('div');
        unitElement.className = 'codform-countdown-unit';
        unitElement.textContent = unit;
        timeUnits.appendChild(unitElement);
      });
      
      const timeValues = document.createElement('div');
      timeValues.className = 'codform-countdown-values';
      
      ['hours', 'minutes', 'seconds'].forEach(unit => {
        const valueElement = document.createElement('div');
        valueElement.className = `codform-countdown-value codform-countdown-${unit}`;
        valueElement.textContent = '00';
        
        // Apply primary color if available
        if (primaryColor) {
          valueElement.style.backgroundColor = primaryColor;
        }
        
        timeValues.appendChild(valueElement);
      });
      
      timer.appendChild(timeValues);
      timer.appendChild(timeUnits);
      container.appendChild(timer);
      
      // Start countdown
      const countdown = setInterval(() => {
        const now = new Date();
        const diff = Math.max(0, Math.floor((endTime - now) / 1000));
        
        if (diff <= 0) {
          clearInterval(countdown);
          // Optional: Handle countdown end
        }
        
        // Update timer display
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        document.querySelector('.codform-countdown-hours').textContent = hours.toString().padStart(2, '0');
        document.querySelector('.codform-countdown-minutes').textContent = minutes.toString().padStart(2, '0');
        document.querySelector('.codform-countdown-seconds').textContent = seconds.toString().padStart(2, '0');
      }, 1000);
      
      form.appendChild(container);
      return container;
    }
    
    function renderWhatsAppButton(form, field, primaryColor) {
      const container = document.createElement('div');
      container.className = 'codform-whatsapp-container';
      
      if (field.label) {
        const title = document.createElement('div');
        title.className = 'codform-whatsapp-title';
        title.textContent = field.label;
        container.appendChild(title);
      }
      
      const button = document.createElement('a');
      button.className = 'codform-whatsapp-button';
      button.href = field.phoneNumber ? 
        `https://wa.me/${field.phoneNumber.replace(/[^0-9]/g, '')}` : 
        `https://wa.me/`;
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
      
      // Apply primary color if available
      if (primaryColor) {
        button.style.backgroundColor = primaryColor;
      }
      
      const icon = document.createElement('span');
      icon.className = 'codform-whatsapp-icon';
      icon.innerHTML = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M24.5 7.5C22.2 5.2 19.2 4 16 4C9.4 4 4 9.4 4 16C4 18.4 4.6 20.7 5.8 22.7L4 28L9.4 26.2C11.4 27.3 13.6 27.9 16 27.9C22.6 27.9 28 22.5 28 15.9C28 12.7 26.8 9.8 24.5 7.5ZM16 25.9C13.9 25.9 11.8 25.3 10 24.2L9.6 24L6.5 25.1L7.6 22.1L7.3 21.7C6.2 19.8 5.5 17.7 5.5 15.5C5.5 10.3 10.3 5.5 15.5 5.5C18.1 5.5 20.6 6.5 22.5 8.3C24.3 10.1 25.4 12.6 25.4 15.2C26 20.7 21.2 25.9 16 25.9Z" fill="white"/><path d="M22.2 19L20.6 18.5C20.2 18.4 19.8 18.5 19.5 18.8L18.9 19.4C18.6 19.7 18.1 19.8 17.7 19.6C16.7 19.2 13.9 16.7 13.3 15.8C13.1 15.4 13.2 15 13.5 14.7L14 14.1C14.3 13.8 14.4 13.4 14.3 13L13.5 11.4C13.3 10.8 12.7 10.5 12.2 10.7C11.4 10.9 10.7 11.5 10.4 12.3C9.9 13.5 10.2 15 11 16.4C12.7 19.2 16.2 21.7 19.3 22C20.8 22.2 22.1 21.3 22.6 20C22.9 19.2 22.8 18.1 22.2 19Z" fill="white"/></svg>';
      button.appendChild(icon);
      
      const buttonText = document.createElement('span');
      buttonText.className = 'codform-whatsapp-text';
      buttonText.textContent = field.buttonText || 'تواصل عبر واتساب';
      button.appendChild(buttonText);
      
      container.appendChild(button);
      form.appendChild(container);
      return container;
    }
    
    function renderImageField(form, field) {
      const container = document.createElement('div');
      container.className = 'codform-image-container';
      
      if (field.imageUrl) {
        const image = document.createElement('img');
        image.className = 'codform-image';
        image.src = field.imageUrl;
        image.alt = field.label || 'صورة';
        
        if (field.imageLink) {
          const link = document.createElement('a');
          link.href = field.imageLink;
          link.target = field.openInNewTab ? '_blank' : '_self';
          link.rel = 'noopener noreferrer';
          link.appendChild(image);
          container.appendChild(link);
        } else {
          container.appendChild(image);
        }
      }
      
      if (field.caption) {
        const caption = document.createElement('div');
        caption.className = 'codform-image-caption';
        caption.textContent = field.caption;
        container.appendChild(caption);
      }
      
      form.appendChild(container);
      return container;
    }
    
    function renderStepFields(fields, primaryColor) {
      const stepContent = document.createElement('div');
      stepContent.className = 'codform-step-content';
      
      if (fields && Array.isArray(fields)) {
        fields.forEach(field => {
          renderField(stepContent, field, primaryColor);
        });
      }
      
      return stepContent;
    }
    
    return {
      renderField,
      renderWhatsAppButton,
      renderImageField,
      renderStepFields
    };
  }

  // وحدة التنقل بين خطوات النموذج
  function CODFORMStepNavigator() {
    function navigateStep(form, direction) {
      // Get current step
      const currentStep = parseInt(form.dataset.currentStep || 0);
      const totalSteps = parseInt(form.dataset.totalSteps || 1);
      
      // Calculate new step
      let newStep = currentStep + direction;
      
      // Validate boundaries
      if (newStep < 0) newStep = 0;
      if (newStep >= totalSteps) newStep = totalSteps - 1;
      
      // If trying to go forward, validate current step fields
      if (direction > 0) {
        const currentStepContent = form.querySelector('.codform-step-content');
        const requiredFields = currentStepContent.querySelectorAll('[required]');
        
        let isValid = true;
        requiredFields.forEach(field => {
          if (!field.checkValidity()) {
            isValid = false;
            field.reportValidity();
          }
        });
        
        if (!isValid) {
          return false;
        }
      }
      
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
      });
      
      // Remove existing step content
      const oldStepContent = form.querySelector('.codform-step-content');
      if (oldStepContent) {
        oldStepContent.remove();
      }
      
      // Get new step fields
      const allSteps = JSON.parse(form.dataset.steps || '[]');
      const stepFields = allSteps[newStep]?.fields || [];
      
      // Render new step fields
      const { renderStepFields } = CODFORMFieldRenderer();
      const stepsContainer = form.querySelector('.codform-steps-container');
      const newStepContent = renderStepFields(stepFields, form.dataset.primaryColor);
      stepsContainer.appendChild(newStepContent);
      
      // Update navigation buttons
      const prevButton = form.querySelector('.codform-prev-button');
      const nextButton = form.querySelector('.codform-next-button');
      const submitButton = form.querySelector('.codform-submit-button');
      
      if (prevButton) {
        prevButton.style.display = newStep > 0 ? 'inline-block' : 'none';
      }
      
      if (nextButton) {
        nextButton.style.display = newStep < totalSteps - 1 ? 'inline-block' : 'none';
      }
      
      if (submitButton) {
        submitButton.style.display = newStep === totalSteps - 1 ? 'inline-block' : 'none';
      }
      
      return true;
    }
    
    return { navigateStep };
  }

  // وحدة عرض النموذج
  function CODFORMFormRenderer() {
    const { 
      renderField, 
      renderWhatsAppButton, 
      renderImageField, 
      renderStepFields 
    } = CODFORMFieldRenderer();

    const { navigateStep } = CODFORMStepNavigator();
    
    function renderForm(container, formData, productId, submitFormCallback) {
      const formContainer = container.querySelector('.codform-form');
      if (!formContainer) {
        console.error('CODFORM: Form container not found');
        return;
      }
      
      console.log('CODFORM: Rendering form with', formData.fields ? formData.fields.length : 0, 'fields');
      formContainer.innerHTML = ''; // Clear any existing content
      
      // Set header background color based on form's primary color
      const formHeader = container.querySelector('.codform-header');
      if (formHeader && formData.primaryColor) {
        formHeader.style.backgroundColor = formData.primaryColor;
      }
      
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
        
        // Store steps data in form dataset
        form.dataset.steps = JSON.stringify(steps);
        form.dataset.currentStep = currentStep;
        form.dataset.totalSteps = steps.length;
        if (formData.primaryColor) {
          form.dataset.primaryColor = formData.primaryColor;
        }
        
        // Render first step initially
        const stepContent = renderStepFields(steps[currentStep].fields, formData.primaryColor);
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
          // Apply primary color
          if (formData.primaryColor) {
            nextButton.style.backgroundColor = formData.primaryColor;
          }
          nextButton.addEventListener('click', function() {
            navigateStep(form, 1);
          });
          
          const submitButton = document.createElement('button');
          submitButton.type = 'submit';
          submitButton.className = 'codform-submit-button';
          submitButton.textContent = 'إرسال الطلب';
          // Apply primary color
          if (formData.primaryColor) {
            submitButton.style.backgroundColor = formData.primaryColor;
          }
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
          // Apply primary color
          if (formData.primaryColor) {
            submitButton.style.backgroundColor = formData.primaryColor;
          }
          form.appendChild(submitButton);
        }
      } else {
        // Render form fields based on formData (single step)
        if (formData.fields && Array.isArray(formData.fields)) {
          formData.fields.forEach(field => {
            renderField(form, field, formData.primaryColor);
          });
        }
        
        // Add submit button for single-step form
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'codform-submit-button';
        submitButton.textContent = 'إرسال الطلب';
        // Apply primary color
        if (formData.primaryColor) {
          submitButton.style.backgroundColor = formData.primaryColor;
        }
        form.appendChild(submitButton);
      }
      
      // Add form submission handler
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitFormCallback(container, form, formData.id);
      });
      
      // Add form to container and show it
      formContainer.appendChild(form);
      
      console.log('CODFORM: Form rendered successfully');
      
      // Return the form for any additional processing
      return form;
    }
    
    return { renderForm };
  }

  // وحدة إرسال النموذج
  function CODFORMFormSubmitter(API_BASE_URL) {
    function submitForm(container, form, formId) {
      console.log('CODFORM: Submitting form', formId);
      
      // Show loading state
      const submitButton = form.querySelector('.codform-submit-button');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="codform-button-spinner"></span> جار الإرسال...';
      }
      
      // Collect form data
      const formData = new FormData(form);
      const submissionData = {};
      
      for (const [key, value] of formData.entries()) {
        submissionData[key] = value;
      }
      
      // Add form ID
      submissionData.formId = formId;
      
      // Submit to API endpoint
      fetch(`${API_BASE_URL}/api-submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })
      .then(response => {
        console.log('CODFORM: Submission response status:', response.status);
        if (!response.ok) {
          throw new Error('Server returned ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log('CODFORM: Submission successful', data);
        
        // Hide form and show success message
        const formContainer = container.querySelector('.codform-form');
        const successContainer = container.querySelector('.codform-success');
        
        if (formContainer) formContainer.style.display = 'none';
        if (successContainer) successContainer.style.display = 'block';
      })
      .catch(error => {
        console.error('CODFORM: Submission error', error);
        
        // Reset button state
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'إرسال الطلب';
        }
        
        // Show error message
        const formContainer = container.querySelector('.codform-form');
        const errorContainer = container.querySelector('.codform-error');
        
        if (formContainer) formContainer.style.display = 'none';
        if (errorContainer) errorContainer.style.display = 'block';
      });
    }
    
    return { submitForm };
  }

  // وحدة تحميل النموذج
  function CODFORMFormLoader(API_BASE_URL) {
    const { renderForm } = CODFORMFormRenderer();
    const { submitForm } = CODFORMFormSubmitter(API_BASE_URL);
    
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
          hideLoader(container);
          showForm(container);
          renderForm(container, data, productId, submitForm);
        })
        .catch(error => {
          console.error('CODFORM: Error loading form', error);
          showError(container);
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
    
    return {
      loadForm,
      showLoader,
      hideLoader,
      showForm,
      hideForm,
      showSuccess,
      hideSuccess,
      showError,
      hideError
    };
  }

  // وحدة التهيئة وبدء عمل النموذج
  function CODFORMInitializer(API_BASE_URL) {
    const { 
      loadForm, 
      showLoader, 
      hideLoader, 
      showForm, 
      hideForm, 
      showSuccess, 
      hideSuccess,
      showError, 
      hideError 
    } = CODFORMFormLoader(API_BASE_URL);

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
        const retryButton = container.querySelector('#codform-retry-' + container.id.split('-').pop());
        if (retryButton) {
          retryButton.addEventListener('click', function() {
            hideError(container);
            showLoader(container);
            loadForm(container, formId, productId);
          });
        }
      });
    }
    
    return { initCODFORM };
  }
  
  // Initialize CODFORM when the DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('CODFORM: Script loaded');
    
    const { initCODFORM } = CODFORMInitializer(API_BASE_URL);
    initCODFORM();
  });
})();

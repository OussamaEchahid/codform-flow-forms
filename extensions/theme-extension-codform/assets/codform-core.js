/**
 * CODFORM - Core JavaScript functionality
 * This file contains the core functionality for the COD form system
 */

(function() {
  // Main form loader function
  function loadCodForm(containerId, formId, productId) {
    // تحقق من وجود العنصر الحاوي أولاً
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID "${containerId}" not found.`);
      return;
    }
    
    // تحقق من وجود العناصر الأخرى داخل الحاوية
    const formLoader = document.getElementById(`codform-form-loader-${containerId}`);
    const formContainer = document.getElementById(`codform-form-${containerId}`);
    const successMessage = document.getElementById(`codform-success-${containerId}`);
    const errorContainer = document.getElementById(`codform-error-${containerId}`);
    const errorMessage = errorContainer ? document.getElementById(`codform-error-message-${containerId}`) : null;
    const errorDetails = errorContainer ? document.getElementById(`codform-error-details-${containerId}`) : null;
    const retryButton = errorContainer ? document.getElementById(`codform-retry-${containerId}`) : null;
    
    // إنشاء عناصر مفقودة إذا لزم الأمر
    if (!formLoader) {
      console.warn(`Form loader element for "${containerId}" not found. Creating it.`);
      const newFormLoader = document.createElement('div');
      newFormLoader.id = `codform-form-loader-${containerId}`;
      newFormLoader.className = 'codform-loader';
      newFormLoader.innerHTML = '<div class="codform-spinner"></div>';
      newFormLoader.style.display = 'none';
      container.appendChild(newFormLoader);
    }
    
    if (!formContainer) {
      console.warn(`Form container element for "${containerId}" not found. Creating it.`);
      const newFormContainer = document.createElement('div');
      newFormContainer.id = `codform-form-${containerId}`;
      newFormContainer.className = 'codform-form-container';
      container.appendChild(newFormContainer);
    }
    
    if (!successMessage) {
      console.warn(`Success message element for "${containerId}" not found. Creating it.`);
      const newSuccessMessage = document.createElement('div');
      newSuccessMessage.id = `codform-success-${containerId}`;
      newSuccessMessage.className = 'codform-success';
      newSuccessMessage.innerHTML = '<h3>شكراً لك!</h3><p>تم استلام طلبك بنجاح.</p>';
      newSuccessMessage.style.display = 'none';
      container.appendChild(newSuccessMessage);
    }
    
    if (!errorContainer) {
      console.warn(`Error container element for "${containerId}" not found. Creating it.`);
      const newErrorContainer = document.createElement('div');
      newErrorContainer.id = `codform-error-${containerId}`;
      newErrorContainer.className = 'codform-error';
      newErrorContainer.innerHTML = `
        <div class="codform-error-icon">⚠️</div>
        <h3>عذراً! حدث خطأ</h3>
        <p id="codform-error-message-${containerId}">تعذر تحميل النموذج</p>
        <div id="codform-error-details-${containerId}" class="codform-error-details"></div>
        <button id="codform-retry-${containerId}" class="codform-retry-button">إعادة المحاولة</button>
      `;
      newErrorContainer.style.display = 'none';
      container.appendChild(newErrorContainer);
    }
    
    // الآن بعد التأكد من وجود جميع العناصر، نقوم بإعادة تعريفها
    const safeFormLoader = document.getElementById(`codform-form-loader-${containerId}`);
    const safeFormContainer = document.getElementById(`codform-form-${containerId}`);
    const safeSuccessMessage = document.getElementById(`codform-success-${containerId}`);
    const safeErrorContainer = document.getElementById(`codform-error-${containerId}`);
    const safeErrorMessage = document.getElementById(`codform-error-message-${containerId}`);
    const safeErrorDetails = document.getElementById(`codform-error-details-${containerId}`);
    const safeRetryButton = document.getElementById(`codform-retry-${containerId}`);
    
    // Validate form ID format (UUID format)
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formId);
    
    if (!formId || formId.trim() === '') {
      showError('لم يتم تحديد معرّف النموذج. الرجاء إضافة معرّف النموذج في إعدادات البلوك.', '', containerId);
      return;
    }
    
    if (!isValidUuid) {
      showError(
        'تنسيق معرّف النموذج غير صحيح. يجب أن يكون بتنسيق UUID كامل.', 
        `معرّف النموذج الحالي "${formId}" ليس بالتنسيق الصحيح. يجب أن يكون معرّف النموذج مثل: "6942b35d-ad06-40fb-8f70-86230d20b0fd".`,
        containerId
      );
      return;
    }
    
    function showError(message, details = null, containerId) {
      if (safeFormLoader) safeFormLoader.style.display = 'none';
      if (safeFormContainer) safeFormContainer.style.display = 'none';
      if (safeErrorContainer) safeErrorContainer.style.display = 'block';
      
      if (safeErrorMessage && message) {
        safeErrorMessage.textContent = message;
      }
      
      if (safeErrorDetails) {
        if (details) {
          safeErrorDetails.textContent = details;
          safeErrorDetails.style.display = 'block';
        } else {
          safeErrorDetails.style.display = 'none';
        }
      }
    }
    
    // Load form from API
    function loadForm() {
      if (safeFormLoader) safeFormLoader.style.display = 'flex';
      if (safeErrorContainer) safeErrorContainer.style.display = 'none';
      if (safeFormContainer) safeFormContainer.style.display = 'none';
      if (safeSuccessMessage) safeSuccessMessage.style.display = 'none';
      
      // Construct API URL with form ID
      let apiUrl = `https://mtyfuwdsshlzqwjujavp.functions.supabase.co/api-forms/${formId}`;
      
      // Append product ID if available
      if (productId) {
        apiUrl += `?product_id=${productId}&shop_id=${window.Shopify?.shop || ''}`;
      }

      console.log('Fetching form from:', apiUrl);
      
      // Fetch form data from API with improved error handling
      fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg'
        }
      })
        .then(response => {
          if (!response.ok) {
            // Log the response status and statusText for debugging
            console.error('API Response Error:', response.status, response.statusText);
            
            // Parse the error response if possible, otherwise throw generic error
            return response.text().then(text => {
              try {
                // Try to parse as JSON
                return JSON.parse(text);
              } catch (e) {
                // If not JSON, throw the text or status
                throw new Error(text || `Server responded with status: ${response.status}`);
              }
            }).then(data => {
              throw new Error(data.error || `Server responded with status: ${response.status}`);
            });
          }
          return response.json();
        })
        .then(formData => {
          if (!formData || !formData.data) {
            throw new Error('معلومات النموذج غير مكتملة أو تالفة');
          }
          
          // Transform form data to correct format
          const fields = transformFormData(formData);
          
          // Check if form is empty
          if (fields.length === 0) {
            throw new Error('النموذج فارغ، لا توجد حقول لعرضها');
          }
          
          // Render form fields
          renderForm(formData, containerId);
          
          // Hide loader and show form
          if (safeFormLoader) safeFormLoader.style.display = 'none';
          if (safeFormContainer) safeFormContainer.style.display = 'block';
        })
        .catch(error => {
          console.error('Error loading form:', error);
          
          // Enhanced error message with network details
          let errorMsg = 'تعذر تحميل النموذج';
          let detailsMsg = '';
          
          if (error.message && error.message.includes('Failed to fetch')) {
            errorMsg = 'فشل الاتصال بالخادم';
            detailsMsg = 'يرجى التحقق من اتصال الإنترنت الخاص بك، أو قد تكون هناك مشكلة في الوصول للخادم.';
          } else {
            detailsMsg = `رسالة الخطأ: ${error.message || 'خطأ غير معروف'}`;
          }
          
          showError(errorMsg, detailsMsg, containerId);
        });
    }
    
    // Add event listener for retry button - تحقق من وجود زر إعادة المحاولة قبل إضافة مستمع الحدث
    if (safeRetryButton) {
      // نقوم بإزالة أي مستمعي أحداث سابقين لتجنب التكرار
      safeRetryButton.removeEventListener('click', loadForm);
      safeRetryButton.addEventListener('click', loadForm);
    } else {
      console.warn(`Retry button for "${containerId}" not found. Skipping event listener.`);
    }
    
    // Initial form load
    loadForm();
  }

  // Export to global scope
  window.codformCore = {
    loadForm: loadCodForm,
    transformFormData: transformFormData,
    renderForm: renderForm,
    handleFormSubmit: handleFormSubmit
  };

  /**
   * Transform form data from API format to a usable format
   */
  function transformFormData(formData) {
    // تحويل بيانات النموذج من التنسيق القديم إلى التنسيق الجديد
    try {
      // التحقق من نوع البيانات
      if (formData.data && Array.isArray(formData.data)) {
        // إذا كانت البيانات عبارة عن مصفوفة (خطوات)، نقوم بدمج جميع الحقول
        let allFields = [];
        formData.data.forEach(step => {
          if (step.fields && Array.isArray(step.fields)) {
            allFields = [...allFields, ...step.fields];
          }
        });
        return allFields;
      } else if (formData.fields && Array.isArray(formData.fields)) {
        // إذا كانت البيانات تحتوي مباشرة على حقول
        return formData.fields;
      } else {
        // في حالة عدم وجود تنسيق معروف، نعيد مصفوفة فارغة
        console.error('Unknown form data format:', formData);
        return [];
      }
    } catch (error) {
      console.error('Error transforming form data:', error);
      return [];
    }
  }

  /**
   * Render form using form data
   */
  function renderForm(formData, containerId) {
    // تحقق من وجود حاوية النموذج
    const formContainer = document.getElementById(`codform-form-${containerId}`);
    if (!formContainer) {
      console.error(`Form container element for "${containerId}" not found.`);
      return;
    }
    
    // تنظيف أي محتوى سابق
    formContainer.innerHTML = '';
    
    // استخراج معلومات التنسيق والألوان من البيانات
    const formStyle = formData.style || {};
    const primaryColor = formStyle.primaryColor || '#9b87f5';
    const container = document.getElementById(containerId);
    
    // تحقق من وجود العنصر الحاوي
    if (!container) {
      console.error(`Container element with ID "${containerId}" not found.`);
      return;
    }
    
    const hideHeader = container.getAttribute('data-hide-header') === 'true';

    // إنشاء ترويسة النموذج إذا كانت غير مخفية
    if (!hideHeader && formData.title) {
      const headerElement = document.createElement('div');
      headerElement.className = 'codform-header';
      headerElement.style.backgroundColor = primaryColor;
      
      const titleElement = document.createElement('h3');
      titleElement.textContent = formData.title;
      headerElement.appendChild(titleElement);
      
      if (formData.description) {
        const descriptionElement = document.createElement('p');
        descriptionElement.textContent = formData.description;
        headerElement.appendChild(descriptionElement);
      }
      
      formContainer.appendChild(headerElement);
    }
    
    // إنشاء النموذج الفعلي
    const form = document.createElement('form');
    form.className = 'codform-form-fields';
    form.id = `codform-form-fields-${containerId}`;
    
    // تحويل بيانات النموذج للتنسيق المناسب
    const fields = transformFormData(formData);
    
    // بناء حقول النموذج
    if (fields && fields.length > 0) {
      fields.forEach(field => {
        // إنشاء عنصر الحقل
        const fieldElement = createFieldElement(field, primaryColor);
        if (fieldElement) {
          form.appendChild(fieldElement);
        }
      });
      
      // إضافة زر الإرسال إذا لم يكن موجودًا
      if (!fields.some(f => f.type === 'submit')) {
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'codform-submit-button pulse-animation';
        submitButton.textContent = 'إرسال الطلب';
        submitButton.style.backgroundColor = primaryColor;
        form.appendChild(submitButton);
      }
      
      // إضافة معالج الحدث للنموذج
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit(form, containerId);
      });
      
      // إضافة النموذج إلى الصفحة
      formContainer.appendChild(form);
    } else {
      // إظهار رسالة خطأ إذا لم تكن هناك حقول
      const errorElement = document.createElement('div');
      errorElement.className = 'codform-error-message';
      errorElement.textContent = 'لا توجد حقول في هذا النموذج. يرجى التحقق من إعدادات النموذج.';
      formContainer.appendChild(errorElement);
    }
  }

  /**
   * Field creation functions - مع التحقق من الأخطاء
   */
  function createFieldElement(field, primaryColor) {
    if (!field || !field.type) return null;
    
    try {
      const fieldContainer = document.createElement('div');
      fieldContainer.className = 'codform-field';
      fieldContainer.dataset.fieldId = field.id;
      fieldContainer.dataset.fieldType = field.type;
      
      // معالجة أنواع الحقول المختلفة
      switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
        case 'number':
          return createInputField(field, primaryColor);
        
        case 'textarea':
          return createTextareaField(field, primaryColor);
        
        case 'radio':
          return createRadioField(field, primaryColor);
        
        case 'checkbox':
          return createCheckboxField(field, primaryColor);
        
        case 'title':
        case 'form-title':
          return createTitleField(field, primaryColor);
        
        case 'text/html':
          return createHtmlField(field);
        
        case 'submit':
          return createSubmitButton(field, primaryColor);
        
        case 'cart-items':
          return createCartItemsField(field);
        
        case 'cart-summary':
          return createCartSummaryField(field);
        
        case 'whatsapp':
          return createWhatsAppButton(field, primaryColor);
        
        case 'image':
          return createImageField(field);
        
        default:
          console.warn('Unsupported field type:', field.type);
          return null;
      }
    } catch (error) {
      console.error('Error creating field element:', error);
      return null;
    }
  }

  // Field creation helper functions
  function createInputField(field, primaryColor) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-field';
    
    if (field.label) {
      const label = document.createElement('label');
      label.htmlFor = `field-${field.id}`;
      label.textContent = field.label;
      
      if (field.required) {
        const requiredMarker = document.createElement('span');
        requiredMarker.className = 'codform-required';
        requiredMarker.textContent = '*';
        label.appendChild(requiredMarker);
      }
      
      fieldContainer.appendChild(label);
    }
    
    const input = document.createElement('input');
    input.id = `field-${field.id}`;
    input.name = field.id;
    input.type = field.type === 'email' ? 'email' : 
                field.type === 'phone' ? 'tel' :
                field.type === 'number' ? 'number' : 'text';
    
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.required) input.required = true;
    if (field.value) input.value = field.value;
    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;
    
    fieldContainer.appendChild(input);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      fieldContainer.appendChild(helpText);
    }
    
    return fieldContainer;
  }

  function createTextareaField(field, primaryColor) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-field';
    
    if (field.label) {
      const label = document.createElement('label');
      label.htmlFor = `field-${field.id}`;
      label.textContent = field.label;
      
      if (field.required) {
        const requiredMarker = document.createElement('span');
        requiredMarker.className = 'codform-required';
        requiredMarker.textContent = '*';
        label.appendChild(requiredMarker);
      }
      
      fieldContainer.appendChild(label);
    }
    
    const textarea = document.createElement('textarea');
    textarea.id = `field-${field.id}`;
    textarea.name = field.id;
    
    if (field.placeholder) textarea.placeholder = field.placeholder;
    if (field.required) textarea.required = true;
    if (field.value) textarea.value = field.value;
    if (field.rows) textarea.rows = field.rows;
    
    fieldContainer.appendChild(textarea);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      fieldContainer.appendChild(helpText);
    }
    
    return fieldContainer;
  }

  function createRadioField(field, primaryColor) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-field';
    
    if (field.label) {
      const label = document.createElement('label');
      label.textContent = field.label;
      
      if (field.required) {
        const requiredMarker = document.createElement('span');
        requiredMarker.className = 'codform-required';
        requiredMarker.textContent = '*';
        label.appendChild(requiredMarker);
      }
      
      fieldContainer.appendChild(label);
    }
    
    const radioGroup = document.createElement('div');
    radioGroup.className = 'codform-radio-group';
    
    if (field.options && field.options.length > 0) {
      field.options.forEach((option, index) => {
        const radioContainer = document.createElement('div');
        radioContainer.className = 'codform-radio-container';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = `field-${field.id}-${index}`;
        radio.name = field.id;
        radio.value = option.value || option;
        
        if ((field.value && field.value === (option.value || option)) || 
            (index === 0 && field.defaultFirst)) {
          radio.checked = true;
        }
        
        const radioLabel = document.createElement('label');
        radioLabel.htmlFor = `field-${field.id}-${index}`;
        radioLabel.textContent = option.label || option;
        
        radioContainer.appendChild(radio);
        radioContainer.appendChild(radioLabel);
        radioGroup.appendChild(radioContainer);
      });
    }
    
    fieldContainer.appendChild(radioGroup);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      fieldContainer.appendChild(helpText);
    }
    
    return fieldContainer;
  }

  function createCheckboxField(field, primaryColor) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-field';
    
    if (field.label) {
      const label = document.createElement('label');
      label.textContent = field.label;
      
      if (field.required) {
        const requiredMarker = document.createElement('span');
        requiredMarker.className = 'codform-required';
        requiredMarker.textContent = '*';
        label.appendChild(requiredMarker);
      }
      
      fieldContainer.appendChild(label);
    }
    
    const checkboxGroup = document.createElement('div');
    checkboxGroup.className = 'codform-checkbox-group';
    
    if (field.options && field.options.length > 0) {
      field.options.forEach((option, index) => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'codform-checkbox-container';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `field-${field.id}-${index}`;
        checkbox.name = `${field.id}[]`;
        checkbox.value = option.value || option;
        
        if (field.value && Array.isArray(field.value) && 
            field.value.includes(option.value || option)) {
          checkbox.checked = true;
        }
        
        const checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = `field-${field.id}-${index}`;
        checkboxLabel.textContent = option.label || option;
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(checkboxLabel);
        checkboxGroup.appendChild(checkboxContainer);
      });
    }
    
    fieldContainer.appendChild(checkboxGroup);
    
    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.className = 'codform-help-text';
      helpText.textContent = field.helpText;
      fieldContainer.appendChild(helpText);
    }
    
    return fieldContainer;
  }

  function createTitleField(field, primaryColor) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-field';
    
    const title = document.createElement(field.style?.variant === 'title' ? 'h3' : 'h4');
    title.textContent = field.label || field.title || '';
    
    if (field.style) {
      if (field.style.color) title.style.color = field.style.color;
      if (field.style.textAlign) title.style.textAlign = field.style.textAlign;
      if (field.style.fontSize) title.style.fontSize = field.style.fontSize;
      if (field.style.fontWeight) title.style.fontWeight = field.style.fontWeight;
    }
    
    fieldContainer.appendChild(title);
    
    if (field.helpText || field.description) {
      const description = document.createElement('p');
      description.textContent = field.helpText || field.description || '';
      
      if (field.style) {
        if (field.style.descriptionColor) description.style.color = field.style.descriptionColor;
        if (field.style.textAlign) description.style.textAlign = field.style.textAlign;
        if (field.style.descriptionFontSize) description.style.fontSize = field.style.descriptionFontSize;
      }
      
      fieldContainer.appendChild(description);
    }
    
    return fieldContainer;
  }

  function createHtmlField(field) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-html-content';
    fieldContainer.innerHTML = field.content || '';
    return fieldContainer;
  }

  function createSubmitButton(field, primaryColor) {
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'codform-submit-button';
    button.textContent = field.label || 'إرسال الطلب';
    
    // إضافة التنسيق والمؤثرات
    button.style.backgroundColor = field.style?.backgroundColor || primaryColor;
    button.style.color = field.style?.color || '#ffffff';
    
    if (field.style && field.style.animation && field.style.animationType) {
      button.classList.add(`${field.style.animationType}-animation`);
    } else {
      button.classList.add('pulse-animation');
    }
    
    return button;
  }

  function createCartItemsField(field) {
    // هذا حقل عرض فقط لعناصر السلة
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-cart-items';
    fieldContainer.textContent = 'عناصر السلة (سيتم تحميلها من متجرك)';
    return fieldContainer;
  }

  function createCartSummaryField(field) {
    // هذا حقل عرض فقط لملخص السلة
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-cart-summary';
    fieldContainer.textContent = 'ملخص السلة (سيتم تحميله من متجرك)';
    return fieldContainer;
  }

  function createWhatsAppButton(field, primaryColor) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-field';
    
    const whatsappButton = document.createElement('a');
    whatsappButton.href = `https://wa.me/${field.phoneNumber || ''}`;
    whatsappButton.target = '_blank';
    whatsappButton.rel = 'noopener noreferrer';
    whatsappButton.className = 'codform-whatsapp-button';
    
    const whatsappIcon = document.createElement('span');
    whatsappIcon.className = 'codform-whatsapp-icon';
    whatsappIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';
    
    whatsappButton.appendChild(whatsappIcon);
    whatsappButton.appendChild(document.createTextNode(field.label || 'تواصل معنا عبر واتساب'));
    
    fieldContainer.appendChild(whatsappButton);
    
    return fieldContainer;
  }

  function createImageField(field) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-image-field';
    
    if (field.imageUrl) {
      const imageContainer = document.createElement('div');
      imageContainer.className = 'codform-image-container';
      
      const image = document.createElement('img');
      image.className = 'codform-image';
      image.src = field.imageUrl;
      image.alt = field.label || 'صورة';
      
      imageContainer.appendChild(image);
      fieldContainer.appendChild(imageContainer);
    }
    
    if (field.label) {
      const caption = document.createElement('p');
      caption.textContent = field.label;
      fieldContainer.appendChild(caption);
    }
    
    return fieldContainer;
  }

  /**
   * Handle form submission - مع تحسينات للتعامل مع الأخطاء
   */
  function handleFormSubmit(form, containerId) {
    if (!form) {
      console.error('Form element is null');
      return;
    }
    
    if (!containerId) {
      console.error('Container ID is required');
      return;
    }
    
    // Get form container elements - مع التحقق من وجودها
    const formContainer = document.getElementById(`codform-form-${containerId}`);
    const successMessage = document.getElementById(`codform-success-${containerId}`);
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Container with ID "${containerId}" not found`);
      return;
    }
    
    const formId = container.getAttribute('data-form-id');
    const productId = container.getAttribute('data-product-id');
    
    if (!formId) {
      console.error('Form ID is required');
      return;
    }
    
    // تجميع بيانات النموذج
    const formData = new FormData(form);
    const data = {};
    
    // تحويل بيانات النموذج إلى كائن JSON
    for (let [key, value] of formData.entries()) {
      // حالة خاصة للقوائم مثل مربعات الاختيار المتعددة
      if (key.endsWith('[]')) {
        const cleanKey = key.slice(0, -2);
        if (!data[cleanKey]) data[cleanKey] = [];
        data[cleanKey].push(value);
      } else {
        data[key] = value;
      }
    }
    
    // إضافة معلومات المنتج إذا كانت متاحة
    if (productId) {
      data.product_id = productId;
      
      // محاولة استخراج معلومات المنتج من صفحة المنتج في Shopify
      try {
        data.product_details = 'Product details will be populated by Shopify';
      } catch (e) {
        console.warn('Could not extract product details from Shopify page');
      }
    }
    
    // إضافة معلومات المتجر
    data.shop_id = window.Shopify?.shop || '';
    data.form_id = formId;
    
    // تحقق من وجود زر الإرسال
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : '';
    
    // إظهار حالة التحميل
    form.classList.add('codform-loading');
    
    if (submitButton) {
      submitButton.textContent = 'جاري الإرسال...';
      submitButton.disabled = true;
    }
    
    // إرسال البيانات إلى الخادم
    fetch('https://mtyfuwdsshlzqwjujavp.functions.supabase.co/api-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg'
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            try {
              return JSON.parse(text);
            } catch (e) {
              throw new Error(text || `خطأ في الاستجابة: ${response.status}`);
            }
          }).then(data => {
            throw new Error(data.error || `خطأ في الاستجابة: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(result => {
        // إظهار رسالة النجاح
        if (formContainer) formContainer.style.display = 'none';
        if (successMessage) successMessage.style.display = 'block';
        
        // محاولة تتبع التحويل في Shopify (اختياري)
        try {
          if (typeof window.Shopify !== 'undefined' && window.Shopify.analytics) {
            window.Shopify.analytics.track('COD Form Submission', {
              form_id: formId,
              product_id: productId
            });
          }
        } catch (e) {
          console.warn('Could not track conversion in Shopify analytics');
        }
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        
        // إظهار رسالة خطأ للمستخدم
        const errorContainer = document.getElementById(`codform-error-${containerId}`);
        const errorMessage = document.getElementById(`codform-error-message-${containerId}`);
        const errorDetails = document.getElementById(`codform-error-details-${containerId}`);
        
        if (errorMessage) {
          errorMessage.textContent = 'حدث خطأ أثناء إرسال النموذج، يرجى المحاولة مرة أخرى.';
        }
        
        if (errorDetails) {
          errorDetails.textContent = error.message || 'خطأ غير معروف';
        }
        
        if (errorContainer) {
          errorContainer.style.display = 'block';
        }
        
        if (formContainer) {
          formContainer.style.display = 'none';
        }
        
        // إعادة تمكين الزر
        if (submitButton) {
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        }
        
        form.classList.remove('codform-loading');
      });
  }
})();

</edits_to_apply>

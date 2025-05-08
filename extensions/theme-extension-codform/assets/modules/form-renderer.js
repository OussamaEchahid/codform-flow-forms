
// CODFORM Form Renderer Module
function CODFORMFormRenderer() {
  const { 
    renderField, 
    renderWhatsAppButton, 
    renderImageField,
    renderCountdownTimer,
    renderShippingOptions,
    renderStepFields 
  } = CODFORMFieldRenderer();

  const { navigateStep } = CODFORMStepNavigator();
  
  function renderForm(container, formData, productId, submitFormCallback) {
    console.log('CODFORM: Starting form render with data:', formData);
    
    const formContainer = container.querySelector('.codform-form');
    if (!formContainer) {
      console.error('CODFORM: Form container not found');
      return;
    }
    
    // Clear any existing content
    formContainer.innerHTML = '';
    
    // Check if RTL is needed
    const isRtl = document.dir === 'rtl' || document.documentElement.lang === 'ar' || 
                 container.closest('.codform-rtl') !== null;
    
    if (isRtl) {
      formContainer.style.direction = 'rtl';
      formContainer.classList.add('codform-rtl');
    }
    
    // Apply form title and description from formData if available
    const formHeader = container.querySelector('.codform-header');
    if (formHeader) {
      // Update the header background color based on form's primary color
      if (formData.primaryColor) {
        formHeader.style.backgroundColor = formData.primaryColor;
      }
      
      // Update the form title if available in formData
      const titleElement = formHeader.querySelector('.codform-title');
      if (titleElement && formData.title) {
        titleElement.textContent = formData.title;
      }
      
      // Update the form description if available in formData
      const descElement = formHeader.querySelector('.codform-description');
      if (descElement && formData.description) {
        descElement.textContent = formData.description;
      }
    }
    
    // Set CSS variables for form styling with more comprehensive defaults
    const formStyles = document.createElement('style');
    formStyles.textContent = `
      #${container.id} {
        --form-primary-color: ${formData.primaryColor || '#9b87f5'};
        --form-border-radius: ${formData.borderRadius || '0.5rem'};
        --form-font-size: ${formData.fontSize || '1rem'};
      }
      #${container.id} .codform-submit-button,
      #${container.id} .codform-next-button,
      #${container.id} .codform-whatsapp-button,
      #${container.id} .codform-button {
        background-color: ${formData.primaryColor || '#9b87f5'} !important;
        color: white !important;
        border-radius: ${formData.borderRadius || '0.5rem'} !important;
        font-size: ${formData.fontSize || '1rem'} !important;
        padding: 10px 15px !important;
        margin: 10px 0 !important;
        cursor: pointer !important;
        border: none !important;
        width: 100% !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
      }
      #${container.id} .codform-submit-button:hover,
      #${container.id} .codform-next-button:hover,
      #${container.id} .codform-whatsapp-button:hover,
      #${container.id} .codform-button:hover {
        opacity: 0.9 !important;
      }
      #${container.id} .codform-step-active {
        background-color: ${formData.primaryColor || '#9b87f5'} !important;
      }
      #${container.id} input:focus,
      #${container.id} textarea:focus,
      #${container.id} select:focus {
        border-color: ${formData.primaryColor || '#9b87f5'} !important;
        box-shadow: 0 0 0 3px ${formData.primaryColor || '#9b87f5'}22 !important;
        outline: none !important;
      }
      #${container.id} input[type="radio"]:checked,
      #${container.id} input[type="checkbox"]:checked {
        background-color: ${formData.primaryColor || '#9b87f5'} !important;
        border-color: ${formData.primaryColor || '#9b87f5'} !important;
      }
      #${container.id} .codform-header {
        background-color: ${formData.primaryColor || '#9b87f5'} !important;
        border-top-left-radius: ${formData.borderRadius || '0.5rem'} !important;
        border-top-right-radius: ${formData.borderRadius || '0.5rem'} !important;
        padding: 12px 15px !important;
      }
      #${container.id} .codform-form {
        border-radius: ${formData.borderRadius || '0.5rem'} !important;
        overflow: hidden !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
      }
      #${container.id} .codform-form label {
        display: block !important;
        margin-bottom: 8px !important;
        font-weight: 500 !important;
        color: #333 !important;
      }
      #${container.id} .codform-form input,
      #${container.id} .codform-form textarea,
      #${container.id} .codform-form select {
        width: 100% !important;
        padding: 10px 12px !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: ${formData.borderRadius || '0.5rem'} !important;
        font-size: ${formData.fontSize || '1rem'} !important;
        margin-bottom: 8px !important;
      }
      #${container.id} .codform-form-field {
        margin-bottom: 20px !important;
      }
      #${container.id} .codform-radio-group,
      #${container.id} .codform-checkbox-group {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }
      #${container.id} .codform-radio-option,
      #${container.id} .codform-checkbox-option {
        display: flex !important;
        align-items: center !important;
      }
      #${container.id}.codform-rtl .codform-radio-option,
      #${container.id}.codform-rtl .codform-checkbox-option {
        flex-direction: row-reverse !important;
        justify-content: flex-start !important;
      }
      #${container.id} .codform-radio-option input,
      #${container.id} .codform-checkbox-option input {
        width: auto !important;
        margin-right: 8px !important;
      }
      #${container.id}.codform-rtl .codform-radio-option input,
      #${container.id}.codform-rtl .codform-checkbox-option input {
        margin-right: 0 !important;
        margin-left: 8px !important;
      }
      #${container.id} .codform-error {
        background-color: #fee2e2 !important;
        border: 1px solid #fecaca !important;
        color: #b91c1c !important;
        padding: 12px !important;
        border-radius: ${formData.borderRadius || '0.5rem'} !important;
        margin-bottom: 15px !important;
      }
      #${container.id} .codform-retry-button {
        background-color: #b91c1c !important;
        color: white !important;
        border: none !important;
        padding: 8px 12px !important;
        border-radius: ${formData.borderRadius || '0.3rem'} !important;
        cursor: pointer !important;
        margin-top: 8px !important;
        font-size: 14px !important;
      }
      #${container.id} .codform-steps-container {
        padding: 20px !important;
        background-color: white !important;
      }
      #${container.id} .codform-steps-nav {
        display: flex !important;
        justify-content: center !important;
        margin-bottom: 20px !important;
        padding-top: 15px !important;
        background-color: white !important;
      }
      #${container.id} .codform-step-indicators {
        display: flex !important;
        gap: 10px !important;
      }
      #${container.id} .codform-step-indicator {
        width: 30px !important;
        height: 30px !important;
        border-radius: 50% !important;
        background-color: #e2e8f0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-weight: bold !important;
        color: white !important;
      }
      #${container.id} .codform-nav-buttons {
        display: flex !important;
        gap: 10px !important;
        margin-top: 20px !important;
        padding: 0 20px 20px 20px !important;
        background-color: white !important;
      }
    `;
    container.appendChild(formStyles);
    
    // Create form element
    const form = document.createElement('form');
    form.id = 'codform-submission-form-' + (formData.id || 'form');
    form.className = 'codform-submission-form';
    if (isRtl) {
      form.dir = 'rtl';
      form.classList.add('codform-rtl');
    }
    
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
    
    // Extract fields from data structure with better error handling
    let fields = [];
    
    try {
      // Check for different form data structures
      if (formData.fields && Array.isArray(formData.fields) && formData.fields.length > 0) {
        // Use fields directly if available
        console.log('CODFORM: Using fields array directly:', formData.fields.length, 'fields');
        fields = formData.fields;
      }
      else if (formData.data) {
        // Try to extract fields from data property
        if (Array.isArray(formData.data) && formData.data.length > 0) {
          // Handle step structure
          console.log('CODFORM: Using step format, data has', formData.data.length, 'items');
          let extractedFields = [];
          
          formData.data.forEach((step, stepIndex) => {
            // Add step marker
            extractedFields.push({
              id: step.id || `step-${stepIndex}`,
              type: 'step',
              label: step.title || `Step ${stepIndex + 1}`,
              stepIndex: stepIndex,
              isStep: true
            });
            
            // Add fields from this step
            if (step.fields && Array.isArray(step.fields)) {
              step.fields.forEach(field => {
                extractedFields.push({
                  ...field,
                  stepId: step.id,
                  stepTitle: step.title,
                  stepIndex: stepIndex
                });
              });
            }
          });
          
          fields = extractedFields;
          console.log('CODFORM: Extracted', fields.length, 'fields from data array');
        }
        else if (typeof formData.data === 'object' && formData.data.steps) {
          // Handle nested steps structure
          console.log('CODFORM: Using nested steps format');
          let extractedFields = [];
          
          formData.data.steps.forEach((step, stepIndex) => {
            // Add step marker
            extractedFields.push({
              id: step.id || `step-${stepIndex}`,
              type: 'step',
              label: step.title || `Step ${stepIndex + 1}`,
              stepIndex: stepIndex,
              isStep: true
            });
            
            // Add fields from this step
            if (step.fields && Array.isArray(step.fields)) {
              step.fields.forEach(field => {
                extractedFields.push({
                  ...field,
                  stepId: step.id,
                  stepTitle: step.title,
                  stepIndex: stepIndex
                });
              });
            }
          });
          
          fields = extractedFields;
          console.log('CODFORM: Extracted', fields.length, 'fields from nested steps');
        }
      }
    } catch (error) {
      console.error('CODFORM: Error extracting fields:', error);
      fields = [];
    }
    
    // Log results of field extraction
    if (fields.length === 0) {
      console.warn('CODFORM: No fields extracted from form data');
    } else {
      console.log('CODFORM: Successfully extracted', fields.length, 'fields');
    }
    
    // Group fields by steps if steps are present
    let steps = [];
    let currentStep = 0;
    
    // Check if fields have step information
    const hasSteps = fields.some(field => field.stepId || field.stepIndex !== undefined || field.type === 'step');
    
    if (hasSteps) {
      console.log('CODFORM: Form has steps, organizing fields by step');
      
      // Group fields by step
      const fieldsByStep = {};
      let currentStepIndex = 0;
      
      fields.forEach(field => {
        if (field.type === 'step') {
          currentStepIndex = field.stepIndex || 0;
          if (!fieldsByStep[currentStepIndex]) {
            fieldsByStep[currentStepIndex] = {
              title: field.label || `Step ${currentStepIndex + 1}`,
              fields: []
            };
          }
        } else {
          const stepIndex = field.stepIndex || currentStepIndex || 0;
          if (!fieldsByStep[stepIndex]) {
            fieldsByStep[stepIndex] = {
              title: field.stepTitle || `Step ${stepIndex + 1}`,
              fields: []
            };
          }
          fieldsByStep[stepIndex].fields.push(field);
        }
      });
      
      // Convert to array and sort by step index
      steps = Object.keys(fieldsByStep)
        .map(key => fieldsByStep[key])
        .sort((a, b) => parseInt(a.stepIndex) - parseInt(b.stepIndex));
      
      console.log('CODFORM: Form has', steps.length, 'steps');
      
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
      if (steps.length > 0 && steps[currentStep]?.fields) {
        const stepContent = renderStepFields(steps[currentStep].fields, formData.primaryColor);
        stepsContainer.appendChild(stepContent);
      } else {
        console.warn('CODFORM: No fields found for the first step');
      }
      
      form.appendChild(stepsContainer);
      
      // Add step navigation buttons if multiple steps
      if (steps.length > 1) {
        const navButtons = document.createElement('div');
        navButtons.className = 'codform-nav-buttons';
        
        const prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.className = 'codform-prev-button';
        prevButton.textContent = formData.prevButtonText || (isRtl ? 'السابق' : 'Previous');
        prevButton.style.display = 'none'; // Hide initially
        prevButton.addEventListener('click', function() {
          navigateStep(form, -1);
        });
        
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'codform-next-button';
        nextButton.textContent = formData.nextButtonText || (isRtl ? 'التالي' : 'Next');
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
        
        // Get submit button text with fallbacks:
        // First check lowercase version (from database)
        const buttonText = formData.submitbuttontext || formData.submitButtonText || (isRtl ? 'إرسال الطلب' : 'Submit');
        submitButton.textContent = buttonText;
          
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
        
        // Get submit button text with fallbacks
        const buttonText = formData.submitbuttontext || formData.submitButtonText || (isRtl ? 'إرسال الطلب' : 'Submit');
        submitButton.textContent = buttonText;
          
        // Apply primary color
        if (formData.primaryColor) {
          submitButton.style.backgroundColor = formData.primaryColor;
        }
        form.appendChild(submitButton);
      }
      
      // Set data attribute for current step
      form.dataset.currentStep = currentStep;
      form.dataset.totalSteps = steps.length;
    } else {
      // Render form fields based on formData (single step)
      console.log('CODFORM: Rendering as single-step form');
      
      if (fields && Array.isArray(fields) && fields.length > 0) {
        fields.forEach(field => {
          renderField(form, field, formData.primaryColor);
        });
      } else {
        console.warn('CODFORM: No fields found in form data');
      }
      
      // Add submit button for single-step form
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'codform-submit-button';
      
      // Get submit button text with fallbacks - check lowercase version first (from database)
      const buttonText = formData.submitbuttontext || formData.submitButtonText || (isRtl ? 'إرسال الطلب' : 'Submit');
      submitButton.textContent = buttonText;
        
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


// CODFORM Form Renderer Module
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
        prevButton.textContent = formData.prevButtonText || 'السابق';
        prevButton.style.display = 'none'; // Hide initially
        prevButton.addEventListener('click', function() {
          navigateStep(form, -1);
        });
        
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'codform-next-button';
        nextButton.textContent = formData.nextButtonText || 'التالي';
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
        submitButton.textContent = formData.submitButtonText || 'إرسال الطلب';
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
        submitButton.textContent = formData.submitButtonText || 'إرسال الطلب';
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
      if (formData.fields && Array.isArray(formData.fields)) {
        formData.fields.forEach(field => {
          renderField(form, field, formData.primaryColor);
        });
      }
      
      // Add submit button for single-step form
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'codform-submit-button';
      submitButton.textContent = formData.submitButtonText || 'إرسال الطلب';
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

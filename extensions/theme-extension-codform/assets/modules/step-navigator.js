
// CODFORM Step Navigator Module
function CODFORMStepNavigator() {
  function navigateStep(form, direction) {
    const currentStep = parseInt(form.dataset.currentStep);
    const totalSteps = parseInt(form.dataset.totalSteps);
    const newStep = currentStep + direction;
    
    // Validate before going to next step
    if (direction > 0) {
      // Get all required fields in the current step
      const currentStepElement = form.querySelector('.codform-steps-container .codform-step');
      const requiredFields = currentStepElement.querySelectorAll('[required]');
      let isValid = true;
      
      // Check if all required fields are filled
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('codform-field-error');
        } else {
          field.classList.remove('codform-field-error');
        }
      });
      
      if (!isValid) {
        // Show validation message
        let errorMsg = form.querySelector('.codform-validation-message');
        if (!errorMsg) {
          errorMsg = document.createElement('div');
          errorMsg.className = 'codform-validation-message';
          errorMsg.textContent = 'يرجى ملء جميع الحقول المطلوبة';
          form.querySelector('.codform-steps-container').appendChild(errorMsg);
        }
        return;
      } else {
        // Remove validation message if exists
        const errorMsg = form.querySelector('.codform-validation-message');
        if (errorMsg) {
          errorMsg.remove();
        }
      }
    }
    
    // Check if new step is valid
    if (newStep >= 0 && newStep < totalSteps) {
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
        
        // Show completed steps
        if (idx < newStep) {
          indicator.classList.add('codform-step-completed');
        } else {
          indicator.classList.remove('codform-step-completed');
        }
      });
      
      // Show/hide navigation buttons
      const prevButton = form.querySelector('.codform-prev-button');
      const nextButton = form.querySelector('.codform-next-button');
      const submitButton = form.querySelector('.codform-submit-button');
      
      prevButton.style.display = newStep > 0 ? 'block' : 'none';
      nextButton.style.display = newStep < totalSteps - 1 ? 'block' : 'none';
      submitButton.style.display = newStep === totalSteps - 1 ? 'block' : 'none';
      
      // Update step content
      const stepsContainer = form.querySelector('.codform-steps-container');
      stepsContainer.innerHTML = '';
      
      // Fetch the fields for the current step
      const matchingFields = Array.from(document.querySelectorAll('.codform-fields-data'))
        .find(el => el.dataset.stepIndex === newStep.toString());
      
      if (matchingFields) {
        const fields = JSON.parse(matchingFields.textContent);
        stepsContainer.appendChild(renderStepFields(fields));
      } else {
        console.error('CODFORM: Could not find fields for step', newStep);
      }
    }
  }
  
  return { navigateStep };
}

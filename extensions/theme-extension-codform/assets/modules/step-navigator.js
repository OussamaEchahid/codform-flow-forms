
// CODFORM Step Navigator Module
function CODFORMStepNavigator() {
  function navigateStep(form, direction) {
    // Get current step and total steps
    const currentStep = parseInt(form.dataset.currentStep);
    const totalSteps = parseInt(form.dataset.totalSteps);
    
    // Calculate new step
    const newStep = currentStep + direction;
    
    // Validate new step
    if (newStep < 0 || newStep >= totalSteps) {
      console.error('CODFORM: Invalid step navigation');
      return;
    }
    
    // Update form's current step
    form.dataset.currentStep = newStep;
    
    // Get containers
    const stepsContainer = form.querySelector('.codform-steps-container');
    const stepIndicators = form.querySelectorAll('.codform-step-indicator');
    const prevButton = form.querySelector('.codform-prev-button');
    const nextButton = form.querySelector('.codform-next-button');
    const submitButton = form.querySelector('.codform-submit-button');
    
    if (!stepsContainer) {
      console.error('CODFORM: Steps container not found');
      return;
    }
    
    // Remove existing step content
    stepsContainer.innerHTML = '';
    
    // Get step fields renderer from parent module
    const { renderStepFields } = CODFORMFieldRenderer();
    
    // Get fields for the current step (we need to get them from the form's data attribute)
    const formData = window.codformData;
    if (!formData || !formData.fields) {
      console.error('CODFORM: Form data not available for step navigation');
      return;
    }
    
    // Group fields by steps if steps are present
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
    const steps = Object.keys(fieldsByStep)
      .map(key => fieldsByStep[key])
      .sort((a, b) => parseInt(a.stepIndex) - parseInt(b.stepIndex));
    
    // Render current step
    const stepContent = renderStepFields(steps[newStep].fields, formData.primaryColor);
    stepsContainer.appendChild(stepContent);
    
    // Update step indicators
    if (stepIndicators && stepIndicators.length) {
      stepIndicators.forEach((indicator, idx) => {
        indicator.classList.remove('codform-step-active', 'codform-step-completed');
        if (idx === newStep) {
          indicator.classList.add('codform-step-active');
        } else if (idx < newStep) {
          indicator.classList.add('codform-step-completed');
        }
      });
    }
    
    // Update navigation buttons
    if (prevButton) {
      prevButton.style.display = newStep > 0 ? 'block' : 'none';
    }
    
    if (nextButton) {
      nextButton.style.display = newStep < totalSteps - 1 ? 'block' : 'none';
    }
    
    if (submitButton) {
      submitButton.style.display = newStep === totalSteps - 1 ? 'block' : 'none';
    }
  }
  
  return { navigateStep };
}

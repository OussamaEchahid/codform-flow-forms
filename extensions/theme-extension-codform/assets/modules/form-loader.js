
// CODFORM Form Loader Module
function CODFORMFormLoader(API_BASE_URL) {
  const { renderForm } = CODFORMFormRenderer();
  const { submitForm } = CODFORMFormSubmitter(API_BASE_URL);
  
  function loadForm(container, formId, productId) {
    console.log('CODFORM: Loading form', formId);
    
    // Use provided API_BASE_URL or fallback to the Supabase Edge Function URL
    const baseUrl = API_BASE_URL || 'https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1';
    const apiUrl = `${baseUrl}/api-forms/${formId}`;
    
    console.log('CODFORM: Fetching form from:', apiUrl);
    
    // Show loader while fetching
    showLoader(container);
    hideError(container);
    hideForm(container);
    hideSuccess(container);
    
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
          throw new Error(`Failed to load form: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('CODFORM: Form data received:', data);
        
        // Verify data integrity before rendering
        if (!data || (data.fields && data.fields.length === 0 && (!data.data || !Array.isArray(data.data)))) {
          throw new Error('Invalid form data: No fields found');
        }
        
        hideLoader(container);
        renderForm(container, data, productId, submitForm);
        showForm(container);
      })
      .catch(error => {
        console.error('CODFORM: Error loading form', error);
        hideLoader(container);
        showError(container, error.message);
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
  
  function showError(container, errorMessage) {
    hideLoader(container);
    const error = container.querySelector('.codform-error');
    if (error) {
      // Update error message if provided
      const errorText = error.querySelector('.codform-error-text');
      if (errorText && errorMessage) {
        errorText.textContent = errorMessage;
      }
      error.style.display = 'block';
    }
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

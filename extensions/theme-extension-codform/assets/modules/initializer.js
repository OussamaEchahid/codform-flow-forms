
// CODFORM Initializer Module
function CODFORMInitializer() {
  // Using hard-coded API base URL to ensure consistent behavior
  const API_BASE_URL = 'https://mtyfuwdsshlzqwjujavp.supabase.co/functions/v1';
  
  console.log('CODFORM: Initializing with API base URL:', API_BASE_URL);
  
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
        showError(container, 'No form ID provided');
        return;
      }
      
      // Load the form
      loadForm(container, formId, productId);
      
      // Set up retry button
      const retryButton = container.querySelector('.codform-retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', function() {
          console.log('CODFORM: Retry button clicked, reloading form');
          hideError(container);
          loadForm(container, formId, productId);
        });
      }
    });
  }
  
  return { initCODFORM };
}

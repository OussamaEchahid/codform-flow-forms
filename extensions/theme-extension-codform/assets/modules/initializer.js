
// CODFORM Initializer Module
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


// CODFORM Form Loader Module
function CODFORMFormLoader(API_BASE_URL) {
  const { renderForm } = CODFORMFormRenderer();
  const { submitForm } = CODFORMFormSubmitter(API_BASE_URL);
  
  function loadForm(container, formId, productId) {
    console.log('CODFORM: Loading form', formId);
    
    // Double check API base URL is properly set
    if (!API_BASE_URL || API_BASE_URL === 'undefined') {
      console.error('CODFORM: API_BASE_URL is invalid:', API_BASE_URL);
      showError(container, 'Configuration error: API URL not defined or invalid');
      return;
    }
    
    // Ensure the API URL is correct and includes the /api-forms/ endpoint
    let apiUrl = API_BASE_URL;
    if (!apiUrl.endsWith('/')) apiUrl += '/';
    apiUrl += 'api-forms/' + formId;
    
    console.log('CODFORM: Fetching form from:', apiUrl);
    
    // Show loader while fetching
    showLoader(container);
    hideError(container);
    hideForm(container);
    hideSuccess(container);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const urlWithTimestamp = `${apiUrl}?t=${timestamp}`;
    
    fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors',
      cache: 'no-store'
    })
      .then(response => {
        console.log('CODFORM: API Response status:', response.status);
        
        // Check if we got HTML instead of JSON (common with CORS issues)
        const contentType = response.headers.get('Content-Type');
        console.log('CODFORM: Content-Type:', contentType);
        
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Received HTML instead of JSON (status ${response.status}). This usually indicates a CORS issue or incorrect API URL.`);
        }
        
        if (!response.ok) {
          throw new Error(`Failed to load form: ${response.status} - ${response.statusText}`);
        }
        
        return response.json();
      })
      .then(data => {
        console.log('CODFORM: Form data received:', data);
        
        // Enhanced validation of form data
        if (!data) {
          throw new Error('Invalid form data: Empty response');
        }
        
        if (data.error) {
          throw new Error(`API error: ${data.error}`);
        }
        
        // Check if form is published
        if (data.is_published === false) {
          throw new Error('This form is not published. Please publish the form before embedding it.');
        }
        
        // More flexible data structure validation
        let hasValidContent = false;
        
        // Check different possible data structures
        if (data.fields && Array.isArray(data.fields) && data.fields.length > 0) {
          hasValidContent = true;
        } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          hasValidContent = true;
        } else if (data.data && typeof data.data === 'object' && data.data.steps) {
          hasValidContent = true;
        }
        
        if (!hasValidContent) {
          console.error('CODFORM: Form has no valid content:', data);
          throw new Error('Invalid form data: No valid content found. The form may be empty or misconfigured.');
        }
        
        hideLoader(container);
        renderForm(container, data, productId, submitForm);
        showForm(container);
      })
      .catch(error => {
        console.error('CODFORM: Error loading form:', error);
        
        // Provide more specific error messages for common problems
        let errorMessage = error.message;
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error: Unable to connect to the form server. Please check your internet connection.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error: The form server is not allowing connections from this domain.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'Format error: The server response was not in the expected format.';
        }
        
        hideLoader(container);
        showError(container, errorMessage);
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

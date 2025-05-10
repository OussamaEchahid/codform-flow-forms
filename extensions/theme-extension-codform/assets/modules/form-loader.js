
// CODFORM Form Loader Module
function CODFORMFormLoader(API_BASE_URL) {
  const { renderForm } = CODFORMFormRenderer();
  const { submitForm } = CODFORMFormSubmitter(API_BASE_URL);
  
  // Circuit breaker state
  const circuitBreaker = {
    failureCount: 0,
    lastFailureTime: null,
    isOpen: false,
    threshold: 3,
    resetTimeout: 60000 // 1 minute
  };
  
  function loadForm(container, formId, productId) {
    console.log('CODFORM: Loading form', formId);
    
    // Check if circuit breaker is open
    if (circuitBreaker.isOpen) {
      const now = new Date().getTime();
      if (now - circuitBreaker.lastFailureTime < circuitBreaker.resetTimeout) {
        console.error('CODFORM: Circuit breaker is open. Too many failures recently.');
        showError(container, 'خدمة النماذج غير متاحة حاليًا. يرجى المحاولة لاحقًا.');
        return;
      } else {
        // Reset circuit breaker after timeout
        console.log('CODFORM: Resetting circuit breaker');
        circuitBreaker.isOpen = false;
        circuitBreaker.failureCount = 0;
      }
    }
    
    // Double check API base URL is properly set
    if (!API_BASE_URL || API_BASE_URL === 'undefined') {
      console.error('CODFORM: API_BASE_URL is invalid:', API_BASE_URL);
      showError(container, 'خطأ في التكوين: عنوان API غير محدد أو غير صالح');
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
    
    // Add retry mechanism with absolute maximum (hard circuit breaker)
    let retryCount = 0;
    const maxRetries = 1;  // Reduced max retries to minimize user waiting
    const absoluteMaxRetries = 2; // Global maximum retries regardless of other conditions
    let globalRetryCount = 0;
    
    // Track fetch timeout - global timeout for entire operation
    let globalTimeoutId = setTimeout(() => {
      console.error('CODFORM: Global timeout reached - cancelling all operations');
      cleanupAllTimeouts();
      showError(container, 'انتهت مهلة تحميل النموذج. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    }, 10000); // 10 second global timeout
    
    // Store all timeout IDs so we can clear them
    const timeoutIds = [];
    
    function cleanupAllTimeouts() {
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds.length = 0; // Clear the array
      clearTimeout(globalTimeoutId);
    }
    
    function attemptFetch() {
      // If we've hit the absolute maximum retries, stop immediately
      if (globalRetryCount >= absoluteMaxRetries) {
        cleanupAllTimeouts();
        
        console.error(`CODFORM: Hit absolute maximum retries (${absoluteMaxRetries}). Stopping.`);
        circuitBreaker.failureCount++;
        circuitBreaker.lastFailureTime = new Date().getTime();
        
        if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
          circuitBreaker.isOpen = true;
        }
        
        showError(container, 'لم نتمكن من تحميل النموذج بعد عدة محاولات. يرجى التحقق من اتصالك بالإنترنت.');
        return;
      }
      
      globalRetryCount++;
      
      // Set fetch timeout (for this specific attempt)
      const fetchTimeoutId = setTimeout(() => {
        console.error('CODFORM: Fetch timeout');
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`CODFORM: Retrying (${retryCount}/${maxRetries})...`);
          showRetryMessage(container, retryCount, maxRetries);
          
          // Start a new attempt with exponential backoff
          const backoffTimeoutId = setTimeout(attemptFetch, 1000 * retryCount);
          timeoutIds.push(backoffTimeoutId);
        } else {
          console.error('CODFORM: All retries failed');
          circuitBreaker.failureCount++;
          circuitBreaker.lastFailureTime = new Date().getTime();
          
          if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
            circuitBreaker.isOpen = true;
          }
          
          showError(container, 'انتهت مهلة الاتصال. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
        }
      }, 5000); // 5 second timeout per attempt
      
      timeoutIds.push(fetchTimeoutId);
      
      // Generate request ID for tracing this specific request through logs
      const requestId = `form_${formId}_req_${Math.random().toString(36).substring(2, 8)}`;
      console.log(`CODFORM [${requestId}]: Starting fetch request`);
      
      fetch(urlWithTimestamp, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Request-ID': requestId
        },
        mode: 'cors',
        cache: 'no-store'
      })
        .then(response => {
          // Clear fetch timeout for this attempt
          clearTimeout(fetchTimeoutId);
          
          console.log(`CODFORM [${requestId}]: API Response status:`, response.status);
          
          // Check if we got HTML instead of JSON (common with CORS issues)
          const contentType = response.headers.get('Content-Type');
          console.log(`CODFORM [${requestId}]: Content-Type:`, contentType);
          
          if (contentType && contentType.includes('text/html')) {
            console.error(`CODFORM [${requestId}]: Received HTML instead of JSON`);
            throw new Error(`Received HTML instead of JSON (status ${response.status}). This usually indicates a CORS issue or incorrect API URL.`);
          }
          
          if (!response.ok) {
            throw new Error(`Failed to load form: ${response.status} - ${response.statusText}`);
          }
          
          if (!contentType || !contentType.includes('application/json')) {
            console.error(`CODFORM [${requestId}]: Invalid content type: ${contentType}`);
            throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
          }
          
          return response.json().catch(err => {
            console.error(`CODFORM [${requestId}]: Error parsing JSON:`, err);
            throw new Error('Could not parse JSON response');
          });
        })
        .then(data => {
          console.log(`CODFORM [${requestId}]: Form data received:`, data);
          
          // Reset circuit breaker on successful fetch
          circuitBreaker.failureCount = 0;
          
          // Clear all timeouts since we got a successful response
          cleanupAllTimeouts();
          
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
          
          // More robust data structure validation
          const hasValidContent = 
            (data.fields && Array.isArray(data.fields) && data.fields.length > 0) ||
            (data.data && Array.isArray(data.data) && data.data.length > 0) ||
            (data.data && typeof data.data === 'object' && data.data.steps);
          
          if (!hasValidContent) {
            console.error(`CODFORM [${requestId}]: Form has no valid content:`, data);
            throw new Error('Invalid form data: No valid content found. The form may be empty or misconfigured.');
          }
          
          hideLoader(container);
          renderForm(container, data, productId, submitForm);
          showForm(container);
        })
        .catch(error => {
          console.error(`CODFORM [${requestId}]: Error loading form:`, error);
          
          // Retry logic
          if (retryCount < maxRetries && globalRetryCount < absoluteMaxRetries) {
            retryCount++;
            console.log(`CODFORM [${requestId}]: Retrying (${retryCount}/${maxRetries})...`);
            
            // Show retry message
            showRetryMessage(container, retryCount, maxRetries);
            
            // Exponential backoff
            const retryTimeoutId = setTimeout(attemptFetch, 1000 * retryCount);
            timeoutIds.push(retryTimeoutId);
            return;
          }
          
          // Clear all timeouts since we're showing an error
          cleanupAllTimeouts();
          
          // Update circuit breaker state
          circuitBreaker.failureCount++;
          circuitBreaker.lastFailureTime = new Date().getTime();
          
          if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
            circuitBreaker.isOpen = true;
          }
          
          // Provide more specific error messages for common problems
          let errorMessage = error.message;
          
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'خطأ في الشبكة: تعذر الاتصال بخادم النماذج. يرجى التحقق من اتصالك بالإنترنت.';
          } else if (error.message.includes('CORS')) {
            errorMessage = 'خطأ CORS: خادم النماذج لا يسمح بالاتصالات من هذا النطاق.';
          } else if (error.message.includes('JSON')) {
            errorMessage = 'خطأ في التنسيق: استجابة الخادم لم تكن بالتنسيق المتوقع.';
          } else if (error.message.includes('HTML instead of JSON')) {
            errorMessage = 'خطأ في استجابة الخادم: تم استلام HTML بدلاً من JSON. يرجى التحقق من تكوين الخادم.';
          }
          
          hideLoader(container);
          showError(container, errorMessage);
        });
    }
    
    // Helper function to show retry message
    function showRetryMessage(container, currentRetry, maxRetries) {
      const loaderEl = container.querySelector('.codform-loader');
      if (loaderEl) {
        const retryText = loaderEl.querySelector('.codform-retry-text');
        if (retryText) {
          retryText.textContent = `جاري إعادة المحاولة (${currentRetry}/${maxRetries})...`;
        } else {
          const newRetryText = document.createElement('div');
          newRetryText.className = 'codform-retry-text';
          newRetryText.textContent = `جاري إعادة المحاولة (${currentRetry}/${maxRetries})...`;
          loaderEl.appendChild(newRetryText);
        }
      }
    }
    
    // Start first attempt
    attemptFetch();
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

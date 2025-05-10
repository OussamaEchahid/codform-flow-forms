
// CODFORM Form Loader Module
function CODFORMFormLoader(API_BASE_URL) {
  const { renderForm } = CODFORMFormRenderer();
  const { submitForm } = CODFORMFormSubmitter(API_BASE_URL);
  
  // Circuit breaker state with improved settings - not too extreme
  const circuitBreaker = {
    failureCount: 0,
    lastFailureTime: null,
    isOpen: false,
    threshold: 3,  // Allow 3 failures before opening circuit
    resetTimeout: 30000 // 30 seconds reset timeout
  };
  
  // Global state to track forms we've already tried to load
  const attemptedForms = new Map();
  
  // Helper to reset circuit breaker after timeout
  function checkAndResetCircuitBreaker() {
    if (circuitBreaker.isOpen && circuitBreaker.lastFailureTime) {
      const timeElapsed = Date.now() - circuitBreaker.lastFailureTime;
      if (timeElapsed > circuitBreaker.resetTimeout) {
        console.log('CODFORM: Circuit breaker reset after timeout');
        circuitBreaker.isOpen = false;
        circuitBreaker.failureCount = 0;
      }
    }
  }
  
  function loadForm(container, formId, productId) {
    console.log('CODFORM: Loading form', formId);
    
    // Check if we've already tried to load this exact form
    const formKey = `${formId}-${productId || 'noproduct'}`;
    if (attemptedForms.has(formKey)) {
      const attemptCount = attemptedForms.get(formKey);
      if (attemptCount >= 2) { // Allow 2 attempts before showing permanent error
        console.log('CODFORM: Already attempted to load this form multiple times, showing error');
        showError(container, 'تعذر تحميل النموذج. يرجى تحديث الصفحة للمحاولة مرة أخرى.');
        return;
      }
      attemptedForms.set(formKey, attemptCount + 1);
    } else {
      attemptedForms.set(formKey, 1);
    }
    
    // Check and potentially reset circuit breaker
    checkAndResetCircuitBreaker();
    
    // Check if circuit breaker is open
    if (circuitBreaker.isOpen) {
      console.error('CODFORM: Circuit breaker is open. Too many failures recently.');
      showError(container, 'خدمة النماذج غير متاحة حاليًا. يرجى المحاولة لاحقًا.');
      return;
    }
    
    // Double check API base URL is properly set
    if (!API_BASE_URL || API_BASE_URL === 'undefined') {
      console.error('CODFORM: API_BASE_URL is invalid:', API_BASE_URL);
      showError(container, 'خطأ في التكوين: عنوان API غير محدد أو غير صالح');
      return;
    }
    
    // Ensure the API URL is correct and includes the get-form endpoint (new endpoint)
    let apiUrl = API_BASE_URL;
    if (!apiUrl.endsWith('/')) apiUrl += '/';
    apiUrl += 'get-form/' + formId;
    
    console.log('CODFORM: Fetching form from:', apiUrl);
    
    // Show loader while fetching
    showLoader(container);
    hideError(container);
    hideForm(container);
    hideSuccess(container);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const urlWithTimestamp = `${apiUrl}?t=${timestamp}&nocache=true`;
    
    // Timeouts & IDs management
    let timeouts = {
      global: null,
      fetch: null
    };
    
    function clearAllTimeouts() {
      Object.values(timeouts).forEach(id => {
        if (id) clearTimeout(id);
      });
    }
    
    // Set global timeout - 10 seconds (increased from 5)
    timeouts.global = setTimeout(() => {
      console.error('CODFORM: Global timeout reached - cancelling all operations');
      clearAllTimeouts();
      showError(container, 'انتهت مهلة تحميل النموذج. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    }, 10000);
    
    // Generate request ID for tracing
    const requestId = `form_${formId}_req_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`CODFORM [${requestId}]: Starting fetch request`);
    
    // Set fetch timeout - 5 seconds (increased from 3)
    timeouts.fetch = setTimeout(() => {
      console.error(`CODFORM [${requestId}]: Fetch timeout`);
      showError(container, 'انتهت مهلة الاتصال. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    }, 5000);
    
    fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'X-Request-ID': requestId
      },
      mode: 'cors',
      cache: 'no-store'
    })
      .then(response => {
        // Clear fetch timeout
        clearTimeout(timeouts.fetch);
        
        console.log(`CODFORM [${requestId}]: API Response status:`, response.status);
        
        // Check if we got HTML instead of JSON (common with CORS issues)
        const contentType = response.headers.get('Content-Type');
        console.log(`CODFORM [${requestId}]: Content-Type:`, contentType);
        
        if (!response.ok) {
          throw new Error(`فشل تحميل النموذج: ${response.status} - ${response.statusText}`);
        }
        
        if (contentType && contentType.includes('text/html')) {
          console.error(`CODFORM [${requestId}]: Received HTML instead of JSON`);
          throw new Error(`تم استلام HTML بدلاً من JSON. هذا يشير عادة إلى مشكلة في الخادم أو في إعدادات CORS.`);
        }
        
        if (!contentType || !contentType.includes('application/json')) {
          console.error(`CODFORM [${requestId}]: Invalid content type: ${contentType}`);
          throw new Error(`كان من المتوقع استجابة JSON ولكن تم الحصول على ${contentType || 'نوع محتوى غير معروف'}`);
        }
        
        return response.json().catch(err => {
          console.error(`CODFORM [${requestId}]: Error parsing JSON:`, err);
          throw new Error('لا يمكن تحليل استجابة JSON');
        });
      })
      .then(data => {
        console.log(`CODFORM [${requestId}]: Form data received:`, data);
        
        // Reset circuit breaker on successful fetch
        circuitBreaker.failureCount = 0;
        circuitBreaker.isOpen = false;
        
        // Clear all timeouts since we got a successful response
        clearAllTimeouts();
        
        // Enhanced validation of form data
        if (!data) {
          throw new Error('بيانات النموذج غير صالحة: استجابة فارغة');
        }
        
        if (data.error) {
          throw new Error(`خطأ في API: ${data.error}`);
        }
        
        // Check if form is published
        if (data.is_published === false) {
          throw new Error('هذا النموذج غير منشور. الرجاء نشر النموذج قبل تضمينه.');
        }
        
        hideLoader(container);
        renderForm(container, data, productId, submitForm);
        showForm(container);
        
        // Reset attempt counter on success
        attemptedForms.delete(formKey);
      })
      .catch(error => {
        console.error(`CODFORM [${requestId}]: Error loading form:`, error);
        
        // Clear all timeouts
        clearAllTimeouts();
        
        // Update circuit breaker state
        circuitBreaker.failureCount++;
        circuitBreaker.lastFailureTime = Date.now();
        
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
        } else if (error.message.includes('HTML')) {
          errorMessage = 'خطأ في استجابة الخادم: تم استلام HTML بدلاً من JSON. يرجى التحقق من تكوين الخادم.';
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

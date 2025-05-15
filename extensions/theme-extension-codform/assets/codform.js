
// CODFORM - نماذج الدفع عند الاستلام
// نموذج الدفع عند الاستلام - برمجة وتطوير CODFORM

// Use a self-executing function to avoid global scope pollution
(function() {
  // Initialize forms when DOM is loaded
  document.addEventListener('DOMContentLoaded', initializeCodforms);
  
  // Function to initialize all form containers on the page
  function initializeCodforms() {
    // Find all form containers
    const containers = document.querySelectorAll('.codform-container');
    console.log(`CODFORM: Found ${containers.length} containers to initialize`);
    
    containers.forEach(container => {
      const blockId = container.id.split('-').pop();
      const productId = container.getAttribute('data-product-id');
      
      console.log(`CODFORM: Initializing container with blockId: ${blockId}, productId: ${productId}`);
      
      if (!productId) {
        showErrorMessage(blockId, 'لم يتم العثور على معرف المنتج');
        console.error('CODFORM Error: No product ID found for block', blockId);
        return;
      }
      
      // Load form based on product ID
      loadFormByProductId(productId, blockId);
    });
  }
  
  // Function to load a form based on product ID
  function loadFormByProductId(productId, blockId) {
    const formLoader = document.getElementById(`codform-form-loader-${blockId}`);
    const formContainer = document.getElementById(`codform-form-${blockId}`);
    const errorContainer = document.getElementById(`codform-error-${blockId}`);
    
    if (!formLoader || !formContainer || !errorContainer) {
      console.error('CODFORM: Required containers not found for blockId', blockId);
      return;
    }
    
    // Get the shop domain from the current URL
    const shopDomain = window.location.hostname;
    
    // API endpoint to get form for product - use the Supabase edge function URL directly
    const apiUrl = `https://mtyfuwdsshlzqwjujavp.functions.supabase.co/forms-product?shop=${encodeURIComponent(shopDomain)}&productId=${encodeURIComponent(productId)}`;
    
    // Show loader
    formLoader.style.display = 'flex';
    formContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    
    console.log(`CODFORM: Fetching form for product ${productId} from shop ${shopDomain} using URL: ${apiUrl}`);
    
    // Add timestamp to avoid caching issues
    const timestampedUrl = `${apiUrl}&_t=${Date.now()}`;
    
    // Enhanced fetch request with custom headers
    const fetchOptions = {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit', // Don't send cookies
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Shop': shopDomain,
        'Origin': window.location.origin,
        'Cache-Control': 'no-store, no-cache'
      },
      cache: 'no-store'
    };
    
    // Fetch form data with retry logic
    fetchWithRetry(timestampedUrl, 5, fetchOptions)
      .then(response => {
        console.log(`CODFORM: Response status: ${response.status}`);
        if (!response.ok) {
          console.error('CODFORM: Network response error details:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
          });
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('CODFORM: Received data:', data);
        if (data && data.form) {
          // Form data retrieved successfully
          console.log(`CODFORM: Successfully loaded form ID: ${data.form.id}`);
          renderForm(data.form, blockId);
        } else {
          throw new Error('No form data returned from API');
        }
      })
      .catch(error => {
        console.error('CODFORM Error:', error);
        showErrorMessage(blockId, 'فشل تحميل النموذج. يرجى تحديث الصفحة أو الاتصال بالدعم الفني.');
        
        // After error, try to load default form as fallback
        tryLoadDefaultForm(shopDomain, blockId);
      });
  }
  
  // Enhanced fetch with retry logic and diagnostics
  function fetchWithRetry(url, maxRetries, options, retryCount = 0) {
    console.log(`CODFORM: Fetch attempt ${retryCount + 1}/${maxRetries + 1} for ${url}`);
    
    // For each retry, slightly modify the options to try different configurations
    const currentOptions = {...options};
    
    if (retryCount > 0) {
      // Add a cache buster for each retry
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}_retry=${retryCount}_${Date.now()}`;
      
      // Try different variations of headers with each retry
      if (retryCount === 1) {
        // Try removing some headers
        const simpleHeaders = {
          'Accept': 'application/json', 
          'Content-Type': 'application/json'
        };
        currentOptions.headers = simpleHeaders;
      } else if (retryCount === 2) {
        // Try with almost no headers
        currentOptions.headers = {'Accept': 'application/json'};
      } else if (retryCount >= 3) {
        // For desperate attempts, try with no custom headers at all and force no-cors mode
        currentOptions.headers = {};
        if (retryCount === 4) {
          // Last resort: try with a completely different mode
          currentOptions.mode = 'no-cors';
          console.log('CODFORM: Trying no-cors mode as last resort');
        }
      }
    }
    
    console.log('CODFORM: Fetch options:', currentOptions);
    
    return fetch(url, currentOptions)
      .then(response => {
        if (response.ok) {
          console.log(`CODFORM: Successful fetch on attempt ${retryCount + 1}`);
          return response;
        }
        
        // If we've reached max retries, throw error
        if (retryCount >= maxRetries) {
          console.error(`CODFORM: Max retries reached (${maxRetries}) with status ${response.status}`);
          throw new Error(`Max retries reached (${maxRetries}): ${response.status}`);
        }
        
        // Log response for debugging
        console.log(`CODFORM: Fetch attempt ${retryCount + 1} failed:`, {
          status: response.status,
          statusText: response.statusText
        });
        
        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000) + Math.random() * 1000;
        console.log(`CODFORM: Retrying fetch (${retryCount + 1}/${maxRetries}) after ${delay.toFixed(0)}ms`);
        
        // Retry after delay
        return new Promise(resolve => setTimeout(resolve, delay))
          .then(() => fetchWithRetry(url, maxRetries, currentOptions, retryCount + 1));
      })
      .catch(err => {
        // For network errors, also implement retry
        if (retryCount >= maxRetries) {
          console.error('CODFORM: Network error after all retries:', err);
          throw err;
        }
        
        console.log(`CODFORM: Network error (${err.message}), will retry`);
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000) + Math.random() * 1000;
        
        return new Promise(resolve => setTimeout(resolve, delay))
          .then(() => fetchWithRetry(url, maxRetries, currentOptions, retryCount + 1));
      });
  }
  
  // Try to load default form as fallback with enhanced error handling
  function tryLoadDefaultForm(shopDomain, blockId) {
    console.log('CODFORM: Trying to load default form as fallback');
    
    // Show "trying fallback" message
    const errorContainer = document.getElementById(`codform-error-${blockId}`);
    if (errorContainer) {
      const errorText = errorContainer.querySelector('p');
      if (errorText) errorText.innerText = 'جاري محاولة تحميل النموذج الافتراضي...';
      errorContainer.style.display = 'block';
    }
    
    // API endpoint for default form with direct URL
    const defaultFormUrl = `https://mtyfuwdsshlzqwjujavp.functions.supabase.co/forms-default?shop=${encodeURIComponent(shopDomain)}&_t=${Date.now()}`;
    
    // Enhanced fetch options for fallback - use minimal headers
    const fetchOptions = {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit', // Don't send cookies
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    };
    
    fetchWithRetry(defaultFormUrl, 3, fetchOptions)
      .then(response => {
        if (!response.ok) throw new Error(`Default form fetch failed: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data && data.form) {
          console.log('CODFORM: Successfully loaded default form:', data.form.id);
          renderForm(data.form, blockId);
          return;
        }
        throw new Error('No default form available');
      })
      .catch(error => {
        console.error('CODFORM: Failed to load default form:', error);
        
        // If everything fails, create a basic fallback form
        console.log('CODFORM: Creating basic fallback form');
        createFallbackForm(blockId);
      });
  }
  
  // Function to create a very basic form as ultimate fallback
  function createFallbackForm(blockId) {
    const formContainer = document.getElementById(`codform-form-${blockId}`);
    const formLoader = document.getElementById(`codform-form-loader-${blockId}`);
    const errorContainer = document.getElementById(`codform-error-${blockId}`);
    
    if (!formContainer) return;
    
    // Hide loader and error container
    if (formLoader) formLoader.style.display = 'none';
    if (errorContainer) errorContainer.style.display = 'none';
    
    // Basic form HTML 
    const formHTML = `
      <div class="codform-header" style="background-color: #9b87f5;">
        <h3>طلب المنتج</h3>
        <p>يرجى تعبئة النموذج للطلب</p>
      </div>
      <form id="codform-form-elements-${blockId}" class="codform-form-elements" data-form-id="fallback">
        <div class="codform-field">
          <label for="name-${blockId}">
            <span class="codform-required">*</span>
            الاسم الكامل
          </label>
          <input type="text" id="name-${blockId}" name="name" required>
        </div>
        <div class="codform-field">
          <label for="phone-${blockId}">
            <span class="codform-required">*</span>
            رقم الهاتف
          </label>
          <input type="tel" id="phone-${blockId}" name="phone" required>
        </div>
        <div class="codform-field">
          <label for="address-${blockId}">
            <span class="codform-required">*</span>
            العنوان
          </label>
          <textarea id="address-${blockId}" name="address" rows="4" required></textarea>
        </div>
        <div class="codform-field">
          <button type="submit" class="codform-submit-button" style="background-color: #9b87f5;">
            إرسال الطلب
          </button>
        </div>
      </form>
    `;
    
    formContainer.innerHTML = formHTML;
    formContainer.style.display = 'block';
    
    // Add submission handler
    const form = document.getElementById(`codform-form-elements-${blockId}`);
    if (form) {
      form.addEventListener('submit', event => handleFormSubmission(event, blockId));
    }
  }
  
  // Function to render the form
  function renderForm(formData, blockId) {
    const formLoader = document.getElementById(`codform-form-loader-${blockId}`);
    const formContainer = document.getElementById(`codform-form-${blockId}`);
    
    if (!formLoader || !formContainer) {
      console.error('CODFORM: Required containers not found');
      return;
    }
    
    // Hide loader
    formLoader.style.display = 'none';
    
    // Prepare form structure based on formData
    const formId = formData.id;
    const formTitle = formData.title || 'نموذج الدفع عند الاستلام';
    const formDescription = formData.description || '';
    const hideHeader = document.querySelector(`#codform-container-${blockId}`).getAttribute('data-hide-header') === 'true';
    
    // Get form fields
    let formFields = [];
    try {
      // Handle different data structures that might be returned
      if (formData.data && Array.isArray(formData.data)) {
        // If data is an array of steps
        formFields = formData.data[0]?.fields || [];
      } else if (formData.data && formData.data[0] && formData.data[0].fields) {
        // Legacy format
        formFields = formData.data[0].fields;
      } else if (typeof formData.data === 'object') {
        // Direct fields object
        formFields = formData.data.fields || [];
      }
    } catch (e) {
      console.error('CODFORM Error: Failed to parse form fields', e);
      formFields = [];
    }
    
    // If no fields found, create default ones
    if (!formFields || formFields.length === 0) {
      console.warn('CODFORM: No form fields found, using defaults');
      formFields = [
        {
          id: 'name',
          type: 'text',
          label: 'الاسم الكامل',
          required: true,
          placeholder: 'أدخل اسمك الكامل'
        },
        {
          id: 'phone',
          type: 'phone',
          label: 'رقم الهاتف',
          required: true,
          placeholder: 'أدخل رقم هاتفك'
        },
        {
          id: 'address',
          type: 'textarea',
          label: 'العنوان',
          required: true,
          placeholder: 'أدخل عنوانك بالتفصيل'
        },
        {
          id: 'submit',
          type: 'submit',
          label: 'إرسال الطلب'
        }
      ];
    }
    
    // Get form style
    const style = formData.style || {
      primaryColor: '#9b87f5',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      buttonStyle: 'rounded'
    };
    
    // Create form HTML
    let formHTML = '';
    
    // Add header if not hidden
    if (!hideHeader) {
      formHTML += `
        <div class="codform-header" style="background-color: ${style.primaryColor};">
          <h3>${formTitle}</h3>
          <p>${formDescription}</p>
        </div>
      `;
    }
    
    // Add form fields
    formHTML += `<form id="codform-form-elements-${blockId}" class="codform-form-elements" data-form-id="${formId}">`;
    
    // Process form fields
    formFields.forEach(field => {
      // Skip form-title field if hideHeader is true
      if (field.type === 'form-title' && hideHeader) {
        return;
      }
      
      formHTML += renderField(field, style);
    });
    
    // Close form
    formHTML += '</form>';
    
    // Set form HTML
    formContainer.innerHTML = formHTML;
    formContainer.style.display = 'block';
    
    // Add form submission handler
    const form = document.getElementById(`codform-form-elements-${blockId}`);
    if (form) {
      form.addEventListener('submit', event => handleFormSubmission(event, blockId));
    }
    
    // Add event listeners for any special fields
    setupFieldEventListeners(blockId);
  }
  
  // Function to render individual form field
  function renderField(field, style) {
    // Safely check field exists
    if (!field || !field.type) {
      console.error('CODFORM: Invalid field object', field);
      return '';
    }
    
    // Implement field rendering based on field type
    // This is a simplified version - you'll need to expand it
    switch (field.type) {
      case 'form-title':
        return `
          <div class="codform-field">
            <h3 style="color: ${field.style?.color || '#333'};">${field.label}</h3>
            ${field.helpText ? `<p class="codform-help-text">${field.helpText}</p>` : ''}
          </div>
        `;
        
      case 'text':
      case 'email':
      case 'phone':
        return `
          <div class="codform-field">
            <label for="${field.id}">
              ${field.required ? '<span class="codform-required">*</span>' : ''}
              ${field.label}
            </label>
            <input 
              type="${field.type === 'phone' ? 'tel' : field.type}" 
              id="${field.id}" 
              name="${field.id}" 
              placeholder="${field.placeholder || ''}" 
              ${field.required ? 'required' : ''}
            >
            ${field.helpText ? `<p class="codform-help-text">${field.helpText}</p>` : ''}
          </div>
        `;
        
      case 'textarea':
        return `
          <div class="codform-field">
            <label for="${field.id}">
              ${field.required ? '<span class="codform-required">*</span>' : ''}
              ${field.label}
            </label>
            <textarea 
              id="${field.id}" 
              name="${field.id}" 
              placeholder="${field.placeholder || ''}" 
              rows="4"
              ${field.required ? 'required' : ''}
            ></textarea>
            ${field.helpText ? `<p class="codform-help-text">${field.helpText}</p>` : ''}
          </div>
        `;
        
      case 'submit':
        return `
          <div class="codform-field">
            <button 
              type="submit" 
              id="${field.id}" 
              class="codform-submit-button codform-submit-btn"
              style="background-color: ${field.style?.backgroundColor || style.primaryColor};"
            >
              ${field.label || 'إرسال'}
            </button>
          </div>
        `;
        
      // Add other field types as needed
        
      default:
        console.warn('CODFORM: Unknown field type', field.type);
        return '';
    }
  }
  
  // Function to set up event listeners for specific fields
  function setupFieldEventListeners(blockId) {
    // Implement any needed event listeners for special fields
  }
  
  // Function to handle form submission
  function handleFormSubmission(event, blockId) {
    event.preventDefault();
    
    const form = event.target;
    const formId = form.getAttribute('data-form-id');
    const formContainer = document.getElementById(`codform-form-${blockId}`);
    const successContainer = document.getElementById(`codform-success-${blockId}`);
    const errorContainer = document.getElementById(`codform-error-${blockId}`);
    
    if (!formId || !formContainer || !successContainer || !errorContainer) {
      console.error('CODFORM: Required elements not found');
      return;
    }
    
    // Get form data
    const formData = new FormData(form);
    const formDataJson = {};
    
    // Convert FormData to JSON
    formData.forEach((value, key) => {
      formDataJson[key] = value;
    });
    
    // Add product ID and other metadata
    const container = document.getElementById(`codform-container-${blockId}`);
    if (container) {
      formDataJson.productId = container.getAttribute('data-product-id');
      formDataJson.shopDomain = window.location.hostname;
    }
    
    // API endpoint for form submission - use Supabase edge function directly
    const apiUrl = `https://mtyfuwdsshlzqwjujavp.functions.supabase.co/api-submissions?formId=${formId}`;
    
    // Disable form inputs during submission
    const formElements = form.elements;
    for (let i = 0; i < formElements.length; i++) {
      formElements[i].disabled = true;
    }
    
    // Add loading state to submit button
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.classList.add('codform-loading');
      submitButton.innerText = 'جاري الإرسال...';
    }
    
    // Submit form data
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formDataJson)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Show success message
        formContainer.style.display = 'none';
        successContainer.style.display = 'block';
        errorContainer.style.display = 'none';
        
        // Scroll to success message
        successContainer.scrollIntoView({ behavior: 'smooth' });
      })
      .catch(error => {
        console.error('CODFORM Error:', error);
        
        // Re-enable form inputs
        for (let i = 0; i < formElements.length; i++) {
          formElements[i].disabled = false;
        }
        
        // Reset submit button
        if (submitButton) {
          submitButton.classList.remove('codform-loading');
          submitButton.innerText = 'إرسال';
        }
        
        // Show error message
        showErrorMessage(blockId, 'فشل إرسال النموذج. يرجى المحاولة مرة أخرى.');
      });
  }
  
  // Function to show error message with enhanced diagnostics
  function showErrorMessage(blockId, message) {
    const formLoader = document.getElementById(`codform-form-loader-${blockId}`);
    const formContainer = document.getElementById(`codform-form-${blockId}`);
    const errorContainer = document.getElementById(`codform-error-${blockId}`);
    const errorText = errorContainer ? errorContainer.querySelector('p') : null;
    
    if (formLoader) formLoader.style.display = 'none';
    if (formContainer) formContainer.style.display = 'none';
    if (errorContainer) errorContainer.style.display = 'block';
    if (errorText) errorText.innerText = message;
    
    // Diagnostic information - log to console
    console.log('CODFORM Error Diagnostics:', {
      timestamp: new Date().toISOString(),
      shopDomain: window.location.hostname,
      pageUrl: window.location.href,
      blockId: blockId,
      errorMessage: message,
      userAgent: navigator.userAgent
    });
    
    // Add retry button functionality
    const retryButton = document.getElementById(`codform-retry-${blockId}`);
    if (retryButton) {
      // Remove any existing event listeners
      retryButton.replaceWith(retryButton.cloneNode(true));
      
      // Add new event listener
      document.getElementById(`codform-retry-${blockId}`).addEventListener('click', () => {
        // Get the product ID and try loading the form again
        const container = document.getElementById(`codform-container-${blockId}`);
        if (container) {
          const productId = container.getAttribute('data-product-id');
          if (productId) {
            console.log('CODFORM: Retrying form load for product', productId);
            loadFormByProductId(productId, blockId);
          }
        }
      });
    }
  }
})();

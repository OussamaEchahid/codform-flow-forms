
// CODFORM Form Submitter Module
function CODFORMFormSubmitter(API_BASE_URL) {
  let isSubmitting = false; // Flag to prevent duplicate submissions

  function submitForm(container, form, formId) {
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('CODFORM: Submission already in progress, skipping duplicate submission');
      return;
    }
    
    isSubmitting = true;
    console.log('CODFORM: Submitting form', formId);
    
    const formData = new FormData(form);
    const data = {};
    
    // Convert FormData to JSON
    formData.forEach((value, key) => {
      // Handle file uploads
      if (value instanceof File) {
        if (value.size > 0) {
          data[key] = {
            type: 'file',
            name: value.name,
            size: value.size,
            fileType: value.type,
          };
        }
      } else {
        data[key] = value;
      }
    });
    
    console.log('CODFORM: Form data to submit:', data);
    
    // Show loading state
    form.classList.add('codform-loading');
    const submitButton = form.querySelector('.codform-submit-button');
    const originalButtonText = submitButton ? submitButton.textContent : 'إرسال';
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'جاري الإرسال...';
    }
    
    // Make sure we have a valid API URL with fallbacks
    const apiUrl = getAPIUrl(API_BASE_URL, formId);
    
    console.log('CODFORM: Submitting form to:', apiUrl);
    
    // Set timeout to handle network failures
    const timeoutId = setTimeout(() => {
      console.error('CODFORM: Submission timeout');
      handleSubmissionError('Network timeout');
    }, 30000); // 30 second timeout
    
    // Try submission with retry logic
    attemptSubmission(apiUrl, data, formId, 0, 3);
    
    function getAPIUrl(baseUrl, formId) {
      // Priority order: provided API_BASE_URL, current domain, fallback domain
      if (baseUrl && baseUrl.trim() !== '') {
        return `${baseUrl.replace(/\/+$/, '')}/api-submissions`;
      }
      
      // Try to construct URL from current domain
      try {
        const currentDomain = window.location.origin;
        return `${currentDomain}/api/submissions`;
      } catch (e) {
        // Fallback to a relative path
        return '/api/submissions';
      }
    }
    
    function attemptSubmission(url, formData, formId, currentAttempt, maxAttempts) {
      fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        mode: 'cors',
        body: JSON.stringify({
          formId: formId,
          data: formData
        }),
      })
        .then(response => {
          clearTimeout(timeoutId);
          console.log('CODFORM: Submit response status:', response.status);
          
          if (!response.ok) {
            if (currentAttempt < maxAttempts) {
              console.log(`CODFORM: Retrying submission (${currentAttempt + 1}/${maxAttempts})`);
              // Exponential backoff
              setTimeout(() => {
                attemptSubmission(url, formData, formId, currentAttempt + 1, maxAttempts);
              }, Math.pow(2, currentAttempt) * 1000);
              return null;
            }
            throw new Error('Failed to submit form: ' + response.status);
          }
          
          return response.json();
        })
        .then(data => {
          if (!data) return; // Skip if retry is in progress
          
          console.log('CODFORM: Form submitted successfully:', data);
          // Show success message
          hideForm(container);
          showSuccess(container);
          // Reset submission flag
          isSubmitting = false;
        })
        .catch(error => {
          clearTimeout(timeoutId);
          
          if (currentAttempt < maxAttempts) {
            console.log(`CODFORM: Retrying after error (${currentAttempt + 1}/${maxAttempts})`, error);
            // Exponential backoff
            setTimeout(() => {
              attemptSubmission(url, formData, formId, currentAttempt + 1, maxAttempts);
            }, Math.pow(2, currentAttempt) * 1000);
          } else {
            handleSubmissionError(error);
          }
        });
    }
      
    function handleSubmissionError(error) {
      console.error('CODFORM: Error submitting form', error);
      
      // Reset button state
      form.classList.remove('codform-loading');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
      
      // Show error message
      const errorContainer = container.querySelector('.codform-error');
      if (errorContainer) {
        errorContainer.style.display = 'block';
        errorContainer.textContent = 'حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.';
      } else {
        alert('حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.');
      }
      
      // Reset submission flag
      isSubmitting = false;
    }
  }
  
  // Helper functions for showing/hiding elements
  function hideForm(container) {
    const form = container.querySelector('.codform-form');
    if (form) form.style.display = 'none';
  }
  
  function showSuccess(container) {
    const success = container.querySelector('.codform-success');
    if (success) success.style.display = 'block';
  }
  
  return { submitForm };
}

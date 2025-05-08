
// CODFORM Form Submitter Module
function CODFORMFormSubmitter(API_BASE_URL) {
  function submitForm(container, form, formId) {
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
    
    // Make sure we have a valid API URL
    const apiUrl = API_BASE_URL ? (API_BASE_URL + '/api-submissions') : '/api/submissions';
    
    console.log('CODFORM: Submitting form to:', apiUrl);
    
    // Set timeout to handle network failures
    const timeoutId = setTimeout(() => {
      console.error('CODFORM: Submission timeout');
      handleSubmissionError('Network timeout');
    }, 30000); // 30 second timeout
    
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({
        formId: formId,
        data: data
      }),
    })
      .then(response => {
        clearTimeout(timeoutId);
        console.log('CODFORM: Submit response status:', response.status);
        if (!response.ok) {
          throw new Error('Failed to submit form: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log('CODFORM: Form submitted successfully:', data);
        // Show success message
        hideForm(container);
        showSuccess(container);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        handleSubmissionError(error);
      });
      
    function handleSubmissionError(error) {
      console.error('CODFORM: Error submitting form', error);
      
      // Reset button state
      form.classList.remove('codform-loading');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
      
      // Show error message
      alert('حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.');
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

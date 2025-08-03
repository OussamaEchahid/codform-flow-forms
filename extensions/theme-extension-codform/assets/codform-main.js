/* 
 * CODFORM Main Script - Moved from Liquid Template
 * Contains all the main JavaScript functionality
 */

(function() {
  'use strict';
  
  const API_BASE_URL = 'https://lovable-forms-api.netlify.app/.netlify/functions/api-forms';
  const DEFAULT_PRODUCT_ID = 'default';

  // Main form rendering function
  window.renderCodform = function(productId, shopDomain) {
    fetchFormData(productId, shopDomain);
  };

  // Form data fetching
  function fetchFormData(productId, shopDomain) {
    const apiUrl = `${API_BASE_URL}/${productId}`;
    
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shop-Domain': shopDomain
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.steps && data.steps.length > 0) {
        renderForm(data);
      } else {
        showDefaultMessage();
      }
    })
    .catch(error => {
      console.error('Error fetching form data:', error);
      showDefaultMessage();
    });
  }

  // Main form rendering
  function renderForm(formData) {
    const previewContainer = document.querySelector('[data-form-preview-id="form-preview-stable"]');
    if (!previewContainer) return;

    const formStyle = formData.formStyle || {};
    const formLanguage = formData.language || 'en';
    
    let formHtml = '<div class="codform-container">';
    
    if (formData.steps && formData.steps.length > 0) {
      formData.steps.forEach(step => {
        if (step.fields && step.fields.length > 0) {
          step.fields.forEach(field => {
            formHtml += window.renderField(field, formStyle, formLanguage);
          });
        }
      });
    }
    
    formHtml += '</div>';
    previewContainer.innerHTML = formHtml;
    
    // Initialize form functionality
    initializeFormFeatures();
  }

  // Initialize form features
  function initializeFormFeatures() {
    // Initialize WhatsApp buttons
    if (typeof initializeWhatsAppButtons === 'function') {
      initializeWhatsAppButtons();
    }
    
    // Initialize countdown timers
    if (typeof initializeCountdownTimers === 'function') {
      initializeCountdownTimers();
    }
    
    // Initialize cart summary
    if (typeof initializeCartSummary === 'function') {
      initializeCartSummary();
    }
    
    // Initialize quantity offers
    if (typeof initializeQuantityOffers === 'function') {
      initializeQuantityOffers();
    }
  }

  // Default message when no form found
  function showDefaultMessage() {
    const previewContainer = document.querySelector('[data-form-preview-id="form-preview-stable"]');
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div style="
          text-align: center;
          padding: 40px 20px;
          font-family: Cairo, Arial, sans-serif;
          background: #f9fafb;
          border-radius: 12px;
          border: 2px dashed #d1d5db;
          margin: 20px 0;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
          <h3 style="color: #374151; margin: 0 0 8px 0; font-size: 18px;">لم يتم العثور على نموذج</h3>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">يرجى إنشاء نموذج جديد أو التحقق من معرف المنتج</p>
        </div>
      `;
    }
  }

})();

/**
 * CODFORM - Main Form Loader System
 * نظام تحميل النماذج الرئيسي
 * 
 * This system automatically detects products and loads associated forms
 * without requiring manual form ID input
 */

window.CodformLoader = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_BASE_URL: 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    FORM_CHECK_INTERVAL: 100,
    MAX_WAIT_TIME: 10000
  };

  // State management
  let isInitialized = false;
  const loadedForms = new Set();
  const loadingForms = new Set();

  // Utility functions
  const log = (message, data = null) => {
    console.log(`📋 CODFORM: ${message}`, data || '');
  };

  const error = (message, data = null) => {
    console.error(`❌ CODFORM: ${message}`, data || '');
  };

  const success = (message, data = null) => {
    console.log(`✅ CODFORM: ${message}`, data || '');
  };

  // Product detection utilities
  const ProductDetector = {
    getProductFromContainer: function(container) {
      return {
        id: container.dataset.productId || 
            document.querySelector('[data-product-id]')?.dataset.productId,
        title: container.dataset.productTitle || 
               document.querySelector('[data-product-title]')?.dataset.productTitle,
        price: container.dataset.productPrice || 
               document.querySelector('[data-product-price]')?.dataset.productPrice,
        currency: container.dataset.productCurrency || 
                  document.querySelector('[data-product-currency]')?.dataset.productCurrency,
        image: container.dataset.productImage || 
               document.querySelector('[data-product-image]')?.dataset.productImage
      };
    },

    getShopDomain: function(container) {
      return container.dataset.shop || 
             window.Shopify?.shop?.domain || 
             window.location.hostname;
    },

    detectProductHandle: function() {
      // Try to get product handle from URL
      const path = window.location.pathname;
      const matches = path.match(/\/products\/([^\/\?]+)/);
      return matches ? matches[1] : null;
    }
  };

  // API Manager
  const ApiManager = {
    fetchFormData: async function(shop, productId, blockId) {
      const cacheKey = `${shop}-${productId}-${blockId}`;
      
      if (loadedForms.has(cacheKey)) {
        log('Form already loaded, skipping');
        return { success: false, message: 'Already loaded' };
      }

      if (loadingForms.has(cacheKey)) {
        log('Form is currently loading, skipping');
        return { success: false, message: 'Loading in progress' };
      }

      loadingForms.add(cacheKey);

      try {
        log(`Loading form for product: ${productId}, shop: ${shop}`);
        
        // Try with product ID first
        let apiUrl = `${CONFIG.API_BASE_URL}/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productId)}&blockId=${encodeURIComponent(blockId)}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // If product ID fails, try with product handle
          const productHandle = ProductDetector.detectProductHandle();
          if (productHandle && productHandle !== productId) {
            apiUrl = `${CONFIG.API_BASE_URL}/forms-product?shop=${encodeURIComponent(shop)}&product=${encodeURIComponent(productHandle)}&blockId=${encodeURIComponent(blockId)}`;
            const handleResponse = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            if (!handleResponse.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const handleData = await handleResponse.json();
            if (handleData.success) {
              loadedForms.add(cacheKey);
              success('Form loaded successfully using product handle');
              return { success: true, data: handleData };
            }
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          loadedForms.add(cacheKey);
          success('Form loaded successfully');
          return { success: true, data };
        } else {
          log('No form found for this product');
          return { success: false, message: 'No form found' };
        }
        
      } catch (error) {
        error('Failed to load form:', error.message);
        return { success: false, error: error.message };
      } finally {
        loadingForms.delete(cacheKey);
      }
    }
  };

  // Form Renderer
  const FormRenderer = {
    renderForm: function(container, formData) {
      try {
        const { form, product, quantity_offers } = formData;
        
        log('Rendering form:', {
          formId: form.id,
          title: form.title,
          hasOffers: !!quantity_offers
        });

        // Clear loading state
        container.innerHTML = '';

        // Create form structure
        const formHTML = this.buildFormHTML(form, product, quantity_offers);
        container.innerHTML = formHTML;

        // Initialize form functionality
        this.initializeFormInteractions(container, form, product);

        // Load quantity offers if available
        if (quantity_offers && window.CodformQuantityOffers) {
          const blockId = container.closest('[data-block-id]')?.dataset.blockId;
          if (blockId) {
            setTimeout(() => {
              this.renderQuantityOffers(blockId, quantity_offers, product);
            }, 100);
          }
        }

        success('Form rendered successfully');
        return true;
      } catch (error) {
        error('Error rendering form:', error.message);
        return false;
      }
    },

    buildFormHTML: function(form, product, quantityOffers) {
      let html = '<div class="codform-form-content">';
      
      // Add form title if available
      if (form.title) {
        html += `<h3 class="codform-form-title" style="margin-bottom: 20px; font-size: 1.5rem; font-weight: 600; color: ${form.style?.primaryColor || '#333'};">${form.title}</h3>`;
      }

      // Add form fields
      if (form.data && form.data.length > 0) {
        form.data.forEach(step => {
          if (step.fields && step.fields.length > 0) {
            step.fields.forEach(field => {
              html += this.buildFieldHTML(field, form.style || {});
            });
          }
        });
      }

      html += '</div>';
      return html;
    },

    buildFieldHTML: function(field, style) {
      const primaryColor = style.primaryColor || '#007bff';
      const textColor = style.textColor || '#333';
      
      switch (field.type) {
        case 'text':
          return `
            <div class="codform-field" style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; color: ${textColor}; font-weight: 500;">${field.label || field.placeholder}</label>
              <input 
                type="text" 
                name="${field.id}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
                style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s;"
                onfocus="this.style.borderColor='${primaryColor}'"
                onblur="this.style.borderColor='#ddd'"
              />
            </div>
          `;
        
        case 'phone':
          return `
            <div class="codform-field" style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; color: ${textColor}; font-weight: 500;">${field.label || 'رقم الهاتف'}</label>
              <input 
                type="tel" 
                name="${field.id}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
                style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s;"
                onfocus="this.style.borderColor='${primaryColor}'"
                onblur="this.style.borderColor='#ddd'"
              />
            </div>
          `;
        
        case 'textarea':
          return `
            <div class="codform-field" style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; color: ${textColor}; font-weight: 500;">${field.label || field.placeholder}</label>
              <textarea 
                name="${field.id}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
                rows="4"
                style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; resize: vertical; transition: border-color 0.3s;"
                onfocus="this.style.borderColor='${primaryColor}'"
                onblur="this.style.borderColor='#ddd'"
              ></textarea>
            </div>
          `;
        
        case 'submit':
          return `
            <div class="codform-field" style="margin-top: 1.5rem;">
              <button 
                type="submit"
                class="codform-submit-btn"
                style="width: 100%; padding: 1rem; background-color: ${primaryColor}; color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s;"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
              >
                ${field.label || 'إرسال الطلب'}
              </button>
            </div>
          `;
        
        default:
          return '';
      }
    },

    initializeFormInteractions: function(container, form, product) {
      const formElement = container.querySelector('.codform-form-content');
      if (!formElement) return;

      // Add form submission handling
      const submitBtn = formElement.querySelector('.codform-submit-btn');
      if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleFormSubmission(container, form, product);
        });
      }
    },

    handleFormSubmission: function(container, form, product) {
      log('Form submitted', { formId: form.id, productId: product.id });
      
      // Collect form data
      const formData = {};
      const inputs = container.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (input.name) {
          formData[input.name] = input.value;
        }
      });

      // Trigger custom event
      window.dispatchEvent(new CustomEvent('codform:submitted', {
        detail: { formData, form, product }
      }));

      // Show success message
      this.showSuccessMessage(container);
    },

    showSuccessMessage: function(container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
          <h3 style="color: #0ea5e9; margin-bottom: 0.5rem;">تم إرسال طلبك بنجاح!</h3>
          <p style="color: #64748b;">سيتم التواصل معك قريباً لتأكيد الطلب</p>
        </div>
      `;
    },

    renderQuantityOffers: function(blockId, quantityOffers, product) {
      if (!window.CodformQuantityOffers) {
        error('CodformQuantityOffers not available');
        return;
      }

      try {
        const position = quantityOffers.position || 'inside_form';
        const containerId = `quantity-offers-${position}-${blockId}`;
        const container = document.getElementById(containerId);
        
        if (!container) {
          error(`Quantity offers container not found: ${containerId}`);
          return;
        }

        // Use the quantity offers display system
        window.CodformQuantityOffers.display({ quantity_offers: quantityOffers, product }, blockId);
        
        success(`Quantity offers rendered at position: ${position}`);
      } catch (error) {
        error('Error rendering quantity offers:', error.message);
      }
    }
  };

  // Main controller
  const FormController = {
    load: async function(container, formData) {
      try {
        const { blockId, productId, shop } = formData;
        
        if (!productId || !shop) {
          error('Missing required data: productId or shop');
          this.showErrorMessage(container, 'بيانات المنتج أو المتجر مفقودة');
          return false;
        }

        log('Loading form', { blockId, productId, shop });

        // Show loading state
        this.showLoadingState(container);

        // Fetch form data from API
        const result = await ApiManager.fetchFormData(shop, productId, blockId);
        
        if (result.success && result.data) {
          return FormRenderer.renderForm(container, result.data);
        } else {
          this.showErrorMessage(container, result.message || 'لم يتم العثور على نموذج مرتبط بهذا المنتج');
          return false;
        }
      } catch (error) {
        error('Error loading form:', error.message);
        this.showErrorMessage(container, 'حدث خطأ في تحميل النموذج');
        return false;
      }
    },

    showLoadingState: function(container) {
      container.innerHTML = `
        <div class="codform-loading" style="
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #666;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 16px;
        ">
          <span style="margin-right: 10px;">جاري تحميل النموذج...</span>
          <div style="
            width: 20px;
            height: 20px;
            border: 2px solid #ddd;
            border-top: 2px solid #666;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
        </div>
      `;
    },

    showErrorMessage: function(container, message) {
      container.innerHTML = `
        <div class="codform-error" style="
          padding: 20px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
          <p style="margin: 0; font-size: 16px; font-weight: 600;">${message}</p>
        </div>
      `;
    },

    initialize: function() {
      if (isInitialized) return;
      
      log('Initializing form loader system');
      
      // Auto-detect and load forms
      this.autoDetectForms();
      
      isInitialized = true;
    },

    autoDetectForms: function() {
      // Look for form containers on page load
      const containers = document.querySelectorAll('.codform-form, [data-product-id]');
      
      containers.forEach(container => {
        const product = ProductDetector.getProductFromContainer(container);
        const shop = ProductDetector.getShopDomain(container);
        const blockId = container.dataset.blockId || container.closest('[data-block-id]')?.dataset.blockId;
        
        if (product.id && shop && blockId) {
          this.load(container, {
            blockId,
            productId: product.id,
            shop,
            productData: product
          });
        }
      });
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      FormController.initialize();
    });
  } else {
    FormController.initialize();
  }

  // Public API
  return {
    load: FormController.load,
    reset: function() {
      loadedForms.clear();
      loadingForms.clear();
      log('Form loader reset completed');
    }
  };
})();

// CSS for loading animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

success('Form loader system initialized successfully');

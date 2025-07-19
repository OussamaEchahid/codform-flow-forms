
// CODFORM JS - FIXED VERSION - SIMPLE AND RELIABLE
(function() {
  'use strict';
  
  console.log("🚀 Codform JS loading...");
  
  // Main function to render form - SIMPLE VERSION
  function renderCodform(formData, containerId) {
    console.log("🎯 renderCodform called", { formData, containerId });
    
    try {
      // Get container element
      const container = document.getElementById(containerId);
      if (!container) {
        console.error("❌ Container not found:", containerId);
        return false;
      }
      
      // Validate form data
      if (!formData || !formData.data) {
        console.error("❌ Invalid form data:", formData);
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666; border: 1px solid #ddd; border-radius: 8px;">خطأ في تحميل النموذج - البيانات غير صحيحة</div>';
        return false;
      }
      
      console.log("✅ Form data is valid, starting render");
      
      // Clear container
      container.innerHTML = "";
      
      // Get form style with safe defaults - FIXED FONT SIZE LOGIC
      const style = formData.style || {};
      const primaryColor = style.primaryColor || "#9b87f5";
      const backgroundColor = style.backgroundColor || "#F9FAFB";
      const borderRadius = style.borderRadius || "8px";
      
      // UNIFIED FONT SIZE LOGIC - This fixes the main issue
      let formFontSize = style.fontSize || "16px";
      // تحويل rem إلى px إذا لزم الأمر
      if (formFontSize.includes('rem')) {
        formFontSize = (parseFloat(formFontSize) * 16) + 'px';
      }
      const defaultFontSize = formFontSize;
      console.log("📏 Using unified font size:", defaultFontSize);
      
      const formDirection = style.formDirection || "ltr";
      
      // Apply container styles
      container.style.cssText = `
        background-color: ${backgroundColor};
        border-radius: ${borderRadius};
        font-size: ${defaultFontSize};
        direction: ${formDirection};
        padding: 20px;
        font-family: system-ui, Arial, sans-serif;
        max-width: 100%;
        box-sizing: border-box;
        border: 1px solid #e5e7eb;
      `;
      
      // Extract all fields from data structure
      let allFields = [];
      if (Array.isArray(formData.data)) {
        formData.data.forEach(step => {
          if (step && step.fields && Array.isArray(step.fields)) {
            allFields = allFields.concat(step.fields);
          }
        });
      }
      
      console.log(`📝 Processing ${allFields.length} fields`);
      
      if (allFields.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">لا توجد حقول في النموذج</div>';
        return false;
      }
      
      // Create form element
      const form = document.createElement("form");
      form.style.cssText = "width: 100%; display: flex; flex-direction: column; gap: 16px;";
      
      // Render each field with unified font size
      allFields.forEach((field, index) => {
        if (!field || !field.type) {
          console.warn("⚠️ Invalid field at index", index, field);
          return;
        }
        
        console.log(`🔧 Rendering field ${index + 1}: ${field.type}`);
        
        const fieldElement = createFieldElement(field, formDirection, primaryColor, defaultFontSize);
        if (fieldElement) {
          form.appendChild(fieldElement);
        }
      });
      
      container.appendChild(form);
      console.log("✅ Form rendered successfully");
      return true;
      
    } catch (error) {
      console.error("❌ Error in renderCodform:", error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff0000; border: 1px solid #ff0000; border-radius: 8px;">حدث خطأ في عرض النموذج: ' + error.message + '</div>';
      }
      return false;
    }
  }
  
  // Helper function to create field elements - UPDATED WITH UNIFIED FONT SIZE
  function createFieldElement(field, direction, primaryColor, defaultFontSize) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "margin-bottom: 16px; width: 100%;";
    
    switch (field.type) {
      case "form-title":
        return createFormTitle(field, direction, defaultFontSize);
        
      case "text":
      case "email":
      case "phone":
        return createTextInput(field, direction, defaultFontSize);
        
      case "textarea":
        return createTextarea(field, direction, defaultFontSize);
        
      case "submit":
        return createSubmitButton(field, primaryColor, defaultFontSize);
        
      case "text/html":
        return createHtmlContent(field);
        
      default:
        console.warn("⚠️ Unknown field type:", field.type);
        const genericDiv = document.createElement("div");
        genericDiv.textContent = field.label || `حقل من نوع ${field.type}`;
        genericDiv.style.cssText = "padding: 10px; background: #f0f0f0; border-radius: 4px; margin-bottom: 16px;";
        return genericDiv;
    }
  }
  
  // Create form title
  function createFormTitle(field, direction, defaultFontSize) {
    const titleText = field.content || field.label || "";
    if (!titleText) return null;
    
    const titleElement = document.createElement("div");
    
    // Get styling from field with safe defaults
    const fieldStyle = field.style || {};
    const textColor = fieldStyle.color || "#000000";
    const fontSize = fieldStyle.fontSize || "1.5rem";
    const fontWeight = fieldStyle.fontWeight || "600";
    const textAlign = fieldStyle.textAlign || "center";
    
    titleElement.style.cssText = `
      color: ${textColor};
      font-size: ${fontSize};
      font-weight: ${fontWeight};
      text-align: ${textAlign};
      margin: 0 0 1.5rem 0;
      line-height: 1.4;
      direction: ${direction};
      background: transparent;
      border: none;
      padding: 12px 0;
      width: 100%;
      display: block;
    `;
    
    titleElement.textContent = titleText;
    return titleElement;
  }
  
  // Create text input - UNIFIED FONT SIZE FOR LABEL AND INPUT
  function createTextInput(field, direction, defaultFontSize) {
    const wrapper = document.createElement("div");
    wrapper.className = "codform-field";
    wrapper.style.cssText = "margin-bottom: 16px; width: 100%;";
    
    // UNIFIED FONT SIZE LOGIC - field font size OR default font size
    const fieldStyle = field.style || {};
    // تحويل rem إلى px إذا لزم الأمر
    let fieldFontSize = fieldStyle.fontSize || defaultFontSize;
    if (fieldFontSize.includes('rem')) {
      fieldFontSize = (parseFloat(fieldFontSize) * 16) + 'px';
    }
    const unifiedFontSize = fieldFontSize;
    const labelColor = fieldStyle.labelColor || "#374151";
    const labelFontWeight = fieldStyle.labelFontWeight || "600";
    
    console.log(`📏 Field ${field.label}: using font size ${unifiedFontSize}`);
    
    // Create label if field has label - SAME FONT SIZE AS INPUT
    if (field.label) {
      const label = document.createElement("label");
      label.textContent = field.label;
      label.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: ${labelFontWeight};
        color: ${labelColor};
        font-size: ${unifiedFontSize};
        font-family: inherit;
        direction: ${direction};
      `;
      wrapper.appendChild(label);
    }
    
    const input = document.createElement("input");
    
    // Set input type
    if (field.type === "email") {
      input.type = "email";
    } else if (field.type === "phone") {
      input.type = "tel";
    } else {
      input.type = "text";
    }
    
    input.placeholder = field.placeholder || field.label || "";
    input.required = field.required || false;
    
    // Set input name for form data collection
    input.name = field.label || field.placeholder || `field_${Date.now()}`;
    
    // INPUT USES THE SAME UNIFIED FONT SIZE
    input.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: ${unifiedFontSize};
      font-family: inherit;
      direction: ${direction};
      box-sizing: border-box;
    `;
    
    wrapper.appendChild(input);
    return wrapper;
  }
  
  // Create textarea - UNIFIED FONT SIZE FOR LABEL AND TEXTAREA
  function createTextarea(field, direction, defaultFontSize) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "margin-bottom: 16px; width: 100%;";
    
    // UNIFIED FONT SIZE LOGIC
    const fieldStyle = field.style || {};
    // تحويل rem إلى px إذا لزم الأمر
    let fieldFontSize = fieldStyle.fontSize || defaultFontSize;
    if (fieldFontSize.includes('rem')) {
      fieldFontSize = (parseFloat(fieldFontSize) * 16) + 'px';
    }
    const unifiedFontSize = fieldFontSize;
    const labelColor = fieldStyle.labelColor || "#374151";
    const labelFontWeight = fieldStyle.labelFontWeight || "600";
    
    // Create label if field has label - SAME FONT SIZE AS TEXTAREA
    if (field.label) {
      const label = document.createElement("label");
      label.textContent = field.label;
      label.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: ${labelFontWeight};
        color: ${labelColor};
        font-size: ${unifiedFontSize};
        font-family: inherit;
        direction: ${direction};
      `;
      wrapper.appendChild(label);
    }
    
    const textarea = document.createElement("textarea");
    textarea.placeholder = field.placeholder || field.label || "";
    textarea.required = field.required || false;
    textarea.rows = 4;
    
    // Set textarea name for form data collection
    textarea.name = field.label || field.placeholder || `field_${Date.now()}`;
    
    // TEXTAREA USES THE SAME UNIFIED FONT SIZE
    textarea.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: ${unifiedFontSize};
      font-family: inherit;
      direction: ${direction};
      resize: vertical;
      box-sizing: border-box;
    `;
    
    wrapper.appendChild(textarea);
    return wrapper;
  }
  
  // Create submit button with form submission handling
  function createSubmitButton(field, primaryColor, defaultFontSize) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "margin-bottom: 16px; width: 100%;";
    
    const button = document.createElement("button");
    button.type = "submit";
    button.textContent = field.label || "إرسال";
    
    const fieldStyle = field.style || {};
    const buttonBg = fieldStyle.backgroundColor || primaryColor;
    const buttonColor = fieldStyle.color || "#ffffff";
    const buttonFontSize = fieldStyle.fontSize || defaultFontSize;
    
    button.style.cssText = `
      background-color: ${buttonBg};
      color: ${buttonColor};
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: ${buttonFontSize};
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: opacity 0.2s;
      box-sizing: border-box;
    `;
    
    button.addEventListener('mouseenter', () => button.style.opacity = '0.9');
    button.addEventListener('mouseleave', () => button.style.opacity = '1');
    
    // Add form submission handler
    button.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('🚀 Form submission started...');
      
      // Disable button during submission
      button.disabled = true;
      button.textContent = 'جاري الإرسال...';
      
      try {
        // Collect form data
        const form = button.closest('form');
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
          data[key] = value;
        }
        
        // Get all input elements and collect their values
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          if (input.name || input.placeholder) {
            const key = input.name || input.placeholder;
            data[key] = input.value;
          }
        });
        
        // Get form ID from URL, form attributes, or use a default
        const urlParams = new URLSearchParams(window.location.search);
        let formId = urlParams.get('form_id') || form.dataset.formId;
        
        // If no form ID found, try to get it from window/global variables or use default
        if (!formId) {
          formId = window.codformId || window.CODFORM_FORM_ID || 'default-form';
          console.log('🔧 استخدام معرف النموذج الافتراضي:', formId);
        }
        
        console.log('📋 Form data collected:', data);
        console.log('🆔 Using form ID:', formId);
        
        // Submit data
        console.log('🌐 Sending request to API...');
        const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-submissions?formId=${formId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
          },
          body: JSON.stringify({
            formData: data,
            shopDomain: window.location.hostname
          })
        });
        
        const result = await response.json();
        console.log('📝 Response received:', result);
        
        if (result.success) {
          // Show success message
          button.textContent = 'تم الإرسال بنجاح!';
          button.style.backgroundColor = '#10b981';
          
          // Redirect to thank you page after 2 seconds
          setTimeout(() => {
            window.location.href = result.redirect || '/thank-you';
          }, 2000);
        } else {
          throw new Error(result.error || 'حدث خطأ أثناء الإرسال');
        }
        
      } catch (error) {
        console.error('❌ Form submission error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        button.textContent = 'حدث خطأ - أعد المحاولة';
        button.style.backgroundColor = '#ef4444';
        button.disabled = false;
        
        // Reset button after 3 seconds
        setTimeout(() => {
          button.textContent = field.label || "إرسال";
          button.style.backgroundColor = buttonBg;
        }, 3000);
      }
    });
    
    wrapper.appendChild(button);
    return wrapper;
  }
  
  // Create HTML content
  function createHtmlContent(field) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "margin-bottom: 16px; width: 100%;";
    wrapper.innerHTML = field.content || "<p>محتوى HTML</p>";
    return wrapper;
  }
  
  // Expose function globally with multiple methods to ensure it works
  if (typeof window !== 'undefined') {
    window.renderCodform = renderCodform;
    
    // Also expose it directly on window for extra safety
    Object.defineProperty(window, 'renderCodform', {
      value: renderCodform,
      writable: false,
      configurable: false
    });
  }
  
  // Also add to global scope
  if (typeof globalThis !== 'undefined') {
    globalThis.renderCodform = renderCodform;
  }
  
  console.log("✅ renderCodform function exposed globally:", typeof window?.renderCodform);
  console.log("🎯 Codform JS loaded successfully");
  
  // ========= SHOPIFY FORM INTEGRATION =========
  // This section handles existing forms in Shopify pages
  console.log("🔍 Setting up Shopify form integration...");
  
  // Function to setup form submission for existing buttons
  function setupShopifyFormSubmission() {
    console.log("🎯 Looking for existing submit buttons...");
    
    // Find all potential submit buttons on the page
    const allButtons = document.querySelectorAll(`
      button[type="submit"],
      input[type="submit"],
      button:not([type]),
      .btn,
      .button,
      [class*="submit"],
      [class*="order"],
      [class*="checkout"]
    `.replace(/\s+/g, ''));
    
    console.log(`🔍 Found ${allButtons.length} potential buttons`);
    
    // Filter buttons that likely are submit/order buttons
    const submitButtons = Array.from(allButtons).filter(btn => {
      const text = (btn.textContent || btn.value || '').toLowerCase().trim();
      const className = btn.className.toLowerCase();
      
      // Check for submit-related text in Arabic and English
      const hasSubmitText = text.includes('submit') || text.includes('order') || 
                           text.includes('add to cart') || text.includes('buy') ||
                           text.includes('إرسال') || text.includes('طلب') ||
                           text.includes('شراء') || text.includes('اطلب');
      
      // Check for submit-related classes
      const hasSubmitClass = className.includes('submit') || className.includes('order') ||
                             className.includes('checkout') || className.includes('btn-primary');
      
      return hasSubmitText || hasSubmitClass || btn.type === 'submit';
    });
    
    console.log(`🎯 Found ${submitButtons.length} submit buttons:`, submitButtons.map(btn => ({
      text: btn.textContent?.trim(),
      type: btn.type,
      className: btn.className
    })));
    
    // Setup each submit button
    submitButtons.forEach((button, index) => {
      console.log(`🔧 Setting up submit button ${index + 1}:`, {
        text: button.textContent?.trim(),
        type: button.type,
        tag: button.tagName
      });
      
      setupShopifyButtonHandler(button);
    });
    
    return submitButtons.length;
  }
  
  // Function to setup individual button handler
  function setupShopifyButtonHandler(button) {
    // Check if already has our handler
    if (button.dataset.codformHandled) {
      console.log("⚠️ Button already has handler, skipping");
      return;
    }
    
    // Mark as handled
    button.dataset.codformHandled = 'true';
    
    // Store original click handler
    const originalOnClick = button.onclick;
    
    // Add our click handler
    button.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🚀 Shopify form submission started...');
      
      // Store original button state
      const originalText = button.textContent || button.value;
      const originalDisabled = button.disabled;
      const originalBg = button.style.backgroundColor;
      
      // Disable button during submission
      button.disabled = true;
      if (button.textContent) {
        button.textContent = 'جاري الإرسال...';
      } else if (button.value) {
        button.value = 'جاري الإرسال...';
      }
      
      try {
        // Find the form this button belongs to
        const form = button.closest('form') || document.querySelector('form') || button.parentElement;
        
        console.log('📝 Found form:', form ? 'Yes' : 'No');
        
        // Collect form data
        const data = {};
        
        if (form) {
          // Get data from form inputs
          const inputs = form.querySelectorAll('input, textarea, select');
          console.log(`📋 Found ${inputs.length} form inputs`);
          
          inputs.forEach(input => {
            if (input.name && input.value) {
              data[input.name] = input.value;
            } else if (input.placeholder && input.value) {
              data[input.placeholder] = input.value;
            } else if (input.id && input.value) {
              data[input.id] = input.value;
            }
            
            console.log(`📝 Input: ${input.name || input.placeholder || input.id} = ${input.value}`);
          });
        } else {
          // If no form found, try to get inputs from the page
          const pageInputs = document.querySelectorAll('input, textarea, select');
          console.log(`📋 No form found, checking ${pageInputs.length} page inputs`);
          
          pageInputs.forEach(input => {
            if (input.value && input.value.trim()) {
              const key = input.name || input.placeholder || input.id || input.type;
              data[key] = input.value;
              console.log(`📝 Page input: ${key} = ${input.value}`);
            }
          });
        }
        
        // Get form ID from various sources
        const urlParams = new URLSearchParams(window.location.search);
        let formId = urlParams.get('form_id') || 
                    form?.dataset?.formId || 
                    button.dataset.formId ||
                    window.codformId || 
                    window.CODFORM_FORM_ID || 
                    'shopify-form';
        
        console.log('🆔 Using form ID:', formId);
        console.log('📋 Collected data:', data);
        
        // Add shop domain and product info
        const submissionData = {
          formData: data,
          shopDomain: window.location.hostname,
          productUrl: window.location.href,
          timestamp: new Date().toISOString()
        };
        
        console.log('🌐 Sending request to API...');
        
        // Submit to our API
        const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-submissions?formId=${formId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
          },
          body: JSON.stringify(submissionData)
        });
        
        const result = await response.json();
        console.log('📝 API Response:', result);
        
        if (result.success) {
          // Show success message
          if (button.textContent) {
            button.textContent = 'تم الإرسال بنجاح!';
          } else if (button.value) {
            button.value = 'تم الإرسال بنجاح!';
          }
          button.style.backgroundColor = '#10b981';
          
          // Redirect to thank you page
          setTimeout(() => {
            const thankYouUrl = result.redirect || '/pages/thank-you' || '#';
            console.log('🔄 Redirecting to:', thankYouUrl);
            window.location.href = thankYouUrl;
          }, 1500);
          
        } else {
          throw new Error(result.error || 'فشل في الإرسال');
        }
        
      } catch (error) {
        console.error('❌ Form submission error:', error);
        
        // Show error state
        if (button.textContent) {
          button.textContent = 'حدث خطأ - أعد المحاولة';
        } else if (button.value) {
          button.value = 'حدث خطأ - أعد المحاولة';
        }
        button.style.backgroundColor = '#ef4444';
        
        // Reset button after 3 seconds
        setTimeout(() => {
          if (button.textContent) {
            button.textContent = originalText;
          } else if (button.value) {
            button.value = originalText;
          }
          button.style.backgroundColor = originalBg;
          button.disabled = originalDisabled;
        }, 3000);
      }
    });
    
    console.log('✅ Handler attached to button');
  }
  
  // Initialize Shopify integration when page loads
  function initializeShopifyIntegration() {
    console.log('🎯 Initializing Shopify integration...');
    
    const setupCount = setupShopifyFormSubmission();
    console.log(`✅ Shopify integration setup complete. Found ${setupCount} submit buttons.`);
    
    // Also setup a mutation observer to catch dynamically added buttons
    const observer = new MutationObserver((mutations) => {
      let shouldRecheck = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const hasButtons = node.querySelectorAll && node.querySelectorAll('button, input[type="submit"]').length > 0;
              if (hasButtons || node.tagName === 'BUTTON' || (node.tagName === 'INPUT' && node.type === 'submit')) {
                shouldRecheck = true;
              }
            }
          });
        }
      });
      
      if (shouldRecheck) {
        console.log('🔄 New buttons detected, re-scanning...');
        setTimeout(setupShopifyFormSubmission, 500);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Run integration immediately and after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeShopifyIntegration);
  } else {
    initializeShopifyIntegration();
  }
  
  // Also try again after a delay to catch late-loading content
  setTimeout(initializeShopifyIntegration, 1000);
  setTimeout(initializeShopifyIntegration, 3000);
  
})();

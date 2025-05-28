
(() => {
  // codform.js - Fixed version for proper form rendering
  console.log("Codform JS loaded - Fixed version for storefront");
  
  // Main function to render form - receives form data directly, not formId
  function renderCodform(formData, containerId) {
    console.log('renderCodform called with:', { formData, containerId });
    
    const formContainer = document.getElementById(containerId);
    if (!formContainer) {
      console.error("Container element not found:", containerId);
      return;
    }
    
    // Validate form data
    if (!formData || !formData.data) {
      console.error("Invalid form data structure:", formData);
      formContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">خطأ في تحميل النموذج</div>';
      return;
    }
    
    // Clear existing content
    formContainer.innerHTML = "";
    
    // Get form style with defaults
    const formStyle = formData.style || {};
    const primaryColor = formStyle.primaryColor || "#9b87f5";
    const backgroundColor = formStyle.backgroundColor || "#F9FAFB";
    const borderRadius = formStyle.borderRadius || "0.5rem";
    const borderWidth = formStyle.borderWidth || "2px";
    const borderColor = formStyle.borderColor || "#9b87f5";
    const fontSize = formStyle.fontSize || "16px";
    const paddingTop = formStyle.paddingTop || "20px";
    const paddingRight = formStyle.paddingRight || "20px";
    const paddingBottom = formStyle.paddingBottom || "20px";
    const paddingLeft = formStyle.paddingLeft || "20px";
    const formGap = formStyle.formGap || "16px";
    const formDirection = formStyle.formDirection || "ltr";
    
    console.log('Form style applied:', formStyle);
    
    // Apply form container styles
    formContainer.style.cssText = `
      --form-primary-color: ${primaryColor};
      border-radius: ${borderRadius};
      font-size: ${fontSize};
      border: ${borderWidth} solid ${borderColor};
      background-color: ${backgroundColor};
      padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};
      direction: ${formDirection};
      gap: ${formGap};
      display: flex;
      flex-direction: column;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;
    
    // Process form fields from data structure
    let allFields = [];
    
    // Extract fields from steps structure
    if (formData.data && Array.isArray(formData.data)) {
      formData.data.forEach((step) => {
        if (step.fields && Array.isArray(step.fields)) {
          allFields = allFields.concat(step.fields);
        }
      });
    }
    
    console.log('Processing fields:', allFields.length);
    
    // Render each field
    allFields.forEach((field, index) => {
      console.log(`Processing field ${index + 1}:`, field.type, field.id);
      
      // Handle form title field - NEW CLEAN IMPLEMENTATION
      if (field.type === "form-title") {
        const titleElement = document.createElement("div");
        titleElement.className = "codform-title-field";
        
        // Get title text from content or label
        const titleText = field.content || field.label || "";
        
        // Skip rendering if no title text
        if (!titleText) {
          console.log('No title text found, skipping title rendering');
          return;
        }
        
        // Get styles from field settings
        const fieldStyle = field.style || {};
        const textColor = fieldStyle.color || "#000000";
        const fontSize = fieldStyle.fontSize || "1.5rem";
        const fontWeight = fieldStyle.fontWeight || "600";
        const fontFamily = fieldStyle.fontFamily || "system-ui, Arial, sans-serif";
        const textAlign = fieldStyle.textAlign || "center";
        const paddingTop = fieldStyle.paddingTop || "12px";
        const paddingBottom = fieldStyle.paddingBottom || "12px";
        const paddingLeft = fieldStyle.paddingLeft || "0px";
        const paddingRight = fieldStyle.paddingRight || "0px";
        
        console.log('Title field styling:', {
          titleText,
          textColor,
          fontSize,
          fontWeight,
          textAlign
        });
        
        // Apply clean title styles - NO BACKGROUND, just text
        titleElement.style.cssText = `
          color: ${textColor} !important;
          font-size: ${fontSize} !important;
          font-weight: ${fontWeight} !important;
          font-family: ${fontFamily} !important;
          text-align: ${textAlign} !important;
          margin: 0 0 1rem 0 !important;
          line-height: 1.4 !important;
          direction: ${formDirection} !important;
          padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft} !important;
          width: 100% !important;
          display: block !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        `;
        
        titleElement.textContent = titleText;
        titleElement.setAttribute('data-field-type', 'form-title');
        titleElement.setAttribute('data-field-id', field.id || 'form-title-default');
        
        formContainer.appendChild(titleElement);
        return;
      }
      
      // Handle text input fields
      if (field.type === "text" || field.type === "email") {
        const fieldWrapper = document.createElement("div");
        fieldWrapper.className = "codform-field-wrapper";
        fieldWrapper.style.cssText = `margin-bottom: ${formGap};`;
        
        const inputElement = document.createElement("input");
        inputElement.type = field.type === "email" ? "email" : "text";
        inputElement.placeholder = field.placeholder || field.label || "";
        inputElement.required = field.required || false;
        inputElement.className = "codform-input";
        
        // Apply basic input styles
        inputElement.style.cssText = `
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: ${fontSize};
          font-family: inherit;
          direction: ${formDirection};
        `;
        
        fieldWrapper.appendChild(inputElement);
        formContainer.appendChild(fieldWrapper);
        return;
      }
      
      // Handle phone input fields
      if (field.type === "phone") {
        const fieldWrapper = document.createElement("div");
        fieldWrapper.className = "codform-field-wrapper";
        fieldWrapper.style.cssText = `margin-bottom: ${formGap};`;
        
        const inputElement = document.createElement("input");
        inputElement.type = "tel";
        inputElement.placeholder = field.placeholder || field.label || "";
        inputElement.required = field.required || false;
        inputElement.className = "codform-input";
        
        // Apply basic input styles
        inputElement.style.cssText = `
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: ${fontSize};
          font-family: inherit;
          direction: ${formDirection};
        `;
        
        fieldWrapper.appendChild(inputElement);
        formContainer.appendChild(fieldWrapper);
        return;
      }
      
      // Handle textarea fields
      if (field.type === "textarea") {
        const fieldWrapper = document.createElement("div");
        fieldWrapper.className = "codform-field-wrapper";
        fieldWrapper.style.cssText = `margin-bottom: ${formGap};`;
        
        const textareaElement = document.createElement("textarea");
        textareaElement.placeholder = field.placeholder || field.label || "";
        textareaElement.required = field.required || false;
        textareaElement.className = "codform-textarea";
        textareaElement.rows = 4;
        
        // Apply basic textarea styles
        textareaElement.style.cssText = `
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: ${fontSize};
          font-family: inherit;
          direction: ${formDirection};
          resize: vertical;
        `;
        
        fieldWrapper.appendChild(textareaElement);
        formContainer.appendChild(fieldWrapper);
        return;
      }
      
      // Handle submit button
      if (field.type === "submit") {
        const buttonElement = document.createElement("button");
        buttonElement.type = "submit";
        buttonElement.textContent = field.label || "إرسال";
        buttonElement.className = "codform-submit-button";
        
        // Apply button styles
        const buttonBgColor = field.style?.backgroundColor || primaryColor;
        const buttonTextColor = field.style?.color || "#fff";
        
        buttonElement.style.cssText = `
          background-color: ${buttonBgColor};
          color: ${buttonTextColor};
          font-size: ${fontSize};
          border-radius: ${borderRadius};
          padding: 12px 24px;
          border: none;
          cursor: pointer;
          width: 100%;
          margin-top: ${formGap};
          font-weight: 600;
          transition: opacity 0.2s;
        `;
        
        // Add hover effect
        buttonElement.addEventListener('mouseenter', () => {
          buttonElement.style.opacity = '0.9';
        });
        
        buttonElement.addEventListener('mouseleave', () => {
          buttonElement.style.opacity = '1';
        });
        
        formContainer.appendChild(buttonElement);
        return;
      }
      
      // Handle HTML content fields
      if (field.type === "text/html") {
        const htmlContainer = document.createElement("div");
        htmlContainer.className = "codform-html-content";
        htmlContainer.innerHTML = field.content || "<p>محتوى HTML</p>";
        htmlContainer.style.cssText = `margin-bottom: ${formGap};`;
        
        formContainer.appendChild(htmlContainer);
        return;
      }
    });
    
    console.log('Form rendering completed successfully');
  }
  
  // Expose the function globally for use by the liquid template
  window.renderCodform = renderCodform;
  
  console.log('renderCodform function exposed globally');
})();

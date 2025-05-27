
(() => {
  // codform.js - استعادة الوظائف الأساسية مع إزالة العناصر القديمة
  console.log("Codform JS loaded - Fixed version");
  
  async function fetchForm(formId) {
    try {
      const response = await fetch(`/apps/codform/api/get-form?id=${formId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch form:", error);
      return null;
    }
  }
  
  async function renderForm(formId, containerId) {
    const form = await fetchForm(formId);
    if (!form) {
      console.error("Form not found or failed to load.");
      return;
    }
    
    const formContainer = document.getElementById(containerId);
    if (!formContainer) {
      console.error("Container element not found.");
      return;
    }
    
    // Clear existing content
    formContainer.innerHTML = "";
    
    const formStyle = form.style || {};
    
    // Apply form container styles
    formContainer.style.cssText = `
      --form-primary-color: ${formStyle.primaryColor || "#9b87f5"};
      border-radius: ${formStyle.borderRadius || "0.5rem"};
      font-size: ${formStyle.fontSize || "16px"};
      border: ${formStyle.borderWidth || "2px"} solid ${formStyle.borderColor || "#9b87f5"};
      background-color: ${formStyle.backgroundColor || "#F9FAFB"};
      padding: ${formStyle.paddingTop || "20px"} ${formStyle.paddingRight || "20px"} ${formStyle.paddingBottom || "20px"} ${formStyle.paddingLeft || "20px"};
      direction: ${formStyle.formDirection || "ltr"};
      gap: ${formStyle.formGap || "16px"};
      display: flex;
      flex-direction: column;
    `;
    
    // Create form element
    const formElement = document.createElement("form");
    formElement.className = "codform-form";
    
    // Process all form fields
    form.data.forEach((step) => {
      step.fields.forEach((field) => {
        console.log('Processing field:', field.type, field.id);
        
        // Handle form title field
        if (field.type === "form-title") {
          const titleElement = document.createElement("div");
          titleElement.className = "codform-title-field";
          
          const titleText = field.content || field.label || "";
          
          if (!titleText) {
            console.log('No title text found, skipping title rendering');
            return;
          }
          
          const fieldStyle = field.style || {};
          const textColor = fieldStyle.color || "#000000";
          const fontSize = fieldStyle.fontSize || "1.5rem";
          const fontWeight = fieldStyle.fontWeight || "600";
          const fontFamily = fieldStyle.fontFamily || "Cairo, Arial, sans-serif";
          const textAlign = fieldStyle.textAlign || "center";
          const paddingTop = fieldStyle.paddingTop || "12px";
          const paddingBottom = fieldStyle.paddingBottom || "12px";
          const paddingLeft = fieldStyle.paddingLeft || "0px";
          const paddingRight = fieldStyle.paddingRight || "0px";
          
          titleElement.style.cssText = `
            color: ${textColor} !important;
            font-size: ${fontSize} !important;
            font-weight: ${fontWeight} !important;
            font-family: ${fontFamily} !important;
            text-align: ${textAlign} !important;
            margin: 0 0 1rem 0 !important;
            line-height: 1.4 !important;
            direction: ${formStyle?.formDirection || "ltr"} !important;
            padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft} !important;
            width: 100% !important;
            display: block !important;
            background: transparent !important;
            border: none !important;
          `;
          
          titleElement.textContent = titleText;
          formElement.appendChild(titleElement);
          return;
        }
        
        // Handle text input fields
        if (field.type === "text" || field.type === "email") {
          const fieldContainer = document.createElement("div");
          fieldContainer.className = "codform-field";
          
          if (field.label) {
            const labelElement = document.createElement("label");
            labelElement.textContent = field.label;
            labelElement.className = "codform-label";
            fieldContainer.appendChild(labelElement);
          }
          
          const inputElement = document.createElement("input");
          inputElement.type = field.type === "email" ? "email" : "text";
          inputElement.name = field.id || field.type;
          inputElement.placeholder = field.placeholder || "";
          inputElement.required = field.required || false;
          inputElement.className = "codform-input";
          
          fieldContainer.appendChild(inputElement);
          formElement.appendChild(fieldContainer);
          return;
        }
        
        // Handle phone input fields
        if (field.type === "phone") {
          const fieldContainer = document.createElement("div");
          fieldContainer.className = "codform-field";
          
          if (field.label) {
            const labelElement = document.createElement("label");
            labelElement.textContent = field.label;
            labelElement.className = "codform-label";
            fieldContainer.appendChild(labelElement);
          }
          
          const inputElement = document.createElement("input");
          inputElement.type = "tel";
          inputElement.name = field.id || field.type;
          inputElement.placeholder = field.placeholder || "";
          inputElement.required = field.required || false;
          inputElement.className = "codform-input";
          
          fieldContainer.appendChild(inputElement);
          formElement.appendChild(fieldContainer);
          return;
        }
        
        // Handle textarea fields
        if (field.type === "textarea") {
          const fieldContainer = document.createElement("div");
          fieldContainer.className = "codform-field";
          
          if (field.label) {
            const labelElement = document.createElement("label");
            labelElement.textContent = field.label;
            labelElement.className = "codform-label";
            fieldContainer.appendChild(labelElement);
          }
          
          const textareaElement = document.createElement("textarea");
          textareaElement.name = field.id || field.type;
          textareaElement.placeholder = field.placeholder || "";
          textareaElement.required = field.required || false;
          textareaElement.className = "codform-textarea";
          
          fieldContainer.appendChild(textareaElement);
          formElement.appendChild(fieldContainer);
          return;
        }
        
        // Handle submit button
        if (field.type === "submit") {
          const buttonElement = document.createElement("button");
          buttonElement.type = "submit";
          buttonElement.textContent = field.label || "إرسال";
          buttonElement.className = "codform-submit-button";
          
          const buttonBgColor = field.style?.backgroundColor || formStyle.primaryColor || "#9b87f5";
          const buttonTextColor = field.style?.color || "#fff";
          
          buttonElement.style.cssText = `
            background-color: ${buttonBgColor};
            color: ${buttonTextColor};
            border-radius: ${formStyle.borderRadius || "0.5rem"};
            padding: 12px 24px;
            border: none;
            cursor: pointer;
            width: 100%;
            margin-top: 16px;
            font-weight: 600;
          `;
          
          formElement.appendChild(buttonElement);
          return;
        }
      });
    });
    
    formContainer.appendChild(formElement);
  }
  
  // Expose the function globally for backward compatibility
  window.renderCodform = renderForm;
})();

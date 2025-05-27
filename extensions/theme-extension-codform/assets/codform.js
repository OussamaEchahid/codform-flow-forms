
(() => {
  // codform.js - Clean version with form title handling removed
  console.log("Codform JS loaded - Clean version");
  
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
    
    // Process all form fields
    form.data.forEach((step) => {
      step.fields.forEach((field) => {
        console.log('Processing field:', field.type, field.id, field);
        
        // Skip form-title fields completely
        if (field.type === "form-title") {
          console.log('Skipping form-title field:', field.id);
          return;
        }
        
        // Handle text input fields
        if (field.type === "text" || field.type === "email") {
          const inputElement = document.createElement("input");
          inputElement.type = field.type === "email" ? "email" : "text";
          inputElement.placeholder = field.placeholder || "";
          inputElement.required = field.required || false;
          inputElement.className = "codform-input";
          
          // Apply field styles if available
          if (field.style) {
            inputElement.style.cssText = `
              color: ${field.style.color || "#000"};
              font-size: ${field.style.fontSize || "16px"};
              text-align: ${field.style.textAlign || "left"};
            `;
          }
          
          formContainer.appendChild(inputElement);
          return;
        }
        
        // Handle phone input fields
        if (field.type === "phone") {
          const inputElement = document.createElement("input");
          inputElement.type = "tel";
          inputElement.placeholder = field.placeholder || "";
          inputElement.required = field.required || false;
          inputElement.className = "codform-input";
          
          // Apply field styles if available
          if (field.style) {
            inputElement.style.cssText = `
              color: ${field.style.color || "#000"};
              font-size: ${field.style.fontSize || "16px"};
              text-align: ${field.style.textAlign || "left"};
            `;
          }
          
          formContainer.appendChild(inputElement);
          return;
        }
        
        // Handle textarea fields
        if (field.type === "textarea") {
          const textareaElement = document.createElement("textarea");
          textareaElement.placeholder = field.placeholder || "";
          textareaElement.required = field.required || false;
          textareaElement.className = "codform-textarea";
          
          // Apply field styles if available
          if (field.style) {
            textareaElement.style.cssText = `
              color: ${field.style.color || "#000"};
              font-size: ${field.style.fontSize || "16px"};
              text-align: ${field.style.textAlign || "left"};
            `;
          }
          
          formContainer.appendChild(textareaElement);
          return;
        }
        
        // Handle select fields
        if (field.type === "select") {
          const selectElement = document.createElement("select");
          selectElement.className = "codform-select";
          
          field.options?.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value || option;
            optionElement.textContent = option.label || option;
            selectElement.appendChild(optionElement);
          });
          
          formContainer.appendChild(selectElement);
          return;
        }
        
        // Handle checkbox fields
        if (field.type === "checkbox") {
          const checkboxContainer = document.createElement("div");
          checkboxContainer.className = "codform-checkbox-container";
          
          const checkboxElement = document.createElement("input");
          checkboxElement.type = "checkbox";
          checkboxElement.id = field.id || `checkbox-${Math.random()}`;
          checkboxElement.className = "codform-checkbox";
          
          const labelElement = document.createElement("label");
          labelElement.textContent = field.label || "Option";
          labelElement.htmlFor = checkboxElement.id;
          
          checkboxContainer.appendChild(checkboxElement);
          checkboxContainer.appendChild(labelElement);
          formContainer.appendChild(checkboxContainer);
          return;
        }
        
        // Handle radio fields
        if (field.type === "radio") {
          const radioContainer = document.createElement("div");
          radioContainer.className = "codform-radio-container";
          
          const radioElement = document.createElement("input");
          radioElement.type = "radio";
          radioElement.id = field.id || `radio-${Math.random()}`;
          radioElement.name = field.name || `radio-group-${Math.random()}`;
          radioElement.className = "codform-radio";
          
          const labelElement = document.createElement("label");
          labelElement.textContent = field.label || "Option";
          labelElement.htmlFor = radioElement.id;
          
          radioContainer.appendChild(radioElement);
          radioContainer.appendChild(labelElement);
          formContainer.appendChild(radioContainer);
          return;
        }
        
        // Handle submit button
        if (field.type === "submit") {
          const buttonElement = document.createElement("button");
          buttonElement.type = "submit";
          buttonElement.textContent = field.label || "Submit";
          buttonElement.className = `codform-submit-button ${formStyle.buttonStyle || "rounded"}`;
          
          // Apply button styles from field or form settings
          const buttonBgColor = field.style?.backgroundColor || formStyle.primaryColor || "#9b87f5";
          const buttonTextColor = field.style?.color || "#fff";
          const buttonFontSize = field.style?.fontSize || "1rem";
          
          buttonElement.style.cssText = `
            background-color: ${buttonBgColor};
            color: ${buttonTextColor};
            font-size: ${buttonFontSize};
            border-radius: ${formStyle.borderRadius || "0.5rem"};
            padding: 12px 24px;
            border: none;
            cursor: pointer;
            width: 100%;
            margin-top: 16px;
          `;
          
          formContainer.appendChild(buttonElement);
          return;
        }
        
        // Handle HTML content fields
        if (field.type === "text/html") {
          const htmlContainer = document.createElement("div");
          htmlContainer.className = "codform-html-content";
          htmlContainer.innerHTML = field.content || "<p>HTML Content</p>";
          
          formContainer.appendChild(htmlContainer);
          return;
        }
      });
    });
  }
  
  // Expose the function globally
  window.renderCodform = renderForm;
})();


(() => {
  // codform.js
  console.log("Codform JS loaded");
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
    formContainer.innerHTML = "";
    const formStyle = form.style || {};
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
    form.data.forEach((step) => {
      step.fields.forEach((field) => {
        if (field.type === "text") {
          const inputElement = document.createElement("input");
          inputElement.type = "text";
          inputElement.placeholder = field.placeholder || "";
          inputElement.required = field.required || false;
          inputElement.className = "codform-input";
          formContainer.appendChild(inputElement);
          return;
        }
        if (field.type === "email") {
          const inputElement = document.createElement("input");
          inputElement.type = "email";
          inputElement.placeholder = field.placeholder || "";
          inputElement.required = field.required || false;
          inputElement.className = "codform-input";
          formContainer.appendChild(inputElement);
          return;
        }
        if (field.type === "phone") {
          const inputElement = document.createElement("input");
          inputElement.type = "tel";
          inputElement.placeholder = field.placeholder || "";
          inputElement.required = field.required || false;
          inputElement.className = "codform-input";
          formContainer.appendChild(inputElement);
          return;
        }
        if (field.type === "textarea") {
          const textareaElement = document.createElement("textarea");
          textareaElement.placeholder = field.placeholder || "";
          textareaElement.required = field.required || false;
          textareaElement.className = "codform-textarea";
          formContainer.appendChild(textareaElement);
          return;
        }
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
        if (field.type === "submit") {
          const buttonElement = document.createElement("button");
          buttonElement.type = "submit";
          buttonElement.textContent = field.label || "Submit";
          buttonElement.className = `codform-submit-button ${formStyle.buttonStyle || "rounded"}`;
          buttonElement.style.cssText = `
            background-color: ${field.style?.backgroundColor || formStyle.primaryColor || "#9b87f5"};
            color: ${field.style?.color || "#fff"};
            font-size: ${field.style?.fontSize || "1rem"};
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
        if (field.type === "text/html") {
          const htmlContainer = document.createElement("div");
          htmlContainer.className = "codform-html-content";
          htmlContainer.innerHTML = field.content || "<p>HTML Content</p>";
          formContainer.appendChild(htmlContainer);
          return;
        }
        if (field.type === "form-title") {
          const titleElement = document.createElement("div");
          titleElement.className = "codform-title-field";
          
          // استخدام النص من content أو label أو النص الافتراضي
          const titleText = field.content || field.label || "عنوان النموذج";
          
          // تطبيق التنسيق من إعدادات الحقل أو القيم الافتراضية - اللون الأسود كافتراضي
          const textColor = field.style?.color || "#000000"; // اللون الأسود كافتراضي
          const fontSize = field.style?.fontSize || "1.5rem"; // حجم خط أكبر
          const fontWeight = field.style?.fontWeight || "600";
          const fontFamily = field.style?.fontFamily || "Tajawal, Arial, sans-serif";
          const paddingTop = field.style?.paddingTop || "12px";
          const paddingBottom = field.style?.paddingBottom || "12px";
          const paddingLeft = field.style?.paddingLeft || "0px";
          const paddingRight = field.style?.paddingRight || "0px";
          
          console.log('Storefront Title Rendering:', {
            titleText,
            textColor,
            fontSize,
            fontWeight,
            backgroundColor: 'transparent'
          });
          
          titleElement.style.cssText = `
            color: ${textColor} !important;
            font-size: ${fontSize} !important;
            font-weight: ${fontWeight} !important;
            font-family: ${fontFamily} !important;
            text-align: center !important;
            margin: 0 0 1rem 0 !important;
            line-height: 1.4 !important;
            direction: ${formStyle?.formDirection || "ltr"} !important;
            padding-top: ${paddingTop} !important;
            padding-bottom: ${paddingBottom} !important;
            padding-left: ${paddingLeft} !important;
            padding-right: ${paddingRight} !important;
            width: 100% !important;
            display: block !important;
            background-color: transparent !important;
            background: transparent !important;
            border: none !important;
          `;
          
          titleElement.textContent = titleText;
          titleElement.setAttribute('data-field-type', 'form-title');
          titleElement.setAttribute('data-field-id', field.id || 'form-title-default');
          titleElement.setAttribute('data-text-color', textColor);
          titleElement.setAttribute('data-background', 'transparent');
          
          formContainer.appendChild(titleElement);
          return;
        }
      });
    });
  }
  window.renderCodform = renderForm;
})();

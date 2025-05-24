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
          titleElement.style.cssText = `
            color: ${field.style?.color || "#1f2937"};
            font-size: ${field.style?.fontSize || "1.5rem"};
            font-weight: ${field.style?.fontWeight || "600"};
            text-align: ${field.style?.textAlign || "center"};
            margin: 0 0 1rem 0;
            line-height: 1.3;
            padding: 8px 0;
            direction: ${formStyle?.formDirection || "ltr"};
            font-family: ${field.style?.fontFamily || "inherit"};
          `;
          titleElement.textContent = field.content || field.label || "عنوان النموذج";
          formContainer.appendChild(titleElement);
          return;
        }
      });
    });
  }
  window.renderCodform = renderForm;
})();

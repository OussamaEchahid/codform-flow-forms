
// CODFORM JS - CLEAN AND WORKING VERSION
console.log("🚀 Codform JS loaded successfully");

// Main function to render form
function renderCodform(formData, containerId) {
  console.log("🎯 renderCodform called", { formData, containerId });
  
  try {
    // Get container element
    const container = document.getElementById(containerId);
    if (!container) {
      console.error("❌ Container not found:", containerId);
      return;
    }
    
    // Validate form data
    if (!formData || !formData.data) {
      console.error("❌ Invalid form data:", formData);
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">خطأ في تحميل النموذج</div>';
      return;
    }
    
    console.log("✅ Form data is valid, starting render");
    
    // Clear container
    container.innerHTML = "";
    
    // Get form style
    const style = formData.style || {};
    const primaryColor = style.primaryColor || "#9b87f5";
    const backgroundColor = style.backgroundColor || "#F9FAFB";
    const borderRadius = style.borderRadius || "8px";
    const fontSize = style.fontSize || "16px";
    const formDirection = style.formDirection || "ltr";
    
    // Apply container styles
    container.style.cssText = `
      background-color: ${backgroundColor};
      border-radius: ${borderRadius};
      font-size: ${fontSize};
      direction: ${formDirection};
      padding: 20px;
      font-family: system-ui, Arial, sans-serif;
      max-width: 100%;
      box-sizing: border-box;
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
    
    // Render each field
    allFields.forEach((field, index) => {
      if (!field || !field.type) {
        console.warn("⚠️ Invalid field at index", index, field);
        return;
      }
      
      console.log(`🔧 Rendering field ${index + 1}: ${field.type}`);
      
      // Create field wrapper
      const fieldWrapper = document.createElement("div");
      fieldWrapper.style.cssText = "margin-bottom: 16px;";
      
      // Handle different field types
      switch (field.type) {
        case "form-title":
          renderFormTitle(field, fieldWrapper, formDirection);
          break;
          
        case "text":
        case "email":
        case "phone":
          renderTextInput(field, fieldWrapper, formDirection);
          break;
          
        case "textarea":
          renderTextarea(field, fieldWrapper, formDirection);
          break;
          
        case "submit":
          renderSubmitButton(field, fieldWrapper, primaryColor);
          break;
          
        case "text/html":
          renderHtmlContent(field, fieldWrapper);
          break;
          
        default:
          console.warn("⚠️ Unknown field type:", field.type);
          renderGenericField(field, fieldWrapper);
      }
      
      container.appendChild(fieldWrapper);
    });
    
    console.log("✅ Form rendered successfully");
    
  } catch (error) {
    console.error("❌ Error in renderCodform:", error);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff0000;">حدث خطأ في عرض النموذج</div>';
    }
  }
}

// Helper function to render form title
function renderFormTitle(field, wrapper, direction) {
  const titleText = field.content || field.label || "";
  if (!titleText) return;
  
  const titleElement = document.createElement("div");
  
  // Get styling from field
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
  `;
  
  titleElement.textContent = titleText;
  wrapper.appendChild(titleElement);
}

// Helper function to render text inputs
function renderTextInput(field, wrapper, direction) {
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
  
  input.style.cssText = `
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: inherit;
    font-family: inherit;
    direction: ${direction};
    box-sizing: border-box;
  `;
  
  wrapper.appendChild(input);
}

// Helper function to render textarea
function renderTextarea(field, wrapper, direction) {
  const textarea = document.createElement("textarea");
  textarea.placeholder = field.placeholder || field.label || "";
  textarea.required = field.required || false;
  textarea.rows = 4;
  
  textarea.style.cssText = `
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: inherit;
    font-family: inherit;
    direction: ${direction};
    resize: vertical;
    box-sizing: border-box;
  `;
  
  wrapper.appendChild(textarea);
}

// Helper function to render submit button
function renderSubmitButton(field, wrapper, primaryColor) {
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = field.label || "إرسال";
  
  const buttonBg = field.style?.backgroundColor || primaryColor;
  const buttonColor = field.style?.color || "#ffffff";
  
  button.style.cssText = `
    background-color: ${buttonBg};
    color: ${buttonColor};
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: inherit;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: opacity 0.2s;
    box-sizing: border-box;
  `;
  
  button.addEventListener('mouseenter', () => button.style.opacity = '0.9');
  button.addEventListener('mouseleave', () => button.style.opacity = '1');
  
  wrapper.appendChild(button);
}

// Helper function to render HTML content
function renderHtmlContent(field, wrapper) {
  const htmlDiv = document.createElement("div");
  htmlDiv.innerHTML = field.content || "<p>محتوى HTML</p>";
  wrapper.appendChild(htmlDiv);
}

// Helper function to render generic fields
function renderGenericField(field, wrapper) {
  const genericDiv = document.createElement("div");
  genericDiv.textContent = field.label || `حقل من نوع ${field.type}`;
  genericDiv.style.cssText = "padding: 10px; background: #f0f0f0; border-radius: 4px;";
  wrapper.appendChild(genericDiv);
}

// Expose function globally
window.renderCodform = renderCodform;

// Debug log to confirm function is available
console.log("✅ renderCodform function exposed globally:", typeof window.renderCodform);

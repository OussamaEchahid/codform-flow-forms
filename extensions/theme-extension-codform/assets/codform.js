
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
      const defaultFontSize = style.fontSize || "16px";
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
    const unifiedFontSize = fieldStyle.fontSize || defaultFontSize;
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
    const unifiedFontSize = fieldStyle.fontSize || defaultFontSize;
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
  
  // Create submit button
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
  
})();

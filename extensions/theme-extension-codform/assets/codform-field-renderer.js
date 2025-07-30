/* ===============================================================================
   CODFORM FIELD RENDERER - Complete field rendering functions
   =============================================================================== */

// Helper function to get style values safely
function getStyleValue(style, property, fallback) {
  if (!style || typeof style !== 'object') return fallback;
  return style[property] || fallback;
}

function renderField(field, formStyle, formLanguage) {
  if (!field || !field.type) return '';
  
  console.log('🎨 Rendering field:', field.type, field.id);
  
  // Check if we're currently rendering inside a popup
  const isInPopup = window.codformCurrentlyInPopup === true;
  
  // Determine form direction - better detection
  let formDirection = 'ltr';
  if (formStyle && formStyle.formDirection) {
    formDirection = formStyle.formDirection;
  } else if (formLanguage === 'ar' || (formLanguage && formLanguage.includes('ar'))) {
    formDirection = 'rtl';
  } else if (field.label && /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(field.label)) {
    formDirection = 'rtl';
  }
  
  console.log('🔄 CODFORM: Detected form direction:', formDirection, 'for language:', formLanguage);
  
  // Base styling configuration - Match TextInput.tsx exactly
  const baseFontSize = getStyleValue(formStyle, 'fontSize', '1rem');
  const labelStyle = field.style || {};
  const showLabel = getStyleValue(labelStyle, 'showLabel', true);
  const isFloatingLabels = getStyleValue(formStyle, 'floatingLabels', false);
  
  // Label styling - Match TextInput.tsx exactly with proper sizing
  const labelColor = getStyleValue(labelStyle, 'labelColor', '#333333');
  const labelFontSize = getStyleValue(formStyle, 'fontSize', '1rem');
  const labelFontWeight = getStyleValue(labelStyle, 'labelFontWeight', '500');
  
  // Field styling - Match TextInput.tsx exactly with proper sizing
  const fieldBackgroundColor = '#FFFFFF';
  const fieldBorderColor = getStyleValue(labelStyle, 'borderColor', '#D1D5DB');
  const fieldBorderRadius = getStyleValue(labelStyle, 'borderRadius', '8px');
  const fieldFontSize = getStyleValue(formStyle, 'fontSize', '1rem');
  const fieldTextColor = getStyleValue(labelStyle, 'color', '#1F2937');
  const placeholderFontSize = fieldFontSize; // Use same size as field text
  const focusBorderColor = getStyleValue(formStyle, 'focusBorderColor', '#9b87f5');
  
  let html = '';
  
  // Get icon if available
  const icon = field.icon || field.style?.icon;
  const hasIcon = icon && icon !== 'none' && icon !== '';
  const showIcon = getStyleValue(labelStyle, 'showIcon', hasIcon);
  const iconSvg = showIcon && hasIcon ? getIconSvg(icon, getStyleValue(labelStyle, 'iconColor', '#6b7280')) : '';
  
  switch (field.type) {
    case 'form-title':
      const titleStyle = field.style || {};
      const titleColor = titleStyle.color || '#000000';
      const titleFontSize = titleStyle.fontSize || '1.5rem';
      const titleFontWeight = titleStyle.fontWeight || '700';
      // Always center the title - match FormTitleField.tsx
      const titleTextAlign = 'center';
      
      html = `
        <div class="form-title-field w-full" style="
          color: ${titleColor};
          font-size: ${titleFontSize};
          font-weight: ${titleFontWeight};
          font-family: 'Cairo', 'Tajawal', 'Arial', sans-serif;
          text-align: ${titleTextAlign};
          margin: 0px;
          line-height: 1.4;
          direction: ${formDirection};
          padding-top: ${titleStyle.paddingTop || '0px'};
          padding-bottom: ${titleStyle.paddingBottom || '0px'};
          padding-left: ${titleStyle.paddingLeft || '0px'};
          padding-right: ${titleStyle.paddingRight || '0px'};
          width: 100%;
          display: block;
          background-color: transparent;
          background: none;
          border: none;
        ">
          ${field.content || field.label || 'عنوان النموذج'}
        </div>
      `;
      break;

    case 'text':
    case 'email':
    case 'phone':
      const inputType = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text';
      const isRequired = field.required;
      const placeholder = field.placeholder || field.helpText || '';
      
      if (isFloatingLabels) {
        html = `
          <div class="codform-field-wrapper floating-label-field" style="
            position: relative;
            margin-bottom: 20px;
            direction: ${formDirection};
          ">
            <input
              type="${inputType}"
              id="${field.id}"
              name="${field.id}"
              placeholder=""
              ${isRequired ? 'required' : ''}
              style="
                width: 100%;
                padding: ${fieldPadding};
                border: 2px solid ${fieldBorderColor};
                border-radius: ${fieldBorderRadius};
                background-color: ${fieldBackgroundColor};
                color: ${fieldTextColor};
                font-size: ${fieldFontSize};
                font-family: ${formLanguage === 'ar' ? "'Cairo', 'Noto Sans Arabic', 'Amiri', sans-serif" : "'Inter', system-ui, sans-serif"};
                transition: all 0.3s ease;
                box-sizing: border-box;
                direction: ${formDirection};
                text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
              "
              onfocus="this.style.borderColor='#9b87f5'"
              onblur="this.style.borderColor='${fieldBorderColor}'"
            />
            ${showLabel ? `
              <label class="floating-label" for="${field.id}" style="
                position: absolute;
                top: 50%;
                ${formDirection === 'rtl' ? 'right' : 'left'}: 16px;
                transform: translateY(-50%);
                color: #9CA3AF;
                font-size: ${fieldFontSize};
                font-weight: ${labelFontWeight};
                background: white;
                padding: 0 4px;
                transition: all 0.3s ease;
                pointer-events: none;
                font-family: ${formLanguage === 'ar' ? "'Cairo', 'Noto Sans Arabic', 'Amiri', sans-serif" : "'Inter', system-ui, sans-serif"};
              ">${field.label}${isRequired ? ' *' : ''}</label>
            ` : ''}
          </div>
        `;
      } else {
        html = `
          <div class="codform-field-wrapper" style="
            margin-bottom: 16px;
            direction: ${formDirection};
            background: transparent;
          ">
            ${showLabel ? `
              <label for="${field.id}" style="
                display: block;
                margin-bottom: 8px;
                color: ${labelColor};
                font-size: ${labelFontSize};
                font-weight: ${labelFontWeight};
                font-family: ${formLanguage === 'ar' ? "'Cairo', sans-serif" : "inherit"};
                text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
                background: transparent;
                padding: 0;
              ">${field.label}${isRequired ? ' <span style="margin-left: 4px; color: rgb(239, 68, 68);">*</span>' : ''}</label>
            ` : ''}
            <div style="position: relative; background: transparent;">
              ${iconSvg ? `
                <div style="
                  position: absolute;
                  top: 50%;
                  ${formDirection === 'rtl' ? 'right' : 'left'}: 12px;
                  transform: translateY(-50%);
                  z-index: 2;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #6b7280;
                  background: transparent;
                ">
                  ${iconSvg}
                </div>
              ` : ''}
              <input
                type="${inputType}"
                id="${field.id}"
                name="${field.id}"
                placeholder="${placeholder}"
                ${isRequired ? 'required' : ''}
                style="
                  width: 100%;
                  padding: 10px ${iconSvg ? (formDirection === 'rtl' ? '40px 10px 12px' : '12px 10px 40px') : '12px'};
                  border: 1px solid ${fieldBorderColor};
                  border-radius: ${fieldBorderRadius};
                  background-color: ${fieldBackgroundColor};
                  color: ${fieldTextColor};
                  font-size: ${fieldFontSize};
                  font-weight: 400;
                  font-family: inherit;
                  transition: all 0.2s ease;
                  box-sizing: border-box;
                  direction: ${formDirection};
                  text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
                  outline: none;
                  box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
                  min-height: 44px;
                  line-height: 1.5;
                "
                onfocus="this.style.borderColor='${focusBorderColor}'; this.style.boxShadow='0 0 0 3px ${focusBorderColor}20';"
                onblur="this.style.borderColor='${fieldBorderColor}'; this.style.boxShadow='rgba(0, 0, 0, 0.05) 0px 1px 2px';"
              />
            </div>
          </div>
        `;
      }
      break;

    case 'textarea':
      const textareaRequired = field.required;
      const textareaPlaceholder = field.placeholder || field.helpText || '';
      
      if (isFloatingLabels) {
        html = `
          <div class="codform-field-wrapper floating-label-field" style="
            position: relative;
            margin-bottom: 20px;
            direction: ${formDirection};
          ">
            <textarea
              id="${field.id}"
              name="${field.id}"
              placeholder=""
              rows="4"
              ${textareaRequired ? 'required' : ''}
              style="
                width: 100%;
                padding: 16px;
                border: 2px solid ${fieldBorderColor};
                border-radius: ${fieldBorderRadius};
                background-color: ${fieldBackgroundColor};
                color: ${fieldTextColor};
                font-size: ${fieldFontSize};
                font-family: ${formLanguage === 'ar' ? "'Cairo', 'Noto Sans Arabic', 'Amiri', sans-serif" : "'Inter', system-ui, sans-serif"};
                transition: all 0.3s ease;
                resize: vertical;
                box-sizing: border-box;
                direction: ${formDirection};
                text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
              "
              onfocus="this.style.borderColor='#9b87f5'"
              onblur="this.style.borderColor='${fieldBorderColor}'"
            ></textarea>
            ${showLabel ? `
              <label class="floating-label" for="${field.id}" style="
                position: absolute;
                top: 20px;
                ${formDirection === 'rtl' ? 'right' : 'left'}: 16px;
                color: #9CA3AF;
                font-size: ${fieldFontSize};
                font-weight: ${labelFontWeight};
                background: white;
                padding: 0 4px;
                transition: all 0.3s ease;
                pointer-events: none;
                font-family: ${formLanguage === 'ar' ? "'Cairo', 'Noto Sans Arabic', 'Amiri', sans-serif" : "'Inter', system-ui, sans-serif"};
              ">${field.label}${textareaRequired ? ' *' : ''}</label>
            ` : ''}
          </div>
        `;
      } else {
        html = `
          <div class="codform-field-wrapper" style="
            margin-bottom: 16px;
            direction: ${formDirection};
          ">
            ${showLabel ? `
              <label for="${field.id}" style="
                display: block;
                margin-bottom: 8px;
                color: ${labelColor};
                font-size: ${labelFontSize};
                font-weight: ${labelFontWeight};
                font-family: inherit;
                text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
                display: flex;
                align-items: center;
              ">${field.label}${textareaRequired ? ' <span style="margin-left: 4px; color: rgb(239, 68, 68);">*</span>' : ''}</label>
            ` : ''}
            <textarea
              id="${field.id}"
              name="${field.id}"
              placeholder="${textareaPlaceholder}"
              rows="4"
              ${textareaRequired ? 'required' : ''}
              style="
                width: 100%;
                padding: 10px 12px;
                border: 1px solid ${fieldBorderColor};
                border-radius: ${fieldBorderRadius};
                background-color: ${fieldBackgroundColor};
                color: ${fieldTextColor};
                font-size: ${fieldFontSize};
                font-weight: 400;
                font-family: inherit;
                transition: all 0.2s ease;
                resize: none;
                box-sizing: border-box;
                direction: ${formDirection};
                text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
                outline: none;
                box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
                min-height: 80px;
                height: 80px;
                line-height: 1.5;
              "
              onfocus="this.style.borderColor='${focusBorderColor}'; this.style.boxShadow='0 0 0 3px ${focusBorderColor}20';"
              onblur="this.style.borderColor='${fieldBorderColor}'; this.style.boxShadow='rgba(0, 0, 0, 0.05) 0px 1px 2px';"
            ></textarea>
          </div>
        `;
      }
      break;

    case 'submit':
      const submitStyle = field.style || {};
      const submitBgColor = submitStyle.backgroundColor || '#9b87f5';
      const submitTextColor = submitStyle.textColor || '#ffffff';
      const submitFontSize = submitStyle.fontSize || '1rem';
      const submitBorderRadius = submitStyle.borderRadius || '8px';
      const submitText = field.label || field.text || 'Submit Order';
      const submitIcon = getIconSvg('shopping-cart', submitTextColor);
      
      html = `
        <div class="codform-submit-wrapper" style="
          margin-top: 24px;
          margin-bottom: 20px;
          direction: ${formDirection};
          text-align: center;
        ">
          <button
            type="submit"
            class="codform-submit-btn"
            style="
              background-color: ${submitBgColor};
              color: ${submitTextColor};
              border: none;
              border-radius: ${submitBorderRadius};
              font-size: ${submitFontSize};
              font-weight: bold;
              padding: 15px 24px;
              cursor: pointer;
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              transition: all 0.2s ease;
              font-family: inherit;
              box-shadow: 0 4px 12px rgba(155, 135, 245, 0.15);
              position: relative;
              overflow: hidden;
            "
            onmouseover="
              this.style.transform='translateY(-2px)'; 
              this.style.boxShadow='0 6px 20px rgba(155, 135, 245, 0.25)';
              this.style.scale='1.02';
            "
            onmouseout="
              this.style.transform='translateY(0)'; 
              this.style.boxShadow='0 4px 12px rgba(155, 135, 245, 0.15)';
              this.style.scale='1';
            "
            onmousedown="this.style.scale='0.98';"
            onmouseup="this.style.scale='1.02';"
          >
            ${submitIcon}
            ${submitText}
          </button>
        </div>
      `;
      break;

    default:
      console.log('🔄 CODFORM: Unknown field type:', field.type);
      html = `
        <div class="codform-unknown-field" style="
          margin-bottom: 20px;
          padding: 16px;
          border: 2px dashed #e5e7eb;
          border-radius: 8px;
          text-align: center;
          color: #6b7280;
          font-family: ${formLanguage === 'ar' ? "'Cairo', 'Noto Sans Arabic', 'Amiri', sans-serif" : "'Inter', system-ui, sans-serif"};
        ">
          Unknown field type: ${field.type}
        </div>
      `;
  }
  
  return html;
}

// Helper function for icon generation (will be moved to separate file later)
function getIconSvg(iconName, color = '#9b87f5') {
  if (!iconName || iconName === 'none') return '';
  
  const strokeStyle = `fill: none; stroke: ${color}; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; width: 18px; height: 18px;`;
  const filledStyle = `fill: ${color}; width: 18px; height: 18px;`;
  
  let svgResult = '';
  
  switch (iconName) {
    case 'user':
      svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
      break;
    case 'phone':
      svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
      break;
    case 'mail':
    case 'email':
      svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
      break;
    case 'send':
      svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><path d="M22 2 11 13"></path><path d="M22 2 15 22 11 13 2 9 22 2Z"></path></svg>`;
      break;
    case 'shopping-cart':
      const cartStyle = `fill: none; stroke: ${color}; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; width: 16px; height: 16px;`;
      svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${cartStyle}" viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>`;
      break;
    default:
      svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
  
  return svgResult;
}

// Make functions globally available
window.renderField = renderField;
window.getIconSvg = getIconSvg;
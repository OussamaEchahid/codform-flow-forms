/* ===============================================================================
   CODFORM FIELDS - Field rendering functions
   =============================================================================== */

// Field rendering function
window.renderField = function(field, formStyle, formLanguage) {
  if (!field || !field.type) return '';
  
  const formDirection = formStyle.formDirection || (formLanguage === 'ar' ? 'rtl' : 'ltr');
  const baseFontSize = getStyleValue(formStyle, 'baseFontSize', '16px');
  
  let html = '';
  
  // Form Title Field
  if (field.type === 'form-title') {
    const title = field.label || 'Form Title';
    const titleColor = getStyleValue(field.style, 'color', '#000000');
    const titleFontSize = getStyleValue(field.style, 'fontSize', '24px');
    const titleFontWeight = getStyleValue(field.style, 'fontWeight', 'bold');
    
    html = `
      <div class="form-title-field w-full" style="
        color: ${titleColor};
        font-size: ${titleFontSize};
        font-weight: ${titleFontWeight};
        font-family: Cairo, Tajawal, Arial, sans-serif;
        text-align: center;
        margin: 0px;
        line-height: 1.4;
        direction: ${formDirection};
        width: 100%;
        display: block;
      ">
        ${title}
      </div>
    `;
  }
  // Text Input Fields
  else if (['text', 'email', 'phone'].includes(field.type)) {
    html = renderTextInput(field, formStyle, formDirection, baseFontSize);
  }
  // Textarea Field
  else if (field.type === 'textarea') {
    html = renderTextarea(field, formStyle, formDirection, baseFontSize);
  }
  // Cart Items Field
  else if (field.type === 'cart-items') {
    html = renderCartItems(field, formStyle, formDirection);
  }
  // Submit Button
  else if (field.type === 'submit') {
    html = renderSubmitButton(field, formStyle, formDirection);
  }
  // WhatsApp Button
  else if (field.type === 'whatsapp') {
    html = renderWhatsAppButton(field, formStyle, formDirection);
  }
  
  return html;
};

// Text input renderer
function renderTextInput(field, formStyle, formDirection, baseFontSize) {
  const label = field.label || 'Text Field';
  const placeholder = field.placeholder || '';
  const required = field.required || false;
  const fieldId = field.id || 'field-' + Math.random().toString(36).substr(2, 9);
  
  let inputType = 'text';
  if (field.type === 'email') inputType = 'email';
  if (field.type === 'phone') inputType = 'tel';
  
  const fieldStyle = field.style || {};
  const actualLabelColor = getStyleValue(fieldStyle, 'labelColor', '#333333');
  const actualLabelFontSize = getStyleValue(fieldStyle, 'labelFontSize', baseFontSize);
  const actualShowLabel = fieldStyle.showLabel !== undefined ? fieldStyle.showLabel : true;
  const actualTextColor = getStyleValue(fieldStyle, 'color', 'rgb(31, 41, 55)');
  const actualBorderColor = getStyleValue(fieldStyle, 'borderColor', 'rgb(209, 213, 219)');
  const actualBorderRadius = getStyleValue(fieldStyle, 'borderRadius', '8px');
  
  return `
    <div class="codform-field-wrapper" style="margin-bottom: 16px; direction: ${formDirection};">
      ${actualShowLabel ? `
        <label for="${fieldId}" style="
          display: block;
          color: ${actualLabelColor};
          font-size: ${actualLabelFontSize};
          font-weight: 600;
          margin-bottom: 8px;
          font-family: 'Cairo', sans-serif;
        ">
          ${label}${required ? '<span style="color: #EF4444; margin-left: 4px;">*</span>' : ''}
        </label>
      ` : ''}
      
      <input
        type="${inputType}"
        id="${fieldId}"
        name="${fieldId}"
        placeholder="${placeholder}"
        ${required ? 'required' : ''}
        style="
          width: 100%;
          background-color: #FFFFFF;
          border: 1px solid ${actualBorderColor};
          border-radius: ${actualBorderRadius};
          padding: 12px 16px;
          font-size: ${baseFontSize};
          color: ${actualTextColor};
          outline: none;
          transition: all 0.2s ease;
          box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
          min-height: 44px;
          box-sizing: border-box;
          direction: ${formDirection};
          text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
        "
      />
    </div>
  `;
}

// Textarea renderer
function renderTextarea(field, formStyle, formDirection, baseFontSize) {
  const label = field.label || 'Text Area';
  const placeholder = field.placeholder || '';
  const required = field.required || false;
  const fieldId = field.id || 'field-' + Math.random().toString(36).substr(2, 9);
  
  const fieldStyle = field.style || {};
  const actualLabelColor = getStyleValue(fieldStyle, 'labelColor', 'rgb(51, 65, 85)');
  const actualShowLabel = fieldStyle.showLabel !== undefined ? fieldStyle.showLabel : true;
  const actualTextColor = getStyleValue(fieldStyle, 'color', 'rgb(31, 41, 55)');
  const actualBorderColor = getStyleValue(fieldStyle, 'borderColor', 'rgb(209, 213, 219)');
  const actualBorderRadius = getStyleValue(fieldStyle, 'borderRadius', '8px');
  
  return `
    <div class="codform-field-wrapper" style="margin-bottom: 20px; direction: ${formDirection};">
      ${actualShowLabel ? `
        <label for="${fieldId}" style="
          display: block;
          color: ${actualLabelColor};
          font-size: ${baseFontSize};
          font-weight: 500;
          margin-bottom: 8px;
          font-family: 'Cairo', sans-serif;
        ">
          ${label}${required ? '<span style="color: #EF4444; margin-left: 4px;">*</span>' : ''}
        </label>
      ` : ''}
      
      <textarea
        id="${fieldId}"
        name="${fieldId}"
        placeholder="${placeholder}"
        ${required ? 'required' : ''}
        style="
          width: 100%;
          background-color: #FFFFFF;
          border: 1px solid ${actualBorderColor};
          border-radius: ${actualBorderRadius};
          padding: 12px 16px;
          font-size: ${baseFontSize};
          color: ${actualTextColor};
          outline: none;
          transition: all 0.2s ease;
          box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
          min-height: 100px;
          resize: vertical;
          box-sizing: border-box;
          direction: ${formDirection};
          text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
          font-family: 'Cairo', sans-serif;
        "
      ></textarea>
    </div>
  `;
}

// Cart items renderer
function renderCartItems(field, formStyle, formDirection) {
  const items = field.items || [];
  if (!items.length) return '';
  
  let html = '<div class="codform-cart-items" style="margin-bottom: 20px;">';
  
  items.forEach(item => {
    html += `
      <div class="codform-cart-item" style="
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 12px;
        background: #f9fafb;
        direction: ${formDirection};
      ">
        ${item.image ? `
          <img src="${item.image}" alt="${item.title}" style="
            width: 50px;
            height: 50px;
            border-radius: 6px;
            object-fit: cover;
            margin-${formDirection === 'rtl' ? 'left' : 'right'}: 12px;
          ">
        ` : ''}
        
        <div style="flex: 1;">
          <h4 style="
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px 0;
            color: #1f2937;
            font-family: 'Cairo', sans-serif;
          ">${item.title}</h4>
          <p style="
            font-size: 14px;
            color: #6b7280;
            margin: 0;
            font-family: 'Cairo', sans-serif;
          ">${item.price}</p>
        </div>
        
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-${formDirection === 'rtl' ? 'right' : 'left'}: 12px;
        ">
          <button type="button" onclick="codformUpdateQuantity(this, -1)" style="
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            color: #374151;
          ">-</button>
          
          <span class="codform-qty-display" style="
            min-width: 30px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
            color: #1f2937;
          ">1</span>
          
          <button type="button" onclick="codformUpdateQuantity(this, 1)" style="
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            color: #374151;
          ">+</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// Submit button renderer
function renderSubmitButton(field, formStyle, formDirection) {
  const buttonText = field.label || 'إرسال';
  const buttonStyle = field.style || {};
  const backgroundColor = getStyleValue(buttonStyle, 'backgroundColor', '#9b87f5');
  const textColor = getStyleValue(buttonStyle, 'color', '#ffffff');
  const borderRadius = getStyleValue(buttonStyle, 'borderRadius', '8px');
  const fontSize = getStyleValue(buttonStyle, 'fontSize', '16px');
  
  return `
    <button type="submit" class="codform-submit-btn" style="
      background-color: ${backgroundColor};
      color: ${textColor};
      border: none;
      border-radius: ${borderRadius};
      padding: 14px 28px;
      font-size: ${fontSize};
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
      font-family: 'Cairo', sans-serif;
      direction: ${formDirection};
    " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
      ${buttonText}
    </button>
  `;
}

// WhatsApp button renderer
function renderWhatsAppButton(field, formStyle, formDirection) {
  const buttonText = field.label || 'إرسال عبر واتساب';
  const whatsappNumber = field.whatsappNumber || '';
  const buttonStyle = field.style || {};
  const backgroundColor = getStyleValue(buttonStyle, 'backgroundColor', '#25d366');
  const textColor = getStyleValue(buttonStyle, 'color', '#ffffff');
  const borderRadius = getStyleValue(buttonStyle, 'borderRadius', '8px');
  const fontSize = getStyleValue(buttonStyle, 'fontSize', '16px');
  
  return `
    <button type="button" onclick="sendToWhatsApp('${whatsappNumber}')" style="
      background-color: ${backgroundColor};
      color: ${textColor};
      border: none;
      border-radius: ${borderRadius};
      padding: 14px 28px;
      font-size: ${fontSize};
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 12px;
      transition: all 0.2s ease;
      font-family: 'Cairo', sans-serif;
      direction: ${formDirection};
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
      📱 ${buttonText}
    </button>
  `;
}

// WhatsApp sending function
window.sendToWhatsApp = function(phoneNumber) {
  const form = document.querySelector('form');
  if (!form) return;
  
  const formInputs = form.querySelectorAll('input, textarea, select');
  let message = 'طلب جديد من الموقع:\\n\\n';
  
  formInputs.forEach(input => {
    if (input.value && (input.name || input.id)) {
      const fieldName = input.name || input.id;
      message += `${fieldName}: ${input.value}\\n`;
    }
  });
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};
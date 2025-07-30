/* ===============================================================================
   CODFORM FIELD RENDERING - Field rendering functions
   =============================================================================== */

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
  
  // Base styling configuration
  const baseFontSize = getStyleValue(formStyle, 'baseFontSize', '16px');
  const labelStyle = field.style || {};
  const showLabel = getStyleValue(labelStyle, 'showLabel', true);
  const isFloatingLabels = getStyleValue(formStyle, 'floatingLabels', false);
  
  // Label styling
  const labelColor = getStyleValue(labelStyle, 'labelColor', '#333333');
  const labelFontSize = getStyleValue(labelStyle, 'labelFontSize', baseFontSize);
  const labelFontWeight = getStyleValue(labelStyle, 'labelFontWeight', '500');
  
  // Field styling
  const fieldBackgroundColor = '#FFFFFF';
  const fieldBorderColor = getStyleValue(labelStyle, 'borderColor', '#D1D5DB');
  const fieldBorderRadius = '8px';
  const fieldFontSize = baseFontSize;
  const fieldTextColor = '#1F2937';
  const fieldPadding = '12px 16px';
  
  let html = '';
  
  // Form Title Field
  if (field.type === 'form-title') {
    const title = field.label || 'Form Title';
    
    const titleColor = getStyleValue(field.style, 'color', '#000000');
    const titleFontSize = getStyleValue(field.style, 'fontSize', '24px');
    const titleFontWeight = getStyleValue(field.style, 'fontWeight', 'bold');
    const titleTextAlign = getStyleValue(field.style, 'textAlign', 'center');
    const paddingTop = getStyleValue(field.style, 'paddingTop', '0px');
    const paddingBottom = getStyleValue(field.style, 'paddingBottom', '0px');
    const paddingLeft = getStyleValue(field.style, 'paddingLeft', '0px');
    const paddingRight = getStyleValue(field.style, 'paddingRight', '0px');
    
    html = `
      <div class="form-title-field w-full" style="
        color: ${titleColor};
        font-size: ${titleFontSize};
        font-weight: ${titleFontWeight};
        font-family: Cairo, Tajawal, Arial, sans-serif;
        text-align: center;
        margin: 0px;
        line-height: 1.4;
        direction: ${formStyle.formDirection || 'ltr'};
        padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};
        width: 100%;
        display: block;
        background: none;
        border: none;
      ">
        ${title}
      </div>
    `;
  }
  
  return html;
}

// Make function globally available
window.renderField = renderField;
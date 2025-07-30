/* ===============================================================================
   CODFORM FIELD RENDERER - Complete field rendering functions
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
  
  // Note: This is the first step - more field types will be added here
  // as we continue splitting the large file
  
  return html;
}

// Helper function for icon generation (will be moved to separate file later)
function getIconSvg(iconName, color = '#9b87f5') {
  if (!iconName || iconName === 'none') return '';
  
  const strokeStyle = `fill: none; stroke: ${color}; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; width: 20px; height: 20px;`;
  const filledStyle = `fill: ${color}; width: 20px; height: 20px;`;
  
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
    default:
      svgResult = `<svg xmlns="http://www.w3.org/2000/svg" style="${strokeStyle}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
  
  return svgResult;
}

// Make functions globally available
window.renderField = renderField;
window.getIconSvg = getIconSvg;
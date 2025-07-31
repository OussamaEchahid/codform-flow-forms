/* ===============================================================================
   CODFORM WHATSAPP FIELD COMPONENT
   =============================================================================== */

function renderWhatsAppField(field, formStyle) {
  if (!field || field.type !== 'whatsapp') return '';
  
  const fieldStyle = field.style || {};
  const language = getLanguage();
  
  // Get WhatsApp number from the field
  const whatsappNumber = field.whatsappNumber || '';
  
  // Default message
  const message = field.message || '';
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  
  // Determine button radius based on style
  let buttonRadius = fieldStyle.borderRadius || '8px';
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  }
  
  // Animation classes
  const animationClass = fieldStyle.animation && typeof fieldStyle.animation === 'string' && fieldStyle.animation !== 'none' 
    ? `animate-${fieldStyle.animation}` 
    : '';
  
  // Icon HTML - using WhatsApp icon
  const iconHtml = fieldStyle.showIcon !== false ? getWhatsAppIcon(fieldStyle.iconColor || fieldStyle.color || 'white') : '';
  
  const buttonStyle = `
    background-color: ${fieldStyle.backgroundColor || '#25D366'};
    color: ${fieldStyle.color || 'white'};
    font-size: ${fieldStyle.fontSize || formStyle.fontSize || '18px'};
    font-weight: ${fieldStyle.fontWeight || '600'};
    font-family: ${fieldStyle.fontFamily || 'Cairo, sans-serif'};
    border-radius: ${buttonRadius};
    text-decoration: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: ${fieldStyle.paddingY || '14px'} 20px;
    width: 100%;
    border: ${fieldStyle.borderWidth && parseInt(fieldStyle.borderWidth) > 0 
      ? `${fieldStyle.borderWidth} solid ${fieldStyle.borderColor || '#000000'}`
      : 'none'};
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 14px;
    margin-bottom: 8px;
    text-align: center;
  `;
  
  const buttonLabel = field.label || (language === 'ar' ? 'تواصل عبر واتساب' : 'Contact via WhatsApp');
  
  let html = `<div style="margin-bottom: 16px;">`;
  html += `<a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" 
           class="codform-whatsapp-button ${animationClass}" 
           style="${buttonStyle}" 
           data-button-type="whatsapp" 
           data-whatsapp-number="${whatsappNumber}">`;
  html += iconHtml;
  html += buttonLabel;
  html += `</a>`;
  html += `</div>`;
  
  return html;
}

// WhatsApp icon function
function getWhatsAppIcon(color = 'white') {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.51 3.415" fill="${color}"/>
  </svg>`;
}

// Helper function to get language
function getLanguage() {
  return document.documentElement.lang === 'ar' || 
         document.body.classList.contains('rtl') || 
         window.Shopify?.locale === 'ar' ? 'ar' : 'en';
}

// Make function globally available
window.renderWhatsAppField = renderWhatsAppField;
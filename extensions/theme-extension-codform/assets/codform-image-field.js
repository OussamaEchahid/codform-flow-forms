/* ===============================================================================
   CODFORM IMAGE FIELD COMPONENT
   =============================================================================== */

function renderImageField(field, formStyle) {
  if (!field || field.type !== 'image') return '';
  
  const fieldStyle = field.style || {};
  
  // Use image source or default to the trust badges image
  const imageSrc = field.src || '/lovable-uploads/9e1cd769-7976-41fc-a2a0-189049772982.png';
  const imageAlt = field.alt || (getLanguage() === 'ar' ? 'صورة' : 'Image');
  
  // Get width from field or default to 100%
  const imageWidth = typeof field.width === 'string' ? 
    (field.width.includes('%') ? field.width : `${field.width}%`) : 
    (field.width ? `${field.width}%` : '100%');
  
  // Set border radius for the image
  const imageBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '8px';
  
  // Get alignment from field style
  const alignment = fieldStyle.textAlign || 'center';
  
  const containerStyle = `
    max-width: 100%;
    width: ${imageWidth};
    margin: ${alignment === 'center' ? '0 auto' : 
             alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0'};
    border-radius: ${imageBorderRadius};
    text-align: ${alignment};
    overflow: hidden;
    margin-bottom: 16px;
  `;
  
  const imageStyle = `
    width: 100%;
    height: auto;
    object-fit: cover;
    display: block;
  `;
  
  let html = `<div style="${containerStyle}">`;
  html += `<img src="${imageSrc}" alt="${imageAlt}" style="${imageStyle}" />`;
  html += `</div>`;
  
  if (field.helpText) {
    html += `<p style="margin-top: 8px; font-size: 14px; color: #6b7280;">${field.helpText}</p>`;
  }
  
  return html;
}

// Helper function to get language
function getLanguage() {
  return document.documentElement.lang === 'ar' || 
         document.body.classList.contains('rtl') || 
         window.Shopify?.locale === 'ar' ? 'ar' : 'en';
}

// Make function globally available
window.renderImageField = renderImageField;
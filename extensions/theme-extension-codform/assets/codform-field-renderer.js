
/**
 * CODFORM Field Renderer - Enhanced
 * Handles rendering of all form field types with proper styling and Padding Y support
 */

(function() {
  'use strict';

  // Global field renderer function
  function renderField(field, formStyle, isPreview = false) {
    if (!field || !field.type) {
      console.error('Field is invalid:', field);
      return '';
    }

    const fieldStyle = field.style || {};
    const fieldId = field.id || `field_${Date.now()}`;
    
    // Enhanced Padding Y calculation - ensuring proper application
    const getPaddingY = () => {
      let paddingY = fieldStyle.paddingY || formStyle.paddingY || '12px';
      
      // Convert to numeric value for consistency
      const numericValue = parseInt(paddingY.replace(/[^0-9]/g, ''), 10) || 12;
      
      // Ensure minimum and maximum values
      const finalPadding = Math.max(6, Math.min(numericValue, 60));
      
      return `${finalPadding}px`;
    };

    // Enhanced input styling with proper Padding Y
    const getInputStyles = () => {
      const paddingY = getPaddingY();
      const borderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '8px';
      const borderColor = fieldStyle.borderColor || formStyle.borderColor || '#d1d5db';
      const backgroundColor = fieldStyle.backgroundColor || '#ffffff';
      const fontSize = fieldStyle.fontSize || formStyle.fontSize || '16px';
      
      return `
        width: 100%;
        padding: ${paddingY} 16px;
        border: 1px solid ${borderColor};
        border-radius: ${borderRadius};
        background-color: ${backgroundColor};
        font-size: ${fontSize};
        font-family: 'Cairo', 'Tajawal', Arial, sans-serif;
        color: #374151;
        outline: none;
        transition: all 0.2s ease;
      `.replace(/\s+/g, ' ').trim();
    };

    // Enhanced label styling
    const getLabelStyles = () => {
      const labelColor = fieldStyle.labelColor || '#374151';
      const labelFontSize = fieldStyle.labelFontSize || '14px';
      const labelFontWeight = fieldStyle.labelFontWeight || '500';
      
      return `
        display: block;
        margin-bottom: 8px;
        color: ${labelColor};
        font-size: ${labelFontSize};
        font-weight: ${labelFontWeight};
        font-family: 'Cairo', 'Tajawal', Arial, sans-serif;
      `.replace(/\s+/g, ' ').trim();
    };

    // Icon rendering with proper matching to preview
    const renderIcon = () => {
      if (!field.icon || field.icon === 'none') return '';
      if (fieldStyle.showIcon === false) return '';
      
      const iconColor = fieldStyle.iconColor || '#6b7280';
      const iconSvg = window.getIconSvg ? window.getIconSvg(field.icon, iconColor) : '';
      
      if (!iconSvg) return '';
      
      return `
        <div class="field-icon" style="
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 2;
        ">
          ${iconSvg}
        </div>
      `;
    };

    let html = '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        const hasIcon = field.icon && field.icon !== 'none' && fieldStyle.showIcon !== false;
        const paddingLeft = hasIcon ? '48px' : '16px';
        
        html = `
          <div class="form-field" style="margin-bottom: 20px; position: relative;">
            ${field.label && !fieldStyle.hideLabel ? `
              <label style="${getLabelStyles()}">${field.label}${field.required ? ' <span style="color: #ef4444;">*</span>' : ''}</label>
            ` : ''}
            <div style="position: relative;">
              ${hasIcon ? renderIcon() : ''}
              <input
                type="${field.type === 'phone' ? 'tel' : field.type}"
                name="${fieldId}"
                id="${fieldId}"
                placeholder="${field.placeholder || field.label || ''}"
                ${field.required ? 'required' : ''}
                style="${getInputStyles().replace('padding: ' + getPaddingY() + ' 16px', `padding: ${getPaddingY()} ${paddingLeft} ${getPaddingY()} 16px`)}"
              />
            </div>
            ${field.helpText ? `<div style="margin-top: 4px; font-size: 12px; color: #6b7280;">${field.helpText}</div>` : ''}
          </div>
        `;
        break;

      case 'textarea':
        const textareaRows = field.rows || 4;
        html = `
          <div class="form-field" style="margin-bottom: 20px;">
            ${field.label && !fieldStyle.hideLabel ? `
              <label style="${getLabelStyles()}">${field.label}${field.required ? ' <span style="color: #ef4444;">*</span>' : ''}</label>
            ` : ''}
            <textarea
              name="${fieldId}"
              id="${fieldId}"
              rows="${textareaRows}"
              placeholder="${field.placeholder || field.label || ''}"
              ${field.required ? 'required' : ''}
              style="${getInputStyles()}"
            ></textarea>
            ${field.helpText ? `<div style="margin-top: 4px; font-size: 12px; color: #6b7280;">${field.helpText}</div>` : ''}
          </div>
        `;
        break;

      case 'submit':
        const submitPaddingY = fieldStyle.paddingY || '12px';
        const submitBgColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
        const submitColor = fieldStyle.color || '#ffffff';
        const submitFontSize = fieldStyle.fontSize || '16px';
        const submitFontWeight = fieldStyle.fontWeight || '700';
        const submitBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '8px';
        
        // Enhanced submit button icon matching
        const submitHasIcon = field.icon && field.icon !== 'none' && fieldStyle.showIcon !== false;
        const submitIconPosition = fieldStyle.iconPosition || 'left';
        
        let submitIconHtml = '';
        if (submitHasIcon) {
          const submitIconColor = fieldStyle.iconColor || submitColor;
          const submitIconSvg = window.getIconSvg ? window.getIconSvg(field.icon, submitIconColor) : '';
          if (submitIconSvg) {
            submitIconHtml = `
              <span style="
                display: inline-flex;
                align-items: center;
                ${submitIconPosition === 'right' ? 'margin-left: 8px;' : 'margin-right: 8px;'}
              ">
                ${submitIconSvg}
              </span>
            `;
          }
        }

        html = `
          <div class="form-field" style="margin-bottom: 20px;">
            <button
              type="submit"
              style="
                width: 100%;
                padding: ${submitPaddingY} 24px;
                background-color: ${submitBgColor};
                color: ${submitColor};
                font-size: ${submitFontSize};
                font-weight: ${submitFontWeight};
                font-family: 'Cairo', 'Tajawal', Arial, sans-serif;
                border: none;
                border-radius: ${submitBorderRadius};
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s ease;
              "
              onmouseover="this.style.opacity='0.9'"
              onmouseout="this.style.opacity='1'"
            >
              ${submitIconPosition === 'left' ? submitIconHtml : ''}
              ${field.label || 'إرسال الطلب'}
              ${submitIconPosition === 'right' ? submitIconHtml : ''}
            </button>
          </div>
        `;
        break;

      default:
        // Handle other field types without modification
        html = `
          <div class="form-field" style="margin-bottom: 20px;">
            <div style="padding: 12px; background-color: #f3f4f6; border-radius: 8px; font-family: 'Cairo', 'Tajawal', Arial, sans-serif;">
              ${field.type}: ${field.label || 'Untitled Field'}
            </div>
          </div>
        `;
        break;
    }

    return html;
  }

  // Make function globally available
  window.renderField = renderField;

})();

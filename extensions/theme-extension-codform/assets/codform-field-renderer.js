/**
 * CODFORM FIELD RENDERER
 * دوال رسم الحقول منفصلة عن الملف الرئيسي
 */

(function() {
  'use strict';

  // دالة مساعدة للحصول على قيمة من الستايل
  function getStyleValue(style, property, fallback) {
    if (!style || typeof style !== 'object') return fallback;
    return style[property] || fallback;
  }

  // دالة رسم حقل العنوان
  function renderFormTitleField(field, formStyle) {
    const title = field.label || 'Form Title';
    const titleColor = getStyleValue(field.style, 'color', '#000000');
    const titleFontSize = getStyleValue(field.style, 'fontSize', '24px');
    const titleFontWeight = getStyleValue(field.style, 'fontWeight', 'bold');
    const paddingTop = getStyleValue(field.style, 'paddingTop', '0px');
    const paddingBottom = getStyleValue(field.style, 'paddingBottom', '0px');
    const paddingLeft = getStyleValue(field.style, 'paddingLeft', '0px');
    const paddingRight = getStyleValue(field.style, 'paddingRight', '0px');
    
    return `
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

  // دالة رسم حقول النص
  function renderTextInputField(field, formStyle, formDirection, isFloatingLabels) {
    const label = field.label || 'Text Field';
    const placeholder = field.placeholder || '';
    const required = field.required || false;
    const fieldId = field.id || 'field-' + Math.random().toString(36).substr(2, 9);
    
    let inputType = 'text';
    if (field.type === 'email') inputType = 'email';
    if (field.type === 'phone') inputType = 'tel';
    
    const fieldStyle = field.style || {};
    const baseFontSize = formDirection === 'rtl' ? '13px' : getStyleValue(formStyle, 'baseFontSize', '16px');
    const defaultLabelSize = formDirection === 'rtl' ? '15px' : '16px';
    
    // تجميع خصائص الستايل مع padding ثابت
    const styles = {
      labelColor: getStyleValue(fieldStyle, 'labelColor', '#333333'),
      labelFontSize: getStyleValue(fieldStyle, 'labelFontSize', defaultLabelSize),
      labelWeight: getStyleValue(fieldStyle, 'labelFontWeight', '500'),
      showLabel: fieldStyle.showLabel !== undefined ? fieldStyle.showLabel : true,
      textColor: getStyleValue(fieldStyle, 'color', 'rgb(31, 41, 55)'),
      borderColor: getStyleValue(fieldStyle, 'borderColor', getStyleValue(formStyle, 'fieldBorderColor', 'rgb(209, 213, 219)')),
      borderWidth: getStyleValue(fieldStyle, 'borderWidth', getStyleValue(formStyle, 'fieldBorderWidth', '1px')),
      fontSize: getStyleValue(fieldStyle, 'fontSize', baseFontSize),
      fontFamily: getStyleValue(fieldStyle, 'fontFamily', 'inherit'),
      borderRadius: getStyleValue(fieldStyle, 'borderRadius', getStyleValue(formStyle, 'fieldBorderRadius', '8px')),
      placeholder: getStyleValue(fieldStyle, 'placeholder', placeholder),
      focusBorderColor: getStyleValue(formStyle, 'focusBorderColor', '#3b82f6'),
      // استخدام padding ثابت بدلاً من الحساب الديناميكي
      paddingY: getStyleValue(fieldStyle, 'paddingY', '10px')
    };

    // أيقونة الحقل
    const actualIcon = field.icon || field.style?.icon;
    const hasIcon = actualIcon && actualIcon !== 'none' && actualIcon !== '';
    const showIcon = getStyleValue(fieldStyle, 'showIcon', hasIcon) && getStyleValue(fieldStyle, 'showIconInPreview', hasIcon);
    
    let iconHtml = '';
    if (showIcon && hasIcon) {
      const iconPosition = formDirection === 'rtl' ? 'right' : 'left';
      const iconColor = getStyleValue(fieldStyle, 'iconColor', '#6b7280');
      const iconSvg = window.getIconSvg ? window.getIconSvg(actualIcon, iconColor) : '';
      iconHtml = `
        <div style="
          position: absolute;
          ${iconPosition}: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: ${iconColor};
          pointer-events: none;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${iconSvg}
        </div>
      `;
    }

    const paddingLeft = formDirection === 'rtl' ? '12px' : (showIcon && hasIcon ? '40px' : '12px');
    const paddingRight = formDirection === 'rtl' ? (showIcon && hasIcon ? '40px' : '12px') : '12px';

    return `
      <div class="codform-field-wrapper" style="margin-bottom: 4px; direction: ${formDirection};">
        ${styles.showLabel && !isFloatingLabels ? `
          <label for="${fieldId}" style="
            display: block;
            color: ${styles.labelColor};
            font-size: ${styles.labelFontSize};
            font-weight: 500;
            margin-bottom: 4px;
            font-family: 'Cairo', sans-serif;
          ">
            ${label}${required ? '<span style="color: #EF4444; margin-left: 4px;">*</span>' : ''}
          </label>
        ` : ''}
        
        <div style="position: relative;">
          ${iconHtml}
          ${isFloatingLabels && styles.showLabel ? `
            <label for="${fieldId}" style="
              position: absolute;
              left: ${formDirection === 'rtl' ? 'auto' : (showIcon && hasIcon ? '40px' : '12px')};
              right: ${formDirection === 'rtl' ? (showIcon && hasIcon ? '40px' : '12px') : 'auto'};
              top: 50%;
              transform: translateY(-50%);
              color: #9CA3AF;
              font-size: ${styles.labelFontSize};
              font-family: 'Cairo', sans-serif;
              pointer-events: none;
              transition: all 0.2s ease;
              background: white;
              padding: 0 4px;
              z-index: 10;
            " class="floating-label">
              ${label}${required ? '<span style="color: #EF4444; margin-left: 4px;">*</span>' : ''}
            </label>
          ` : ''}
          <input
            type="${inputType}"
            id="${fieldId}"
            name="${fieldId}"
            placeholder="${isFloatingLabels ? '' : styles.placeholder}"
            ${required ? 'required' : ''}
            style="
              width: 100%;
              background-color: #FFFFFF;
              border: ${styles.borderWidth} solid ${styles.borderColor};
              border-radius: ${styles.borderRadius};
              padding-top: ${styles.paddingY};
              padding-bottom: ${styles.paddingY};
              padding-left: ${paddingLeft};
              padding-right: ${paddingRight};
              font-size: ${styles.fontSize};
              color: ${styles.textColor};
              font-family: ${styles.fontFamily};
              outline: none;
              transition: all 0.2s ease;
              box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
              min-height: 44px;
              box-sizing: border-box;
              direction: ${formDirection};
              text-align: ${formDirection === 'rtl' ? 'right' : 'left'};
            "
            onfocus="this.style.borderColor='${styles.focusBorderColor}'; this.style.boxShadow='0 0 0 3px ${styles.focusBorderColor}20'"
            onblur="this.style.borderColor='${styles.borderColor}'; this.style.boxShadow='rgba(0, 0, 0, 0.05) 0px 1px 2px'"
          />
        </div>
        ${field.helpText ? `
          <p style="
            margin-top: 6px;
            font-size: 14px;
            color: #6B7280;
            font-family: 'Cairo', inherit;
          ">${field.helpText}</p>
        ` : ''}
      </div>
    `;
  }

  // تصدير الدوال
  window.CodformFieldRenderer = {
    renderFormTitleField: renderFormTitleField,
    renderTextInputField: renderTextInputField,
    getStyleValue: getStyleValue
  };

  console.log('📋 Codform Field Renderer loaded');

})();
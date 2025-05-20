
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface FormTitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
    // Add new style properties
    borderColor?: string;
    borderWidth?: string;
    backgroundColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    formGap?: string;
    formDirection?: 'ltr' | 'rtl';
    floatingLabels?: boolean;
  };
}

const FormTitleField: React.FC<FormTitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  
  // Extract style properties or use defaults, prioritizing field-specific styles
  const styles = field.style || {};
  
  // Validate title and description visibility
  const showTitle = styles.showTitle !== undefined ? !!styles.showTitle : true;
  const showDescription = styles.showDescription !== undefined ? !!styles.showDescription : true;
  
  // If both title and description are hidden, don't render anything
  if (showTitle === false && showDescription === false) {
    return null;
  }
  
  // Ensure valid hex color format for backgroundColor
  const validateColorFormat = (color: string | undefined): string | undefined => {
    if (!color) return undefined;
    
    // Simple hex format validation (allows both short and long form hex)
    const hexPattern = /^#([0-9A-F]{3}){1,2}$/i;
    if (hexPattern.test(color)) {
      return color;
    }
    
    // Handle RGB format
    const rgbPattern = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
    const rgbMatch = color.match(rgbPattern);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      
      // Convert to hex
      return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }
    
    // If RGB format is detected or otherwise invalid, return the primaryColor or default
    return formStyle.primaryColor || '#9b87f5';
  };
  
  // IMPORTANT: First check field's specific backgroundColor, THEN fall back to primaryColor
  const backgroundColor = validateColorFormat(styles.backgroundColor) || 
                          validateColorFormat(formStyle.primaryColor) || 
                          '#9b87f5';
  
  // Extract all style properties with fallbacks
  const {
    color = '#ffffff',
    textAlign = language === 'ar' ? 'right' : 'center',
    fontSize = '24px',
    fontWeight = 'bold',
    descriptionColor = 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize = '14px',
    borderRadius = styles.borderRadius || formStyle.borderRadius || '8px',
    paddingY = styles.paddingY || '16px',
    borderColor = styles.borderColor || formStyle.borderColor || '#e2e8f0',
    borderWidth = styles.borderWidth || formStyle.borderWidth || '1px'
  } = styles;

  // Ensure hex colors are properly formatted
  const safeColor = validateColorFormat(color as string) || '#ffffff';
  const safeDescColor = validateColorFormat(descriptionColor as string) || 'rgba(255, 255, 255, 0.9)';

  // Determine text alignment based on formStyle.formDirection, field style, and language
  const effectiveTextAlign = 
    styles.textAlign || 
    (formStyle.formDirection === 'rtl' ? 'right' : 
     formStyle.formDirection === 'ltr' ? 'left' : 
     language === 'ar' ? 'right' : 'center');

  // Store styling properties in data attributes for debugging
  const dataAttributes = {
    'data-field-type': 'form-title',
    'data-field-id': field.id,
    'data-bg-color': backgroundColor,
    'data-show-title': showTitle ? 'true' : 'false',
    'data-show-desc': showDescription ? 'true' : 'false',
    'data-border-radius': borderRadius,
    'data-padding-y': paddingY,
    'data-border-color': borderColor,
    'data-border-width': borderWidth
  };

  return (
    <div 
      className="form-title-container mb-6" 
      style={{
        backgroundColor,
        borderRadius,
        padding: `${paddingY} 16px`,
        marginTop: '0',
        textAlign: effectiveTextAlign as any,
        border: `${borderWidth} solid ${borderColor}`,
      }}
      {...dataAttributes}
    >
      {showTitle && (
        <h1 
          style={{
            color: safeColor,
            fontSize,
            fontWeight,
            margin: '0',
            padding: '0'
          }}
        >
          {field.label || ''}
        </h1>
      )}
      
      {showDescription && field.helpText && (
        <p 
          style={{
            color: safeDescColor,
            fontSize: descriptionFontSize,
            margin: (showTitle ? '8px 0 0 0' : '0'),
            padding: '0'
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

// Use React.memo with custom comparison to prevent unnecessary re-renders
export default React.memo(FormTitleField, (prevProps, nextProps) => {
  // Only re-render if critical properties have changed
  const prevField = prevProps.field;
  const nextField = nextProps.field;
  const prevStyle = prevProps.formStyle;
  const nextStyle = nextProps.formStyle;
  
  // Deep compare the style objects
  const prevFieldStyle = JSON.stringify(prevField.style || {});
  const nextFieldStyle = JSON.stringify(nextField.style || {});
  
  // Also compare the new formStyle properties that could affect rendering
  return (
    prevField.id === nextField.id &&
    prevField.label === nextField.label &&
    prevField.helpText === nextField.helpText &&
    prevFieldStyle === nextFieldStyle &&
    prevStyle.primaryColor === nextStyle.primaryColor &&
    prevStyle.borderRadius === nextStyle.borderRadius &&
    prevStyle.borderColor === nextStyle.borderColor &&
    prevStyle.borderWidth === nextStyle.borderWidth &&
    prevStyle.formDirection === nextStyle.formDirection
  );
});

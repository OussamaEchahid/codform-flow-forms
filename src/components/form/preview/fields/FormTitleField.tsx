
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
  
  // Extract style properties with default values, prioritizing field-specific styles
  const styles = field.style || {};
  
  // Check whether to show title and description
  const showTitle = styles.showTitle !== undefined ? !!styles.showTitle : true;
  const showDescription = styles.showDescription !== undefined ? !!styles.showDescription : true;
  
  // If both title and description are hidden, don't render anything
  if (showTitle === false && showDescription === false) {
    return null;
  }
  
  // CRITICAL: Title background color is COMPLETELY INDEPENDENT from form style
  // Always prioritize field's own backgroundColor and NEVER use formStyle.backgroundColor
  const titleBackgroundColor = styles.backgroundColor || formStyle.primaryColor || '#9b87f5';

  // Extract all style properties with defaults
  const {
    color = '#ffffff',
    fontSize = '24px',
    fontWeight = 'bold',
    descriptionColor = 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize = '14px',
    borderRadius = styles.borderRadius || formStyle.borderRadius || '8px',
    paddingY = styles.paddingY || '16px',
    textAlign: styleTextAlign,
  } = styles;

  // Determine text alignment based on formStyle.formDirection, field style, and language
  let effectiveTextAlign;
  
  // If the field has an explicit textAlign, use it first
  if (styleTextAlign) {
    effectiveTextAlign = styleTextAlign;
  } 
  // Otherwise, use form direction if available
  else if (formStyle.formDirection) {
    effectiveTextAlign = formStyle.formDirection === 'rtl' ? 'right' : 'left';
  }
  // Default based on language
  else {
    effectiveTextAlign = language === 'ar' ? 'right' : 'center';
  }

  // Set the correct right-to-left/left-to-right direction based on form settings
  const direction = formStyle.formDirection || (language === 'ar' ? 'rtl' : 'ltr');

  return (
    <div 
      className="form-title-container mb-6" 
      style={{
        backgroundColor: titleBackgroundColor, 
        borderRadius,
        padding: `${paddingY} 16px`,
        marginTop: '0',
        textAlign: effectiveTextAlign as any,
        border: 'none', 
        overflow: 'hidden',
        direction,
        boxShadow: styles.boxShadow || 'none',
        width: '100%',
      }}
      dir={direction}
      data-form-title="true"
      data-text-align={effectiveTextAlign}
      data-direction={direction}
      data-title-bg-color={titleBackgroundColor}
      data-show-title={showTitle ? 'true' : 'false'}
      data-show-description={showDescription ? 'true' : 'false'}
    >
      {showTitle && (
        <h1 
          style={{
            color: color,
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
            color: descriptionColor,
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

// Performance improvement: Update React.memo comparison to prevent field duplication issue
export default React.memo(FormTitleField, (prevProps, nextProps) => {
  const prevField = prevProps.field;
  const nextField = nextProps.field;

  // Check ID match
  if (prevField.id !== nextField.id) return false;
  
  // Compare basic field properties
  if (prevField.label !== nextField.label) return false;
  if (prevField.helpText !== nextField.helpText) return false;
  
  // Deep comparison for style objects to catch all style changes
  const prevStyle = JSON.stringify(prevField.style || {});
  const nextStyle = JSON.stringify(nextField.style || {});
  if (prevStyle !== nextStyle) return false;
  
  // Check for form direction changes that affect text alignment
  if (prevProps.formStyle.formDirection !== nextProps.formStyle.formDirection) return false;

  // Deep comparison for form style objects that might affect title display
  const relevantPrevFormStyle = JSON.stringify({
    borderRadius: prevProps.formStyle.borderRadius,
    primaryColor: prevProps.formStyle.primaryColor,
  });
  
  const relevantNextFormStyle = JSON.stringify({
    borderRadius: nextProps.formStyle.borderRadius,
    primaryColor: nextProps.formStyle.primaryColor,
  });
  
  if (relevantPrevFormStyle !== relevantNextFormStyle) return false;
  
  // If we made it here, consider components equal (no need to re-render)
  return true;
});

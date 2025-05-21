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
  
  // Extract style properties or use defaults, prioritizing field-specific styles
  const styles = field.style || {};
  
  // Validate title and description visibility
  const showTitle = styles.showTitle !== undefined ? !!styles.showTitle : true;
  const showDescription = styles.showDescription !== undefined ? !!styles.showDescription : true;
  
  // If both title and description are hidden, don't render anything
  if (showTitle === false && showDescription === false) {
    return null;
  }
  
  // Only use the field's own backgroundColor, NOT related to the form's primaryColor
  // This prevents the bug where title background disappears in the store
  const titleBackgroundColor = styles.backgroundColor || '#9b87f5'; 

  // Extract all style properties with fallbacks
  const {
    color = '#ffffff',
    fontSize = '24px',
    fontWeight = 'bold',
    descriptionColor = 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize = '14px',
    borderRadius = styles.borderRadius || formStyle.borderRadius || '8px',
    paddingY = styles.paddingY || '16px',
  } = styles;

  // Determine text alignment based on formStyle.formDirection, field style, and language
  // Fix: Properly apply text alignment based on the hierarchy of settings
  let effectiveTextAlign;
  
  // If the field has explicit text alignment, use that first
  if (styles.textAlign) {
    effectiveTextAlign = styles.textAlign;
  } 
  // Otherwise, use form direction if available
  else if (formStyle.formDirection) {
    effectiveTextAlign = formStyle.formDirection === 'rtl' ? 'right' : 'left';
  }
  // Default based on language
  else {
    effectiveTextAlign = language === 'ar' ? 'right' : 'center';
  }

  // Set the correct RTL/LTR direction based on form settings
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
        direction: direction,
      }}
      dir={direction}
      data-form-title="true"
      data-text-align={effectiveTextAlign}
      data-direction={direction}
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

// Fix: Update memo comparison to prevent field duplication issue
// Use proper deep comparison for style objects
export default React.memo(FormTitleField, (prevProps, nextProps) => {
  const prevField = prevProps.field;
  const nextField = nextProps.field;

  // Check if IDs match
  if (prevField.id !== nextField.id) return false;
  
  // Compare basic field properties
  if (prevField.label !== nextField.label) return false;
  if (prevField.helpText !== nextField.helpText) return false;
  
  // Deep compare style objects to capture all style changes
  const prevStyle = JSON.stringify(prevField.style || {});
  const nextStyle = JSON.stringify(nextField.style || {});
  if (prevStyle !== nextStyle) return false;
  
  // Check form direction changes which affect text alignment
  if (prevProps.formStyle.formDirection !== nextProps.formStyle.formDirection) return false;
  
  // If we reach here, consider the components equal (no re-render needed)
  return true;
});


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
  
  // CRITICAL: Use field's own backgroundColor for title background
  // If not defined, fall back to formStyle.primaryColor (button color)
  // This ensures complete separation between title background and form background
  const titleBackgroundColor = styles.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
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
  } = styles;

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
    'data-bg-color': titleBackgroundColor,
    'data-show-title': showTitle ? 'true' : 'false',
    'data-show-desc': showDescription ? 'true' : 'false',
    'data-border-radius': borderRadius,
    'data-padding-y': paddingY
  };

  return (
    <div 
      className="form-title-container mb-6" 
      style={{
        backgroundColor: titleBackgroundColor, // Use the field's specific background color
        borderRadius,
        padding: `${paddingY} 16px`,
        marginTop: '0',
        textAlign: effectiveTextAlign as any,
        // IMPORTANT: Remove border style to prevent form border from affecting title
        border: 'none', // This ensures the form's border is not applied to the title
        overflow: 'hidden' // Ensure rounded corners work correctly
      }}
      {...dataAttributes}
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

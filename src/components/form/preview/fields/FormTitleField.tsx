
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
  const titleBackgroundColor = styles.backgroundColor || '#9b87f5'; 

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
      }}
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

// Simplified comparison function that doesn't reference global form style properties
export default React.memo(FormTitleField, (prevProps, nextProps) => {
  const prevField = prevProps.field;
  const nextField = nextProps.field;

  // Deep compare only the field style objects, not the form style
  const prevFieldStyle = JSON.stringify(prevField.style || {});
  const nextFieldStyle = JSON.stringify(nextField.style || {});
  
  return (
    prevField.id === nextField.id &&
    prevField.label === nextField.label &&
    prevField.helpText === nextField.helpText &&
    prevFieldStyle === nextFieldStyle
  );
});


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
  };
}

const FormTitleField: React.FC<FormTitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  
  // Extract style properties or use defaults, prioritizing field-specific styles
  const styles = field.style || {};
  
  // IMPORTANT: First check field's specific backgroundColor, THEN fall back to primaryColor
  const backgroundColor = styles.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // Extract all other style properties with fallbacks
  const {
    color = '#ffffff',
    textAlign = language === 'ar' ? 'right' : 'center',
    fontSize = '24px',
    fontWeight = 'bold',
    descriptionColor = 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize = '14px',
    borderRadius = formStyle.borderRadius || '8px',
    paddingY = '16px',
    // Default showTitle and showDescription to true if not specified
    showTitle = true,
    showDescription = true,
    borderColor,
    borderWidth
  } = styles;

  // If both title and description are hidden, don't render anything
  if (showTitle === false && showDescription === false) {
    return null;
  }
  
  // Store the background color in a data attribute for debugging
  const dataAttributes = {
    'data-field-type': 'form-title',
    'data-field-id': field.id,
    'data-bg-color': backgroundColor,
  };

  return (
    <div 
      className="form-title-container mb-6" 
      style={{
        backgroundColor,
        borderRadius,
        padding: `${paddingY} 16px`,
        marginTop: '0',
        textAlign: textAlign as any,
        border: borderWidth ? `${borderWidth} solid ${borderColor || 'transparent'}` : undefined,
      }}
      {...dataAttributes}
    >
      {showTitle && (
        <h1 
          style={{
            color,
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
  const prevFieldStyle = JSON.stringify(prevField.style);
  const nextFieldStyle = JSON.stringify(nextField.style);
  
  return (
    prevField.id === nextField.id &&
    prevField.label === nextField.label &&
    prevField.helpText === nextField.helpText &&
    prevFieldStyle === nextFieldStyle &&
    prevStyle.primaryColor === nextStyle.primaryColor &&
    prevStyle.borderRadius === nextStyle.borderRadius
  );
});

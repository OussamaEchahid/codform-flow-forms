
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
  const {
    // Important: Use field's backgroundColor first, then fall back to formStyle
    backgroundColor = styles.backgroundColor || formStyle.primaryColor || '#9b87f5',
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
    showDescription = true
  } = styles;

  // If both title and description are hidden, don't render anything
  if (showTitle === false && showDescription === false) {
    return null;
  }
  
  // Log actual background color being used for debugging
  console.debug('FormTitleField rendered with backgroundColor:', backgroundColor, 
    'Field style:', field.style?.backgroundColor, 
    'Form style:', formStyle.primaryColor);

  return (
    <div 
      className="form-title-container mb-6" 
      style={{
        backgroundColor,
        borderRadius,
        padding: `${paddingY} 16px`,
        marginTop: '0',
        textAlign: textAlign as any
      }}
      data-field-type="form-title"
      data-field-id={field.id}
      data-bg-color={backgroundColor} // For debugging
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

export default React.memo(FormTitleField);

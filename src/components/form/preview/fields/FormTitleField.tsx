
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
  
  // Extract style properties or use defaults
  const styles = field.style || {};
  const {
    backgroundColor = formStyle.primaryColor || '#9b87f5',
    color = '#ffffff',
    textAlign = language === 'ar' ? 'right' : 'center',
    fontSize = '24px',
    fontWeight = 'bold',
    descriptionColor = 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize = '14px',
    borderRadius = formStyle.borderRadius || '8px',
    paddingY = '16px',
    showTitle = true, // Default to true if not specified
    showDescription = true // Default to true if not specified
  } = styles;

  // If both title and description are hidden, don't render anything
  if (!showTitle && !showDescription) {
    return null;
  }

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

export default FormTitleField;

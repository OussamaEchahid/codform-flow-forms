
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface TitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Extract the description from the field itself
  const description = field.helpText || '';
  
  // Get alignment from field style or default based on language
  const alignment = fieldStyle.textAlign || (language === 'ar' ? 'right' : 'left');
  
  // Background styling
  const backgroundStyle = fieldStyle.backgroundColor ? {
    backgroundColor: fieldStyle.backgroundColor,
    padding: '0.75rem',
    borderRadius: formStyle.borderRadius || '0.375rem',
  } : {};
  
  return (
    <div 
      className="mb-4"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={backgroundStyle}
    >
      <h3 
        className="text-lg font-medium"
        style={{
          color: fieldStyle.color || formStyle.primaryColor || 'inherit',
          fontSize: fieldStyle.fontSize || formStyle.fontSize,
          textAlign: alignment,
          fontWeight: fieldStyle.fontWeight || 'medium',
          fontFamily: fieldStyle.fontFamily || 'inherit',
          margin: '0',
        }}
      >
        {field.label}
      </h3>
      {description && (
        <p 
          className="text-sm mt-1"
          style={{
            textAlign: alignment,
            color: fieldStyle.descriptionColor || '#6b7280',
            fontSize: fieldStyle.descriptionFontSize || '0.875rem',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
};

export default TitleField;

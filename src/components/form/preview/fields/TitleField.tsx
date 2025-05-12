
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

// Define valid text alignment options
type TextAlign = 'left' | 'center' | 'right' | 'justify';

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Extract the description from the field itself
  const description = field.helpText || '';
  
  // Get alignment from field style or default based on language
  const defaultAlignment: TextAlign = language === 'ar' ? 'right' : 'left';
  
  // Convert string alignment to TextAlign type with validation
  const getValidAlignment = (align?: string): TextAlign => {
    if (align === 'left' || align === 'center' || align === 'right' || align === 'justify') {
      return align as TextAlign;
    }
    return defaultAlignment;
  };
  
  const alignment = getValidAlignment(fieldStyle.textAlign);
  
  // Background styling
  const backgroundStyle = fieldStyle.backgroundColor ? {
    backgroundColor: fieldStyle.backgroundColor,
    padding: '0.75rem',
    borderRadius: formStyle.borderRadius || '0.375rem',
  } : {};

  // Use larger styling for form-title type
  const isFormTitle = field.type === 'form-title';
  
  return (
    <div 
      className={`mb-4 ${isFormTitle ? 'pt-4 pb-2' : ''}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={backgroundStyle}
    >
      <h3 
        className={isFormTitle ? "text-2xl font-bold" : "text-lg font-medium"}
        style={{
          color: fieldStyle.color || formStyle.primaryColor || 'inherit',
          fontSize: fieldStyle.fontSize || (isFormTitle ? '1.5rem' : formStyle.fontSize),
          textAlign: alignment,
          fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
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

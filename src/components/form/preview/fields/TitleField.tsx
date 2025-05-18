
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
  formDirection?: 'ltr' | 'rtl';
}

const TitleField: React.FC<TitleFieldProps> = ({
  field,
  formStyle,
  formDirection
}) => {
  const { language } = useI18n();
  
  // Ensure we have the correct text direction
  const direction = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Use style from the field or fallback to defaults
  const backgroundColor = field.style?.backgroundColor || '#9b87f5';
  const textColor = field.style?.color || '#ffffff';
  const descriptionColor = field.style?.descriptionColor || '#ffffff';
  const textAlign = field.style?.textAlign || 'center';
  const fontWeight = field.style?.fontWeight || 'bold';
  const fontSize = field.style?.fontSize || '1.5rem';
  const descriptionFontSize = field.style?.descriptionFontSize || '0.875rem';
  const showDescription = field.style?.showDescription !== false;
  
  return (
    <div
      className="form-title-field w-full my-2"
      style={{
        backgroundColor,
        borderRadius: formStyle.borderRadius || '0.5rem',
        padding: '0.75rem',
        direction,
      }}
      dir={direction}
    >
      <h2
        style={{
          color: textColor,
          textAlign: textAlign as any,
          fontWeight: fontWeight as any,
          fontSize,
          margin: 0,
        }}
      >
        {field.label}
      </h2>
      
      {showDescription && field.helpText && (
        <p
          style={{
            color: descriptionColor,
            textAlign: textAlign as any,
            fontSize: descriptionFontSize,
            margin: '0.25rem 0 0 0',
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default TitleField;

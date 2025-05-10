
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface TitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
  };
}

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  const direction = field.direction || (language === 'ar' ? 'rtl' : 'ltr');
  const fontSize = fieldStyle.fontSize || formStyle.fontSize || '1.125rem';
  const alignment = fieldStyle.alignment || (direction === 'rtl' ? 'right' : 'left');
  
  // تحديد حجم الخط بناءً على نوع العنوان
  let titleSize = fontSize;
  if (fieldStyle.titleSize === 'large') {
    titleSize = 'calc(1.5 * ' + fontSize + ')';
  } else if (fieldStyle.titleSize === 'medium') {
    titleSize = 'calc(1.25 * ' + fontSize + ')';
  }
  
  return (
    <div 
      className="mb-4"
      dir={direction}
    >
      <h3 
        className={`font-medium mb-1`}
        style={{
          color: fieldStyle.color || 'inherit',
          fontSize: titleSize,
          fontWeight: fieldStyle.bold ? 'bold' : 'medium',
          textAlign: alignment as any,
          textDecoration: fieldStyle.underline ? 'underline' : 'none',
          fontStyle: fieldStyle.italic ? 'italic' : 'normal',
        }}
      >
        {field.label}
      </h3>
      
      {field.description && (
        <p 
          className="text-gray-600"
          style={{
            fontSize: `calc(0.875 * ${fontSize})`,
            textAlign: alignment as any,
          }}
        >
          {field.description}
        </p>
      )}
    </div>
  );
};

export default TitleField;

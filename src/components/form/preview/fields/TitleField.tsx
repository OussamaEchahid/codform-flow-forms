
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
  
  return (
    <div 
      className="mb-4"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <h3 
        className="text-lg font-medium"
        style={{
          color: fieldStyle.color || 'inherit',
          fontSize: fieldStyle.fontSize || formStyle.fontSize,
          textAlign: language === 'ar' ? 'right' : 'left',
        }}
      >
        {field.label}
      </h3>
      {fieldStyle.description && (
        <p 
          className="text-sm text-gray-600 mt-1"
          style={{
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          {fieldStyle.description}
        </p>
      )}
    </div>
  );
};

export default TitleField;

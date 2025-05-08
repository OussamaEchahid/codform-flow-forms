
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
        }}
      >
        {field.label}
      </h3>
    </div>
  );
};

export default TitleField;

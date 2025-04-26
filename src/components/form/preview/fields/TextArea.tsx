
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface TextAreaProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const TextArea: React.FC<TextAreaProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  return (
    <div className="form-control text-right mb-4">
      <label className="form-label mb-2 block" style={{ color: fieldStyle.color }}>
        {field.label}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <textarea
        placeholder={field.placeholder}
        className="form-input h-24 w-full p-2 border"
        style={{
          backgroundColor: fieldStyle.backgroundColor || 'white',
          color: fieldStyle.color || 'inherit',
          fontSize: fieldStyle.fontSize || formStyle.fontSize,
          borderRadius: fieldStyle.borderRadius || formStyle.borderRadius,
          borderWidth: fieldStyle.borderWidth || '1px',
          borderColor: fieldStyle.borderColor || '#e2e8f0',
        }}
        disabled
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
    </div>
  );
};

export default TextArea;

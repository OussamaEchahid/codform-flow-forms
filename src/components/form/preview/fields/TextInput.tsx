
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface TextInputProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const TextInput: React.FC<TextInputProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Determine input type (text, email, phone, etc)
  const inputType = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text';
  
  return (
    <div className="form-control mb-5">
      <label className="form-label block mb-2 font-medium" style={{ color: fieldStyle.color || '#374151' }}>
        {field.label}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <input
        type={inputType}
        placeholder={field.placeholder || ''}
        className="form-input w-full py-2 px-3 border transition-all duration-200"
        style={{
          backgroundColor: fieldStyle.backgroundColor || 'white',
          color: fieldStyle.color || '#374151',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '1rem',
          borderRadius: fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem',
          borderWidth: fieldStyle.borderWidth || '1px',
          borderColor: fieldStyle.borderColor || '#e2e8f0',
          outline: 'none',
        }}
        disabled={field.disabled}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      {field.helpText && (
        <p className="text-sm text-gray-500 mt-1">
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default TextInput;

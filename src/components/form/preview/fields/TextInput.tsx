
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ensureColor, ensureSize } from '@/lib/utils';

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
  
  // Set default values for border styling
  const inputBorderRadius = ensureSize(fieldStyle.borderRadius) || ensureSize(formStyle.borderRadius) || '0.5rem';
  const inputBorderWidth = ensureSize(fieldStyle.borderWidth) || '1px';
  
  return (
    <div className="mb-4">
      <label 
        htmlFor={field.id} 
        className={`block mb-2 ${field.required ? 'relative pr-2' : ''}`}
        style={{ 
          color: ensureColor(fieldStyle.labelColor) || '#334155',
          fontSize: ensureSize(fieldStyle.labelFontSize) || ensureSize(formStyle.fontSize) || '1rem',
          fontWeight: 500
        }}
      >
        {field.label || (language === 'ar' ? 'حقل نصي' : 'Text field')}
        {field.required && (
          <span className="text-red-500 absolute right-0 top-0">*</span>
        )}
      </label>
      
      <input
        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
        id={field.id}
        placeholder={field.placeholder || ''}
        className="w-full py-2 px-3 bg-white border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
        style={{
          color: ensureColor(fieldStyle.color) || '#1f2937',
          fontSize: ensureSize(fieldStyle.fontSize) || ensureSize(formStyle.fontSize) || '1rem',
          borderColor: ensureColor(fieldStyle.borderColor) || '#d1d5db',
          borderRadius: inputBorderRadius,
          borderWidth: inputBorderWidth,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      />
      
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  );
};

export default TextInput;

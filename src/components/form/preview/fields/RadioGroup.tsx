
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ensureColor, ensureSize } from '@/lib/utils';

interface RadioGroupProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const RadioGroup: React.FC<RadioGroupProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Ensure options are available and have correct format
  const options = Array.isArray(field.options) ? field.options : [];
  
  return (
    <div className="mb-4">
      <label 
        className={`block mb-2 ${field.required ? 'relative pr-2' : ''}`}
        style={{ 
          color: ensureColor(fieldStyle.labelColor) || '#334155',
          fontSize: ensureSize(fieldStyle.labelFontSize) || ensureSize(formStyle.fontSize) || '1rem',
          fontWeight: 500
        }}
      >
        {field.label || (language === 'ar' ? 'اختيار واحد' : 'Single choice')}
        {field.required && (
          <span className="text-red-500 absolute right-0 top-0">*</span>
        )}
      </label>
      
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center">
            <input
              type="radio"
              id={`${field.id}-${index}`}
              name={field.id}
              value={option.value}
              className="mr-2 h-4 w-4 text-blue-600"
              style={{
                borderColor: ensureColor(fieldStyle.borderColor) || '#d1d5db',
                accentColor: ensureColor(fieldStyle.color) || ensureColor(formStyle.primaryColor) || '#9b87f5'
              }}
            />
            <label
              htmlFor={`${field.id}-${index}`}
              style={{
                color: ensureColor(fieldStyle.color) || '#1f2937',
                fontSize: ensureSize(fieldStyle.fontSize) || ensureSize(formStyle.fontSize) || '1rem'
              }}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  );
};

export default RadioGroup;

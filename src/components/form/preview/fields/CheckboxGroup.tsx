
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface CheckboxGroupProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Determine direction based on formDirection prop or language
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Determine label alignment based on direction
  const labelAlignment = textDirection === 'rtl' ? 'right' : 'left';
  
  // Ensure options are available and have correct format
  const options = Array.isArray(field.options) ? field.options : [];
  
  return (
    <div 
      className="mb-4"
      dir={textDirection}
      data-field-type="checkbox"
      data-direction={textDirection}
    >
      <label 
        className={`block mb-2 ${field.required ? 'relative pr-2' : ''}`}
        style={{ 
          color: fieldStyle.labelColor || '#334155',
          fontSize: fieldStyle.labelFontSize || formStyle.fontSize || '1rem',
          fontWeight: 500,
          textAlign: labelAlignment,
          direction: textDirection
        }}
        dir={textDirection}
      >
        {field.label || (language === 'ar' ? 'اختيارات متعددة' : 'Multiple choices')}
        {field.required && (
          <span className="text-red-500 absolute right-0 top-0">*</span>
        )}
      </label>
      
      <div className="space-y-2">
        {options.map((option, index) => (
          <div 
            key={index} 
            className="flex items-center"
            style={{ 
              flexDirection: textDirection === 'rtl' ? 'row-reverse' : 'row',
              justifyContent: textDirection === 'rtl' ? 'flex-end' : 'flex-start'
            }}
          >
            <input
              type="checkbox"
              id={`${field.id}-${index}`}
              name={field.id}
              value={option.value}
              className={textDirection === 'rtl' ? 'ml-2' : 'mr-2'}
              style={{
                borderColor: fieldStyle.borderColor || '#d1d5db',
                accentColor: fieldStyle.color || formStyle.primaryColor || '#9b87f5'
              }}
            />
            <label
              htmlFor={`${field.id}-${index}`}
              style={{
                color: fieldStyle.color || '#1f2937',
                fontSize: fieldStyle.fontSize || formStyle.fontSize || '1rem',
                direction: textDirection,
                textAlign: textDirection === 'rtl' ? 'right' : 'left'
              }}
              dir={textDirection}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      {field.helpText && (
        <p 
          className="mt-1 text-sm text-gray-500"
          style={{
            textAlign: labelAlignment,
            direction: textDirection
          }}
          dir={textDirection}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default CheckboxGroup;

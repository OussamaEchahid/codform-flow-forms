
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
  formDirection?: 'ltr' | 'rtl';
}

const TextArea: React.FC<TextAreaProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Determine direction based on formDirection prop or language
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Set default values for border styling
  const inputBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
  const inputBorderWidth = fieldStyle.borderWidth || '1px';
  
  // Set default rows
  const rows = field.rows || 4;
  
  // Determine label alignment based on direction
  const labelAlignment = textDirection === 'rtl' ? 'right' : 'left';
  
  return (
    <div 
      className={`mb-4`}
      dir={textDirection}
      data-field-type="textarea"
      data-direction={textDirection}
    >
      <label 
        htmlFor={field.id} 
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
        {field.label || (language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes')}
        {field.required && (
          <span className="text-red-500 absolute right-0 top-0">*</span>
        )}
      </label>
      
      <textarea
        id={field.id}
        rows={rows}
        placeholder={field.placeholder || ''}
        className="w-full py-2 px-3 bg-white border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
        style={{
          color: fieldStyle.color || '#1f2937',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '1rem',
          borderColor: fieldStyle.borderColor || '#d1d5db',
          borderRadius: inputBorderRadius,
          borderWidth: inputBorderWidth,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          direction: textDirection,
          textAlign: textDirection === 'rtl' ? 'right' : 'left'
        }}
        dir={textDirection}
      />
      
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

export default TextArea;

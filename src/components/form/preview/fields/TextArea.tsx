
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
  
  // Get direction from props or fallback to language-based
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Set default values for border styling
  const inputBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
  const inputBorderWidth = fieldStyle.borderWidth || '1px';
  
  // Set default rows
  const rows = field.rows || 4;
  
  // Determine label alignment based on direction
  const labelAlignment = textDirection === 'rtl' ? 'right' : 'left';
  
  // Direction class for styling
  const directionClass = textDirection === 'rtl' ? 'rtl' : 'ltr';
  
  return (
    <div 
      className={`mb-4 codform-field ${directionClass}`}
      data-field-type="textarea"
      data-direction={textDirection}
      dir={textDirection}
    >
      <label 
        htmlFor={field.id} 
        className={`block mb-2 codform-field-label ${field.required ? 'relative pr-2' : ''}`}
        style={{ 
          color: fieldStyle.labelColor || '#334155',
          fontSize: fieldStyle.labelFontSize || formStyle.fontSize || '1rem',
          fontWeight: 500,
          textAlign: labelAlignment
        }}
        dir={textDirection}
      >
        {field.label || (language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes')}
        {field.required && (
          <span className={`text-red-500 ${textDirection === 'rtl' ? 'mr-1' : 'ml-1'} codform-required`}>*</span>
        )}
      </label>
      
      <textarea
        id={field.id}
        rows={rows}
        placeholder={field.placeholder || ''}
        className={`w-full py-2 px-3 bg-white border outline-none focus:ring-2 focus:ring-opacity-50 transition-all codform-textarea ${directionClass}`}
        style={{
          color: fieldStyle.color || '#1f2937',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '1rem',
          borderColor: fieldStyle.borderColor || '#d1d5db',
          borderRadius: inputBorderRadius,
          borderWidth: inputBorderWidth,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          textAlign: textDirection === 'rtl' ? 'right' : 'left',
          paddingRight: '12px',
          paddingLeft: '12px'
        }}
        data-direction={textDirection}
        dir={textDirection}
      />
      
      {field.helpText && (
        <p 
          className={`mt-1 text-sm text-gray-500 codform-help-text ${directionClass}`}
          style={{
            textAlign: labelAlignment
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

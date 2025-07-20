
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
  
  // Set default values for styling
  const labelColor = fieldStyle.labelColor || '#334155';
  const labelFontSize = fieldStyle.labelFontSize || formStyle.fontSize || '16px';
  const labelFontWeight = fieldStyle.labelFontWeight || '600';
  
  // Set default values for border styling
  const inputBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
  const inputBorderWidth = fieldStyle.borderWidth || '1px';
  
  // Set default rows - زيادة الصفوف لجعل الحقل أكبر
  const rows = field.rows || 6;
  
  return (
    <div className="mb-4">
      <label 
        htmlFor={field.id} 
        className={`block mb-2 ${field.required ? 'relative' : ''}`}
        style={{ 
          color: labelColor,
          fontSize: labelFontSize,
          fontWeight: labelFontWeight,
          fontFamily: fieldStyle.fontFamily || 'inherit',
          marginBottom: '8px',
          display: 'flex'
        }}
      >
        {field.label || (language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes')}
        {field.required && (
          <span 
            className="text-red-500" 
            style={{
              marginRight: language === 'ar' ? '0' : '4px',
              marginLeft: language === 'ar' ? '4px' : '0',
            }}
          >
            *
          </span>
        )}
      </label>
      
      <textarea
        id={field.id}
        rows={rows}
        placeholder={field.placeholder || ''}
        className="w-full py-2 px-3 bg-white border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
        style={{
          color: fieldStyle.color || '#1f2937',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '16px',
          fontWeight: fieldStyle.fontWeight || '400',
          fontFamily: fieldStyle.fontFamily || 'inherit',
          borderColor: fieldStyle.borderColor || '#d1d5db',
          borderRadius: inputBorderRadius,
          borderWidth: inputBorderWidth,
          borderStyle: 'solid',
          paddingTop: '12px',
          paddingBottom: '12px',
          paddingLeft: '12px',
          paddingRight: '12px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          width: '100%',
          minHeight: '160px', // زيادة الحد الأدنى للارتفاع
          lineHeight: 1.5,
          resize: 'vertical' // السماح بتغيير الحجم عمودياً فقط
        }}
        required={field.required}
      />
      
      {field.helpText && (
        <p 
          className="mt-1 text-sm text-gray-500"
          style={{
            marginTop: '4px',
            fontSize: '14px',
            color: '#6b7280'
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default TextArea;

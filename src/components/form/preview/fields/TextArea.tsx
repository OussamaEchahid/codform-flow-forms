
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
  direction?: 'ltr' | 'rtl'; // Direction prop
}

const TextArea: React.FC<TextAreaProps> = ({ field, formStyle, direction }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  const fieldId = field.id; // Store field id for consistency
  
  // Determine the effective direction - ALWAYS prefer passed direction from form
  // Only fallback to language-based direction if no direction is provided
  const effectiveDirection = direction || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Set default values for styling
  const labelColor = fieldStyle.labelColor || '#334155';
  const labelFontSize = fieldStyle.labelFontSize || formStyle.fontSize || '16px';
  const labelFontWeight = fieldStyle.labelFontWeight || '600';
  
  // Set default values for border styling
  const inputBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
  const inputBorderWidth = fieldStyle.borderWidth || '1px';
  const inputBorderColor = fieldStyle.borderColor || '#d1d5db';
  const textColor = fieldStyle.color || '#1f2937';
  const textSize = fieldStyle.fontSize || formStyle.fontSize || '16px';
  const fontWeight = fieldStyle.fontWeight || '400';
  
  // Set default rows
  const rows = field.rows || 4;
  
  // Determine if RTL based on effective direction
  const isRTL = effectiveDirection === 'rtl';
  
  // Create a unique identifier to ensure the input is tied to this specific instance
  const uniqueId = `${fieldId}-${Date.now()}`;

  // Debug logging
  console.log(`TextArea rendering for fieldId: ${fieldId}, direction: ${effectiveDirection}, fieldStyle:`, fieldStyle);
  
  return (
    <div 
      className="mb-4" 
      dir={effectiveDirection}
      data-field-type="textarea"
      data-field-id={fieldId}
      data-respects-form-direction="true"
    >
      <label 
        htmlFor={uniqueId} 
        className={`block mb-2 ${field.required ? 'relative' : ''}`}
        style={{ 
          color: labelColor,
          fontSize: labelFontSize,
          fontWeight: labelFontWeight,
          fontFamily: fieldStyle.fontFamily || 'inherit',
          marginBottom: '8px',
          display: 'flex',
          textAlign: isRTL ? 'right' : 'left',
          width: '100%',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
      >
        {field.label || (language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes')}
        {field.required && (
          <span 
            className="text-red-500" 
            style={{
              marginRight: isRTL ? '0' : '4px',
              marginLeft: isRTL ? '4px' : '0',
            }}
          >
            *
          </span>
        )}
      </label>
      
      <textarea
        id={uniqueId}
        rows={rows}
        placeholder={field.placeholder || ''}
        className="w-full py-2 px-3 bg-white border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
        style={{
          color: textColor,
          fontSize: textSize,
          fontWeight: fontWeight,
          fontFamily: fieldStyle.fontFamily || 'inherit',
          borderColor: inputBorderColor,
          borderRadius: inputBorderRadius,
          borderWidth: inputBorderWidth,
          borderStyle: 'solid',
          paddingTop: '10px',
          paddingBottom: '10px',
          paddingLeft: '12px',
          paddingRight: '12px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          width: '100%',
          minHeight: '100px',
          lineHeight: 1.5,
          textAlign: isRTL ? 'right' : 'left',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
        required={field.required}
        dir={effectiveDirection}
      />
      
      {field.helpText && (
        <p 
          className="mt-1 text-sm text-gray-500"
          style={{
            marginTop: '4px',
            fontSize: '14px',
            color: '#6b7280',
            textAlign: isRTL ? 'right' : 'left'
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default TextArea;

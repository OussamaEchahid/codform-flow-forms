
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface SubmitButtonProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Determine button radius based on style
  let buttonRadius = '0.5rem'; // default
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  } else {
    buttonRadius = formStyle.borderRadius || '0.5rem';
  }

  // Determine font size based on style or field config
  const fontSize = fieldStyle.fontSize || formStyle.fontSize || '1.1rem';
  
  // Button hover and active effects
  const buttonHoverStyle = {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    opacity: 0.95,
  };
  
  return (
    <div className="mb-4 mt-8">
      <button
        className="w-full py-4 px-4 font-medium transition-all duration-200 hover:opacity-90 relative overflow-hidden"
        style={{
          backgroundColor: fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5',
          color: fieldStyle.color || 'white',
          fontSize: fontSize,
          borderRadius: buttonRadius,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          Object.assign(e.currentTarget.style, buttonHoverStyle);
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.opacity = '1';
        }}
        disabled={field.disabled}
      >
        {field.label || (language === 'ar' ? 'إرسال الطلب الآن' : 'Submit Order Now')}
      </button>
    </div>
  );
};

export default SubmitButton;

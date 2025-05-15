
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
  
  // Determine animation class
  let animationClass = '';
  if (fieldStyle.animation === true || fieldStyle.animation === 'true') {
    const animationType = fieldStyle.animationType || 'pulse';
    animationClass = `${animationType}-animation`;
  }
  
  // Determine button radius based on style
  let buttonRadius = '0.5rem'; // default
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  } else {
    buttonRadius = formStyle.borderRadius || '0.5rem';
  }
  
  return (
    <div className="mb-4">
      <button
        type="submit"
        className={`w-full py-3 px-4 text-white font-medium transition-all duration-200 hover:opacity-90 ${animationClass}`}
        style={{
          backgroundColor: fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5',
          color: fieldStyle.color || 'white',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '1.1rem',
          borderRadius: fieldStyle.borderRadius || buttonRadius,
          textDecoration: 'none',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {field.label || (language === 'ar' ? 'إرسال الطلب' : 'Submit Order')}
      </button>
    </div>
  );
};

export default SubmitButton;

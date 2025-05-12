
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

  // Define CSS animation for pulsing effect
  const pulseAnimation = fieldStyle.animation ? {
    animation: 'pulse 2s infinite',
  } : {};
  
  return (
    <div className="mb-4 mt-8">
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.3);
          }
          
          70% {
            transform: scale(1.02);
            box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
          }
          
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
        }
      `}</style>
      <button
        className="w-full py-4 px-4 font-medium transition-all duration-200 hover:opacity-90 relative overflow-hidden flex items-center justify-center gap-2"
        style={{
          backgroundColor: fieldStyle.backgroundColor || formStyle.primaryColor || '#000000',
          color: fieldStyle.color || 'white',
          fontSize: fontSize,
          borderRadius: buttonRadius,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          ...pulseAnimation
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
        {fieldStyle.iconPosition !== 'right' && fieldStyle.icon && (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {field.label || (language === 'ar' ? 'شراء بخاصية الدفع عند الاستلام' : 'Buy with Cash on Delivery')}
        {fieldStyle.iconPosition === 'right' && fieldStyle.icon && (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
};

export default SubmitButton;

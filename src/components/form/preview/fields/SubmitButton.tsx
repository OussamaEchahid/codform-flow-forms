
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ShoppingCart } from 'lucide-react';

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
  
  // Default label based on language if not provided
  const buttonLabel = field.label || (language === 'ar' 
    ? 'إرسال الطلب' 
    : 'Submit Order');
  
  // Determine button radius based on style
  let buttonRadius = '8px'; // Default border radius
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  } else if (formStyle.borderRadius) {
    buttonRadius = formStyle.borderRadius;
  }

  // Define font size based on style or field settings
  const fontSize = fieldStyle.fontSize || formStyle.fontSize || '1.2rem';
  
  // Standardized animation class names to match store implementation
  const animationType = fieldStyle.animationType || 'pulse';
  const hasAnimation = fieldStyle.animation || false;
  const animationClass = hasAnimation ? `${animationType}-animation` : '';
  
  return (
    <div className="mb-4 mt-8 codform-submit-container">
      <button
        className={`codform-submit-button w-full py-5 px-5 font-bold transition-all duration-200 hover:opacity-90 relative overflow-hidden flex items-center justify-center gap-3 ${animationClass}`}
        style={{
          backgroundColor: fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5',
          color: fieldStyle.color || 'white',
          fontSize: fontSize,
          borderRadius: buttonRadius,
          border: 'none',
          cursor: 'pointer',
          fontFamily: fieldStyle.fontFamily || 'inherit',
          fontWeight: 'bold',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          direction: language === 'ar' ? 'rtl' : 'ltr',
          textAlign: 'center',
          width: '100%',
        }}
        disabled={field.disabled}
        data-animation-type={animationType}
        data-has-animation={hasAnimation ? 'true' : 'false'}
        data-icon-position={fieldStyle.iconPosition || 'left'}
      >
        {fieldStyle.iconPosition !== 'right' && (
          <ShoppingCart className="w-6 h-6" />
        )}
        {buttonLabel}
        {fieldStyle.iconPosition === 'right' && (
          <ShoppingCart className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default SubmitButton;

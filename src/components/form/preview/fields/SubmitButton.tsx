
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

  // Get animation class
  const getAnimationClass = () => {
    if (!fieldStyle.animation) return '';
    
    // If animation is just boolean true with no specific type, default to pulse
    if (fieldStyle.animation === true && !fieldStyle.animationType) {
      return 'pulse-animation';
    }
    
    // Get the specific animation type if provided
    if (fieldStyle.animationType) {
      const type = fieldStyle.animationType.toLowerCase();
      
      switch (type) {
        case 'pulse':
          return 'pulse-animation';
        case 'shake':
          return 'shake-animation';
        case 'bounce':
          return 'bounce-animation';
        case 'wiggle':
          return 'wiggle-animation';
        case 'flash':
          return 'flash-animation';
        default:
          return '';
      }
    }
    
    return '';
  };
  
  const animationClass = getAnimationClass();
  
  return (
    <div className="mb-4 mt-8">
      <button
        className={`codform-submit-btn w-full ${animationClass}`}
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
          padding: '16px 20px',
          transition: 'all 0.3s ease',
          direction: language === 'ar' ? 'rtl' : 'ltr',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
        disabled={field.disabled}
        type="submit"
        data-animation-type={fieldStyle.animationType || ''}
        data-has-animation={fieldStyle.animation ? 'true' : 'false'}
        data-icon-position={fieldStyle.iconPosition || 'left'}
      >
        {(fieldStyle.iconPosition !== 'right' || language === 'ar') && (
          <span>
            <ShoppingCart size={20} />
          </span>
        )}
        <span>{buttonLabel}</span>
        {fieldStyle.iconPosition === 'right' && language !== 'ar' && (
          <span>
            <ShoppingCart size={20} />
          </span>
        )}
      </button>
    </div>
  );
};

export default SubmitButton;

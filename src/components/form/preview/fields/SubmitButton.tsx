
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
    ? 'شراء بخاصية الدفع عند الاستلام' 
    : 'Buy with Cash on Delivery');
  
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

  // Define animation class based on animation type
  let animationClass = '';
  if (fieldStyle.animation) {
    // Check if animation is boolean or string
    if (typeof fieldStyle.animation === 'boolean' && fieldStyle.animation) {
      // Default animation if only boolean true is provided
      animationClass = 'pulse-animation';
    } else if (typeof fieldStyle.animationType === 'string') {
      // Use specific animation type if provided
      switch (fieldStyle.animationType) {
        case 'pulse':
          animationClass = 'pulse-animation';
          break;
        case 'shake':
          animationClass = 'shake-animation';
          break;
        case 'bounce':
          animationClass = 'bounce-animation';
          break;
        case 'wiggle':
          animationClass = 'wiggle-animation';
          break;
        case 'flash':
          animationClass = 'flash-animation';
          break;
        default:
          animationClass = '';
      }
    }
  }
  
  // In-component CSS for animations
  const animationStyles = `
    @keyframes pulse-animation {
      0% { transform: scale(1); }
      50% { transform: scale(1.03); }
      100% { transform: scale(1); }
    }
    .pulse-animation {
      animation: pulse-animation 2s infinite ease-in-out;
    }
    @keyframes shake-animation {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    .shake-animation {
      animation: shake-animation 3s infinite;
    }
    @keyframes bounce-animation {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .bounce-animation {
      animation: bounce-animation 2s infinite;
    }
    @keyframes wiggle-animation {
      0%, 100% { transform: rotate(-3deg); }
      50% { transform: rotate(3deg); }
    }
    .wiggle-animation {
      animation: wiggle-animation 1s infinite;
    }
    @keyframes flash-animation {
      0%, 50%, 100% { opacity: 1; }
      25%, 75% { opacity: 0.7; }
    }
    .flash-animation {
      animation: flash-animation 2s infinite;
    }
  `;
  
  return (
    <div className="mb-4 mt-8">
      <style>{animationStyles}</style>
      <button
        className={`w-full py-4 px-4 font-medium transition-all duration-200 hover:opacity-90 relative overflow-hidden flex items-center justify-center gap-2 ${animationClass}`}
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
        {fieldStyle.iconPosition !== 'right' && (
          <ShoppingCart className="w-5 h-5" />
        )}
        {buttonLabel}
        {fieldStyle.iconPosition === 'right' && (
          <ShoppingCart className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default SubmitButton;

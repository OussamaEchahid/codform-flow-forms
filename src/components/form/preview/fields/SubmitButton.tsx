
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
  let buttonRadius = '8px'; // زيادة القيمة الافتراضية للحواف
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  } else if (formStyle.borderRadius) {
    buttonRadius = formStyle.borderRadius;
  }

  // تحديد حجم الخط بناءً على النمط أو إعدادات الحقل
  const fontSize = fieldStyle.fontSize || '1.2rem'; // زيادة حجم الخط الافتراضي
  
  // تأثيرات التحويم والضغط على الزر
  const buttonHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    opacity: 0.95,
  };

  // تحديد فئة الرسوم المتحركة بناءً على نوع الرسوم المتحركة
  let animationClass = '';
  if (fieldStyle.animation) {
    // تحقق مما إذا كانت الرسوم المتحركة منطقية أو نصية
    if (typeof fieldStyle.animation === 'boolean' && fieldStyle.animation) {
      animationClass = 'pulse-animation';
    } else if (typeof fieldStyle.animationType === 'string') {
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
  
  // CSS داخلي للرسوم المتحركة
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
    <div className="mb-4 mt-8 codform-submit-container">
      <style>{animationStyles}</style>
      <button
        className={`codform-submit-button w-full py-5 px-5 font-bold transition-all duration-200 hover:opacity-90 relative overflow-hidden flex items-center justify-center gap-3 ${animationClass}`}
        style={{
          backgroundColor: fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5',
          color: fieldStyle.color || 'white',
          fontSize: fontSize,
          borderRadius: buttonRadius,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 'bold',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)', // تعزيز الظل
          transition: 'all 0.3s ease',
          direction: language === 'ar' ? 'rtl' : 'ltr', // تعديل لجعل الاتجاه يعتمد على اللغة
          textAlign: 'center', // محاذاة النص للمركز
        }}
        onMouseOver={(e) => {
          Object.assign(e.currentTarget.style, buttonHoverStyle);
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.opacity = '1';
        }}
        disabled={field.disabled}
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

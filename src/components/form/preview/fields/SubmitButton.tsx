
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
  const style = field.style || {};
  
  // Get animation class if set
  const getAnimationClass = () => {
    if (!style.animation) return '';
    
    const animationType = style.animationType || 'pulse';
    switch (animationType) {
      case 'pulse': return 'pulse-animation';
      case 'shake': return 'shake-animation';
      case 'bounce': return 'bounce-animation';
      case 'wiggle': return 'wiggle-animation';
      case 'flash': return 'flash-animation';
      default: return '';
    }
  };

  const animationClass = getAnimationClass();
  
  // Use pixel values for font sizes to ensure consistent display
  const fontSize = style.fontSize || '18px'; // Default is 1.2rem = 18px
  
  const buttonStyle = {
    backgroundColor: style.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color: style.color || '#ffffff',
    fontSize: fontSize,
    borderRadius: formStyle.buttonStyle === 'pill' ? '9999px' : 
                 formStyle.buttonStyle === 'sharp' ? '0' : 
                 formStyle.borderRadius || '8px',
    width: style.fullWidth === false ? 'auto' : '100%',
    fontWeight: style.fontWeight || 'bold',
  };
  
  // Icon rendering
  const renderIcon = () => {
    if (!style.icon) return null;
    
    let iconElement = null;
    
    // Simple icon rendering using text characters
    switch (style.icon.toLowerCase()) {
      case 'arrow-right':
        iconElement = language === 'ar' ? '←' : '→';
        break;
      case 'check':
        iconElement = '✓';
        break;
      case 'cart':
        iconElement = '🛒';
        break;
      case 'send':
        iconElement = '📨';
        break;
      default:
        iconElement = null;
    }
    
    return iconElement ? (
      <span className="inline-block mx-1">{iconElement}</span>
    ) : null;
  };

  const icon = renderIcon();
  const iconPosition = style.iconPosition || 'right';
  
  return (
    <button
      type="button"
      disabled={false}
      className={cn(
        "codform-submit-btn", 
        animationClass,
        iconPosition === 'left' ? 'flex-row-reverse' : 'flex-row'
      )}
      style={buttonStyle}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      data-animation-type={style.animationType || 'none'}
      data-button-style={formStyle.buttonStyle || 'rounded'}
    >
      {iconPosition === 'left' && icon}
      <span>{field.label || (language === 'ar' ? 'إرسال الطلب' : 'Submit Order')}</span>
      {iconPosition === 'right' && icon}
    </button>
  );
};

export default SubmitButton;

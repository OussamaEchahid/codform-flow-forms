
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
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
  
  // Default button styling
  const buttonStyle = {
    backgroundColor: style.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color: style.color || '#ffffff',
    fontSize: style.fontSize || '18px',
    fontWeight: style.fontWeight || 'bold',
    borderRadius: style.borderRadius || formStyle.borderRadius || '8px',
    borderColor: style.borderColor || 'transparent',
    borderWidth: style.borderWidth || '0px',
    borderStyle: 'solid',
    paddingTop: style.paddingY || '12px',
    paddingBottom: style.paddingY || '12px',
    paddingLeft: '20px',
    paddingRight: '20px',
    width: style.fullWidth === false ? 'auto' : '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: style.iconPosition === 'left' ? 'flex-start' : 
                  style.iconPosition === 'right' ? 'flex-end' : 'center',
    gap: '8px',
    fontFamily: style.fontFamily || 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };
  
  // Icon rendering with improved support for shopping cart
  const renderIcon = () => {
    if (!style.showIcon) return null;
    
    if (style.icon === 'shopping-cart') {
      return <ShoppingCart size={16} color={style.color || '#ffffff'} />;
    }
    
    let iconElement = null;
    
    // Simple icon rendering using text characters
    switch (style.icon?.toLowerCase()) {
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
      <span className="inline-block">{iconElement}</span>
    ) : null;
  };

  // Determine the content and order based on icon position
  const iconPosition = style.iconPosition || 'right';
  const icon = renderIcon();
  
  return (
    <button
      type="button"
      disabled={false}
      className={cn(
        "codform-submit-btn", 
        animationClass,
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

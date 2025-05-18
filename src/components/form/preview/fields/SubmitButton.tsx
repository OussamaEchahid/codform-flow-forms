
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ShoppingCart, ArrowRight, Check, Send } from 'lucide-react';

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
    if (style.animation !== true) return '';
    
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
  
  // CRITICAL FIX: Ensure button background color is properly set and prioritized
  const buttonBackgroundColor = style.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // Debug log to trace the background color being applied
  console.log(`Submit button styling: bgColor=${buttonBackgroundColor}, animationType=${style.animationType || 'none'}`);
  console.log('Full submit button style object:', JSON.stringify(style, null, 2));
  
  // Button styling with explicit color handling
  const buttonStyle = {
    backgroundColor: buttonBackgroundColor,
    color: style.color || '#ffffff',
    fontSize: style.fontSize || '19px',
    fontWeight: style.fontWeight || 'bold',
    borderRadius: style.borderRadius || formStyle.borderRadius || '8px',
    borderColor: style.borderColor || 'transparent',
    borderWidth: style.borderWidth || '0px',
    borderStyle: 'solid',
    paddingTop: style.paddingY || '15px',
    paddingBottom: style.paddingY || '15px',
    paddingLeft: '20px',
    paddingRight: '20px',
    width: style.fullWidth === false ? 'auto' : '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: style.fontFamily || 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '0px',
  };
  
  // Icon rendering with improved support for multiple icon types
  const renderIcon = () => {
    if (!style.showIcon) return null;
    
    // Return Lucide React icon components based on icon name
    switch (style.icon?.toLowerCase()) {
      case 'shopping-cart':
        return <ShoppingCart size={16} color={style.color || '#ffffff'} />;
      case 'arrow-right':
        return language === 'ar' ? 
          <ArrowRight size={16} color={style.color || '#ffffff'} style={{ transform: 'scaleX(-1)' }} /> : 
          <ArrowRight size={16} color={style.color || '#ffffff'} />;
      case 'check':
        return <Check size={16} color={style.color || '#ffffff'} />;
      case 'send':
        return <Send size={16} color={style.color || '#ffffff'} />;
      case 'cart':
        return <ShoppingCart size={16} color={style.color || '#ffffff'} />;
      default:
        return null;
    }
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
      data-button-bg-color={buttonBackgroundColor} // Add explicit data attribute for background color
    >
      {iconPosition === 'left' && icon}
      <span>{field.label || (language === 'ar' ? 'إرسال الطلب' : 'Submit Order')}</span>
      {iconPosition === 'right' && icon}
    </button>
  );
};

export default SubmitButton;

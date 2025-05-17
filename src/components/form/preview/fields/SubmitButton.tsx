
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ShoppingCart, ArrowRight, Check, Send, Phone } from 'lucide-react';

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
  
  // Default button styling with exact pixel values matching preview
  const buttonStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color: style.color || '#ffffff',
    fontSize: style.fontSize || '18px',
    fontWeight: style.fontWeight || '600',
    borderRadius: style.borderRadius || formStyle.borderRadius || '8px',
    borderColor: style.borderColor || 'transparent',
    borderWidth: style.borderWidth || '0px',
    borderStyle: 'solid',
    padding: '14px 24px',
    paddingTop: style.paddingY || '14px',
    paddingBottom: style.paddingY || '14px',
    paddingLeft: '24px',
    paddingRight: '24px',
    width: style.fullWidth === false ? 'auto' : '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: style.fontFamily || 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '14px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden',
    textAlign: 'center'
  };
  
  // Icon rendering with consistent sizing and positioning
  const renderIcon = () => {
    if (!style.showIcon) return null;
    
    // Add specific styling for the icon to match preview exactly
    const iconStyle = {
      width: '18px',
      height: '18px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
    
    // Return Lucide React icon components based on icon name
    switch (style.icon?.toLowerCase()) {
      case 'shopping-cart':
        return <ShoppingCart size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'arrow-right':
        return language === 'ar' ? 
          <ArrowRight size={18} color={style.color || '#ffffff'} style={{ ...iconStyle, transform: 'scaleX(-1)' }} /> : 
          <ArrowRight size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'check':
        return <Check size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'send':
        return <Send size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'cart':
      case 'shopping-bag':
        return <ShoppingCart size={18} color={style.color || '#ffffff'} style={iconStyle} />;
      case 'phone':
        return <Phone size={18} color={style.color || '#ffffff'} style={iconStyle} />;
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
      data-has-animation={style.animation ? 'true' : 'false'}
      data-icon-position={iconPosition}
      data-has-icon={style.showIcon ? 'true' : 'false'}
    >
      {iconPosition === 'left' && icon}
      <span>{field.label || (language === 'ar' ? 'إرسال الطلب' : 'Submit Order')}</span>
      {iconPosition === 'right' && icon}
    </button>
  );
};

export default SubmitButton;

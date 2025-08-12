
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, 
  Send, 
  Check, 
  ArrowRight, 
  CreditCard, 
  Package, 
  Truck, 
  ShoppingBag,
  Banknote,
  Handshake,
  Heart,
  Star,
  Gift,
  Crown,
  Zap,
  Target
} from 'lucide-react';

interface SubmitButtonProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
    formDirection?: 'ltr' | 'rtl';
  };
  onClick?: () => void;
  disabled?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ field, formStyle, onClick, disabled = false }) => {
  // Debug logging for submit button
  console.log('🔍 SubmitButton Debug - field:', field);
  console.log('🔍 SubmitButton Debug - field.style:', field.style);
  console.log('🔍 SubmitButton Debug - field.style.icon only:', field.style?.icon);
  console.log('🔍 SubmitButton Debug - field.style?.icon:', field.style?.icon);
  
  // Extract style values with fallbacks
  const {
    backgroundColor = field.style?.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color = field.style?.color || '#ffffff',
    fontSize = field.style?.fontSize || formStyle.fontSize || '16px',
    fontWeight = field.style?.fontWeight || '700',
    animation = field.style?.animation || false,
    animationType = field.style?.animationType || 'pulse',
    borderRadius = formStyle.borderRadius || '8px',
    paddingY = field.style?.paddingY || '10px',
    showIcon = field.style?.showIcon !== false, // تفعيل الأيقونة افتراضياً
    iconPosition = field.style?.iconPosition || 'right',
    borderColor = field.style?.borderColor,
    borderWidth = field.style?.borderWidth || '0px',
  } = field.style || {};

  // Get the current icon - use only field.style.icon
  const currentIcon = field.style?.icon || 'shopping-cart';
  console.log('🎯 Current Icon:', currentIcon);

  // Derived icon settings for consistent preview/store behavior
  const formDirection = formStyle.formDirection === 'rtl' ? 'rtl' : 'ltr';
  const defaultFontSize = formDirection === 'rtl' ? '17px' : '18px';
  const defaultPaddingY = formDirection === 'rtl' ? '12px' : '15px';
  const iconSize = parseInt(String(field.style?.iconSize ?? '18px').toString().replace('px','')) || 18;
  const effectiveIconPosition = field.style?.iconPosition ?? 'right';
  
  // Show icon if showIcon is true and we have an icon (and it's not 'none')
  const shouldShowIcon = showIcon && currentIcon && currentIcon !== 'none';
  console.log('🎯 Should Show Icon:', shouldShowIcon, 'showIcon:', showIcon, 'currentIcon:', currentIcon);

  // Generate animation class based on animation type
  const getAnimationClass = () => {
    if (!animation) return '';
    
    switch (animationType) {
      case 'pulse':
        return 'pulse-animation';
      case 'bounce':
        return 'bounce-animation';
      case 'shake':
        return 'shake-animation';
      case 'wiggle':
        return 'wiggle-animation';
      case 'flash':
        return 'flash-animation';
      default:
        return '';
    }
  };

  // Get the appropriate icon component
  const getIconComponent = (iconType: string) => {
    const iconProps = {
      size: iconSize,
      className: "submit-button-icon",
      style: { color: field.style?.iconColor || color || '#ffffff' }
    };

    switch (iconType) {
      case 'shopping-cart':
        return <ShoppingCart {...iconProps} />;
      case 'shopping-bag':
        return <ShoppingBag {...iconProps} />;
      case 'send':
        return <Send {...iconProps} />;
      case 'check':
        return <Check {...iconProps} />;
      case 'arrow-right':
        return <ArrowRight {...iconProps} />;
      case 'credit-card':
        return <CreditCard {...iconProps} />;
      case 'package':
        return <Package {...iconProps} />;
      case 'truck':
        return <Truck {...iconProps} />;
      case 'banknote':
        return <Banknote {...iconProps} />;
      case 'handshake':
        return <Handshake {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'gift':
        return <Gift {...iconProps} />;
      case 'crown':
        return <Crown {...iconProps} />;
      case 'zap':
        return <Zap {...iconProps} />;
      case 'target':
        return <Target {...iconProps} />;
      default:
        return <ShoppingCart {...iconProps} />;
    }
  };

  // Define button style
  const resolvedFontSize = field.style?.fontSize || defaultFontSize;
  const resolvedPaddingY = field.style?.paddingY || defaultPaddingY;
  const computedRadius = (() => {
    const base = field.style?.borderRadius || borderRadius;
    if (formStyle.buttonStyle === 'pill') return '9999px';
    if (formStyle.buttonStyle === 'square') return '0';
    return base;
  })();
  const btnStyle: React.CSSProperties = {
    backgroundColor,
    color,
    fontSize: resolvedFontSize,
    fontWeight,
    fontFamily: field.style?.fontFamily || 'inherit',
    borderRadius: computedRadius,
    padding: `${resolvedPaddingY} 24px`,
    border: borderColor ? `${borderWidth} solid ${borderColor}` : 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease-in-out',
  };

  // Add className for animation
  const animClass = getAnimationClass();

  const handleSubmit = () => {
    // إرسال event للـ tracking pixels
    const event = new CustomEvent('formSubmitted', {
      detail: {
        formName: field.label || 'Submit Form',
        formId: field.id,
        timestamp: new Date().toISOString()
      }
    });
    document.dispatchEvent(event);
    
    // استدعاء onClick المرسل من props
    if (onClick) {
      onClick();
    }
  };

  return (
    <button 
      type="submit" 
      className={cn("form-submit-btn w-full", animClass)}
      style={btnStyle}
      onClick={handleSubmit}
      disabled={disabled}
    >
      {shouldShowIcon && effectiveIconPosition === 'left' && (
        <span className="submit-icon-left">
          {getIconComponent(currentIcon)}
        </span>
      )}
      
      {field.label || 'Submit'}
      
      {shouldShowIcon && effectiveIconPosition === 'right' && (
        <span className="submit-icon-right">
          {getIconComponent(currentIcon)}
        </span>
      )}
    </button>
  );
};

export default React.memo(SubmitButton);


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
  };
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ field, formStyle }) => {
  // Extract style values with fallbacks
  const {
    backgroundColor = field.style?.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color = field.style?.color || '#ffffff',
    fontSize = field.style?.fontSize || formStyle.fontSize || '16px',
    animation = field.style?.animation || false,
    animationType = field.style?.animationType || 'pulse',
    borderRadius = formStyle.borderRadius || '6px',
    paddingY = field.style?.paddingY || '16px',
    showIcon = field.style?.showIcon || false,
    iconPosition = field.style?.iconPosition || 'left',
    borderColor = field.style?.borderColor,
    borderWidth = field.style?.borderWidth || '0px',
  } = field.style || {};

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
      size: 16,
      className: "submit-button-icon",
      style: { color: field.style?.iconColor || '#ffffff' }
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
  const btnStyle: React.CSSProperties = {
    backgroundColor,
    color,
    fontSize,
    borderRadius,
    padding: `${paddingY} 32px`,
    border: borderColor ? `${borderWidth} solid ${borderColor}` : 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    textAlign: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(155, 135, 245, 0.3)',
    transform: 'translateY(0)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '56px',
    fontFamily: "'Cairo', inherit"
  };

  // Add className for animation
  const animClass = getAnimationClass();

  return (
    <button 
      type="button" 
      className={cn("form-submit-btn w-full", animClass)}
      style={btnStyle}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(155, 135, 245, 0.4)';
        e.currentTarget.style.background = 'linear-gradient(135deg, #9b87f5, #9b87f5dd)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(155, 135, 245, 0.3)';
        e.currentTarget.style.background = backgroundColor;
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px) scale(0.98)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
      }}
    >
      {showIcon && iconPosition === 'left' && field.icon && (
        <span className="submit-icon-left">
          {getIconComponent(field.icon)}
        </span>
      )}
      
      {field.label || 'Submit'}
      
      {showIcon && iconPosition === 'right' && field.icon && (
        <span className="submit-icon-right">
          {getIconComponent(field.icon)}
        </span>
      )}
    </button>
  );
};

export default React.memo(SubmitButton);

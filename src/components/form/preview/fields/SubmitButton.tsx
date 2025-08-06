
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
  onClick?: () => void;
  disabled?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ field, formStyle, onClick, disabled = false }) => {
  // Extract style values with fallbacks and enhanced Padding Y support
  const {
    backgroundColor = field.style?.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color = field.style?.color || '#ffffff',
    fontSize = field.style?.fontSize || formStyle.fontSize || '16px',
    fontWeight = field.style?.fontWeight || '700', // Enhanced font weight matching
    animation = field.style?.animation || false,
    animationType = field.style?.animationType || 'pulse',
    borderRadius = formStyle.borderRadius || '8px',
    paddingY = field.style?.paddingY || '12px', // Enhanced Padding Y support
    showIcon = field.style?.showIcon || false,
    iconPosition = field.style?.iconPosition || 'left',
    borderColor = field.style?.borderColor,
    borderWidth = field.style?.borderWidth || '0px',
  } = field.style || {};

  // Enhanced Padding Y calculation - matching TextInput logic
  const getPaddingYValue = () => {
    let numericValue = 12; // default value
    
    if (typeof paddingY === 'string') {
      const parsed = parseInt(paddingY.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed)) {
        numericValue = parsed;
      }
    } else if (typeof paddingY === 'number') {
      numericValue = paddingY;
    }
    
    // Ensure reasonable bounds
    return Math.max(6, Math.min(numericValue, 60));
  };

  const finalPaddingY = getPaddingYValue();

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

  // Get the appropriate icon component - Fixed icon mapping
  const getIconComponent = (iconType: string) => {
    const iconProps = {
      size: 18,
      className: "submit-button-icon",
      style: { color: field.style?.iconColor || color }
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

  // Enhanced button style with proper Padding Y and font weight
  const btnStyle: React.CSSProperties = {
    backgroundColor,
    color,
    fontSize,
    fontWeight, // Properly apply font weight
    borderRadius,
    paddingTop: `${finalPaddingY}px`,
    paddingBottom: `${finalPaddingY}px`,
    paddingLeft: '24px',
    paddingRight: '24px',
    border: borderColor ? `${borderWidth} solid ${borderColor}` : 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease-in-out',
    fontFamily: 'Cairo, Tajawal, Arial, sans-serif', // Ensure font consistency
    width: '100%'
  };

  // Add className for animation
  const animClass = getAnimationClass();

  return (
    <button 
      type="submit" 
      className={cn("form-submit-btn w-full", animClass)}
      style={btnStyle}
      onClick={onClick}
      disabled={disabled}
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

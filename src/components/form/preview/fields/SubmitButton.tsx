
import React from 'react';
import { FormField } from '@/lib/form-utils';
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
  // Extract style values with fallbacks
  const {
    backgroundColor = field.style?.backgroundColor || formStyle.primaryColor || '#9b87f5',
    color = field.style?.color || '#ffffff',
    fontSize = field.style?.fontSize || formStyle.fontSize || '16px',
    animation = field.style?.animation || false,
    animationType = field.style?.animationType || 'pulse',
    borderRadius = formStyle.borderRadius || '8px',
    paddingY = field.style?.paddingY || '10px',
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

  // Define button style
  const btnStyle: React.CSSProperties = {
    backgroundColor,
    color,
    fontSize,
    borderRadius,
    padding: `${paddingY} 24px`,
    border: borderColor ? `${borderWidth} solid ${borderColor}` : 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    textAlign: 'center',
    transition: 'all 0.2s ease-in-out',
  };

  // Add className for animation
  const animClass = getAnimationClass();

  return (
    <button 
      type="button" 
      className={cn("form-submit-btn w-full", animClass)}
      style={btnStyle}
    >
      {showIcon && iconPosition === 'left' && field.icon && (
        <span className="submit-icon-left">
          {/* Icon would be rendered here */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
      
      {field.label || 'Submit'}
      
      {showIcon && iconPosition === 'right' && field.icon && (
        <span className="submit-icon-right">
          {/* Icon would be rendered here */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </button>
  );
};

export default React.memo(SubmitButton);

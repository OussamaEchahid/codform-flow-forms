import React from 'react';
import { FormField } from '@/lib/form-utils';
import { cn } from '@/lib/utils';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Home,
  Heart,
  Star,
  ShoppingCart,
  Gift,
  Calendar,
  Clock,
  MessageCircle
} from 'lucide-react';

interface TextInputProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
    [key: string]: any;
  };
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  formCountry?: string;
  formPhonePrefix?: string;
}

const TextInput: React.FC<TextInputProps> = ({ 
  field, 
  formStyle, 
  value, 
  onChange, 
  disabled = false,
  formCountry,
  formPhonePrefix 
}) => {
  // Extract style values with enhanced Padding Y support
  const {
    color = field.style?.color || '#374151',
    backgroundColor = field.style?.backgroundColor || '#ffffff',
    fontSize = field.style?.fontSize || formStyle.fontSize || '16px',
    fontWeight = field.style?.fontWeight || '400',
    borderRadius = field.style?.borderRadius || formStyle.borderRadius || '8px',
    borderColor = field.style?.borderColor || '#d1d5db',
    borderWidth = field.style?.borderWidth || '1px',
    paddingY = field.style?.paddingY || '12px', // Enhanced Padding Y with proper default
    labelColor = field.style?.labelColor || '#374151',
    labelFontSize = field.style?.labelFontSize || '14px',
    labelFontWeight = field.style?.labelFontWeight || '500',
    showIcon = field.style?.showIcon !== false && field.icon && field.icon !== 'none',
    iconColor = field.style?.iconColor || '#6b7280'
  } = field.style || {};

  // Enhanced Padding Y calculation
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

  // Get the appropriate icon component with exact matching
  const getIconComponent = (iconType: string) => {
    const iconProps = {
      size: 18,
      className: "text-current",
      style: { color: iconColor }
    };

    switch (iconType) {
      case 'user':
        return <User {...iconProps} />;
      case 'mail':
      case 'email':
        return <Mail {...iconProps} />;
      case 'phone':
        return <Phone {...iconProps} />;
      case 'map-pin':
        return <MapPin {...iconProps} />;
      case 'home':
        return <Home {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'shopping-cart':
        return <ShoppingCart {...iconProps} />;
      case 'gift':
        return <Gift {...iconProps} />;
      case 'calendar':
        return <Calendar {...iconProps} />;
      case 'clock':
        return <Clock {...iconProps} />;
      case 'message-circle':
        return <MessageCircle {...iconProps} />;
      default:
        return <User {...iconProps} />;
    }
  };

  // Enhanced input styling with proper Padding Y application
  const inputStyle: React.CSSProperties = {
    backgroundColor,
    color,
    fontSize,
    fontWeight,
    borderRadius,
    border: `${borderWidth} solid ${borderColor}`,
    paddingTop: `${finalPaddingY}px`,
    paddingBottom: `${finalPaddingY}px`,
    paddingLeft: showIcon ? '48px' : '16px',
    paddingRight: '16px',
    fontFamily: 'Cairo, Tajawal, Arial, sans-serif',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
    width: '100%'
  };

  const labelStyle: React.CSSProperties = {
    color: labelColor,
    fontSize: labelFontSize,
    fontWeight: labelFontWeight,
    fontFamily: 'Cairo, Tajawal, Arial, sans-serif',
    marginBottom: '8px',
    display: 'block'
  };

  return (
    <div className="form-field mb-5">
      {field.label && !field.hideLabel && (
        <label style={labelStyle} className="block">
          {field.label}
          {field.required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}
      
      <div className="relative">
        {showIcon && (
          <div 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10"
            style={{ color: iconColor }}
          >
            {getIconComponent(field.icon as string)}
          </div>
        )}
        
        <input
          type={field.type === 'phone' ? 'tel' : field.type}
          id={field.id}
          name={field.id}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={field.placeholder || field.label || ''}
          required={field.required}
          disabled={disabled}
          style={inputStyle}
          className={cn(
            "w-full transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
      
      {field.helpText && (
        <p className="mt-2 text-xs text-gray-600" style={{ fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default React.memo(TextInput);

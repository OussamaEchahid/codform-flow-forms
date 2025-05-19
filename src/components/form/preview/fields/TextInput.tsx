
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

// Import icons directly to avoid dynamic loading issues
import {
  User,
  Phone,
  MapPin,
  Mail,
  MessageSquare,
  CheckSquare,
  CircleCheck,
  Image,
  FileText
} from 'lucide-react';

interface TextInputProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  direction?: 'ltr' | 'rtl'; // Direction prop to honor form's direction
}

const TextInput: React.FC<TextInputProps> = ({ field, formStyle, direction }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // IMPORTANT: Always prioritize passed direction from form
  // Only fall back to language-based direction if no direction is provided
  const effectiveDirection = direction || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Default styling values
  const showLabel = fieldStyle.showLabel !== false;
  const labelColor = fieldStyle.labelColor || '#334155';
  const labelFontSize = fieldStyle.labelFontSize || formStyle.fontSize || '16px';
  const labelFontWeight = fieldStyle.labelFontWeight || '600';
  
  const fontFamily = fieldStyle.fontFamily || 'inherit';
  const textColor = fieldStyle.color || '#1f2937';
  const fontSize = fieldStyle.fontSize || formStyle.fontSize || '16px';
  const fontWeight = fieldStyle.fontWeight || '400';
  
  const backgroundColor = fieldStyle.backgroundColor || '#ffffff';
  const borderColor = fieldStyle.borderColor || '#d1d5db';
  const borderWidth = fieldStyle.borderWidth || '1px';
  const borderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '8px';
  const paddingY = fieldStyle.paddingY ? `${fieldStyle.paddingY}px` : '10px';
  
  // Determine if there's an icon and if it should be shown
  const hasIcon = field.icon && field.icon !== 'none' && field.icon !== '';
  const showIcon = fieldStyle.showIcon !== undefined ? fieldStyle.showIcon : hasIcon;
  
  // Enhanced icon rendering function with additional diagnostics
  const renderIcon = () => {
    if (!hasIcon || !showIcon) return null;
    
    // Log information about which icon is being displayed to help with diagnostics
    console.log(`Rendering icon: ${field.icon} for field ${field.id}`);
    
    // Add additional attributes for diagnostics
    const iconProps = { 
      size: 18,
      className: "text-gray-500 codform-icon",
      style: {
        width: '18px',
        height: '18px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      "aria-hidden": true as boolean,
      "data-testid": `icon-${field.icon}`,
      "data-icon-name": field.icon
    };
    
    // Use switch for exact matching and return the appropriate React element
    switch(field.icon) {
      case 'user': return <User {...iconProps} />;
      case 'phone': return <Phone {...iconProps} />;
      case 'map-pin': return <MapPin {...iconProps} />;
      case 'mail': return <Mail {...iconProps} />;
      case 'message-square': return <MessageSquare {...iconProps} />;
      case 'check-square': return <CheckSquare {...iconProps} />;
      case 'circle-check': return <CircleCheck {...iconProps} />;
      case 'image': return <Image {...iconProps} />;
      case 'file-text': return <FileText {...iconProps} />;
      default: 
        console.warn(`Unknown icon type: ${field.icon}`);
        return null;
    }
  };
  
  // Get the actual label text to display
  const labelText = field.label || (language === 'ar' ? 'حقل نصي' : 'Text field');
  
  // Get the actual placeholder text to display
  const placeholderText = field.placeholder || '';

  // Determine the correct input type based on the field type
  const getInputType = () => {
    const originalType = field.type;
    if (originalType === 'email') return 'email';
    if (originalType === 'phone') return 'tel';
    return 'text';
  };
  
  // Add unique id to help ensure display matching and updates
  const inputId = `${field.id}-input`;
  
  // Determine position of icon based on direction
  const isRTL = effectiveDirection === 'rtl';
  
  return (
    <div 
      className="mb-4" 
      data-component="TextInput" 
      data-field-type={field.type}
      data-field-id={field.id}
      data-show-label={showLabel.toString()}
      data-label-text={labelText}
      data-has-icon={hasIcon ? 'true' : 'false'}
      data-show-icon={showIcon ? 'true' : 'false'}
      data-icon-type={field.icon || 'none'}
      data-required={field.required ? 'true' : 'false'}
      data-font-family={fontFamily}
      data-font-size={fontSize}
      data-border-radius={borderRadius}
      data-input-id={inputId}
      data-respects-form-direction="true"
      dir={effectiveDirection} // IMPORTANT: Always use effectiveDirection from form
    >
      {showLabel && (
        <label 
          htmlFor={inputId} 
          className={`block mb-2 ${field.required ? 'relative' : ''}`}
          style={{ 
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            fontFamily: fontFamily,
            marginBottom: '8px',
            display: 'flex'
          }}
          data-label-text={labelText}
        >
          {labelText}
          {field.required && (
            <span 
              className="text-red-500" 
              style={{
                marginRight: isRTL ? '0' : '4px',
                marginLeft: isRTL ? '4px' : '0',
              }}
            >
              *
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        {/* Render the icon if it should be shown */}
        {showIcon && hasIcon && (
          <div 
            className="absolute codform-field-icon" 
            style={{
              position: 'absolute',
              left: isRTL ? 'auto' : '12px',
              right: isRTL ? '12px' : 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}
            data-icon-type={field.icon}
            data-icon-visible="true"
          >
            {renderIcon()}
          </div>
        )}
        
        <input
          type={getInputType()}
          id={inputId}
          name={field.id}
          placeholder={placeholderText}
          aria-label={field.inputFor || labelText}
          className="w-full outline-none transition-all codform-input"
          style={{
            color: textColor,
            fontSize: fontSize,
            fontWeight: fontWeight,
            fontFamily: fontFamily,
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            borderRadius: borderRadius,
            borderWidth: borderWidth,
            borderStyle: 'solid',
            paddingTop: paddingY,
            paddingBottom: paddingY,
            paddingLeft: (showIcon && hasIcon && !isRTL) ? '36px' : '12px',
            paddingRight: (showIcon && hasIcon && isRTL) ? '36px' : '12px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            width: '100%',
            height: 'auto',
            lineHeight: 1.5,
            minHeight: '44px',
            textAlign: isRTL ? 'right' : 'left'
          }}
          data-has-icon={hasIcon && showIcon ? 'true' : 'false'}
          required={field.required}
          dir={effectiveDirection}
        />
      </div>
      
      {field.helpText && (
        <p 
          className="mt-1 text-xs text-gray-500 codform-help-text" 
          style={{
            marginTop: '4px',
            fontSize: '14px',
            color: '#6b7280'
          }}
        >
          {field.helpText}
        </p>
      )}
      
      {field.errorMessage && field.required && (
        <div 
          className="hidden error-message text-sm text-red-500 mt-1 codform-error-message"
          style={{
            display: 'none', // Initially hidden until validation fails
            color: '#ef4444',
            fontSize: '14px',
            marginTop: '4px'
          }}
        >
          {field.errorMessage}
        </div>
      )}
    </div>
  );
};

export default TextInput;

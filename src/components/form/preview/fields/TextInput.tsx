
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
  formDirection?: 'ltr' | 'rtl';
}

const TextInput: React.FC<TextInputProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Get direction from props or fallback to language-based
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Default styling values
  const showLabel = fieldStyle.showLabel !== false;
  const labelColor = fieldStyle.labelColor || '#334155';
  const labelFontSize = fieldStyle.labelFontSize || formStyle.fontSize || '16px';
  const labelFontWeight = fieldStyle.labelFontWeight || '500';
  
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
  
  // Enhanced icon rendering function
  const renderIcon = () => {
    if (!hasIcon || !showIcon) return null;
    
    // Icon positioning based on text direction
    const iconPosition = textDirection === 'rtl' ? 'right' : 'left';
    
    // Common icon props
    const iconProps = { 
      size: 18,
      className: `text-gray-500 codform-icon ${textDirection === 'rtl' ? 'rtl-icon' : 'ltr-icon'}`,
      style: {
        width: '18px',
        height: '18px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      "aria-hidden": "true" as React.AriaAttributes["aria-hidden"],
      "data-testid": `icon-${field.icon}`,
      "data-icon-name": field.icon,
      "data-icon-direction": textDirection
    };
    
    // Render appropriate icon
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
        console.log(`Unknown icon type: ${field.icon}`);
        return null;
    }
  };
  
  // Get actual label text
  const labelText = field.label || (language === 'ar' ? 'حقل نصي' : 'Text field');
  
  // Get placeholder text
  const placeholderText = field.placeholder || '';

  // Determine correct input type
  const getInputType = () => {
    const originalType = field.type;
    if (originalType === 'email') return 'email';
    if (originalType === 'phone') return 'tel';
    return 'text';
  };
  
  // Generate a unique ID
  const inputId = `${field.id}-input-${Date.now()}`;
  
  // Determine icon position based on direction
  const iconPosition = textDirection === 'rtl' ? 'right' : 'left';
  
  // Determine text alignment based on direction
  const labelAlignment = textDirection === 'rtl' ? 'right' : 'left';
  
  // Get direction class
  const directionClass = textDirection === 'rtl' ? 'rtl' : 'ltr';
  
  return (
    <div 
      className={`mb-4 codform-field codform-field-with-icon ${directionClass}`}
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
      data-direction={textDirection}
      dir={textDirection}
    >
      {showLabel && (
        <label 
          htmlFor={field.id} 
          className={`block mb-2 codform-field-label`}
          style={{ 
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            fontFamily: fontFamily,
            marginBottom: '8px',
            textAlign: labelAlignment
          }}
          data-label-text={labelText}
          dir={textDirection}
        >
          {labelText}
          {field.required && (
            <span className={`text-red-500 ml-1 codform-required ${textDirection === 'rtl' ? 'mr-1 ml-0' : ''}`}>*</span>
          )}
        </label>
      )}
      
      <div className={`codform-field-wrapper relative ${directionClass}`} dir={textDirection}>
        {/* Render icon with explicit positioning */}
        {showIcon && hasIcon && (
          <div 
            className={`codform-field-icon ${textDirection === 'rtl' ? 'rtl-icon' : 'ltr-icon'}`}
            style={{
              position: 'absolute',
              [iconPosition]: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}
            data-icon-type={field.icon}
            data-icon-visible="true"
            data-icon-position={iconPosition}
            dir={textDirection}
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
          className={`w-full outline-none transition-all codform-input ${directionClass} ${showIcon && hasIcon ? 'with-icon' : ''}`}
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
            paddingLeft: (showIcon && hasIcon && iconPosition === 'left') ? '36px' : '12px',
            paddingRight: (showIcon && hasIcon && iconPosition === 'right') ? '36px' : '12px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            width: '100%',
            height: 'auto',
            lineHeight: 1.5,
            textAlign: textDirection === 'rtl' ? 'right' : 'left'
          }}
          data-has-icon={hasIcon && showIcon ? 'true' : 'false'}
          data-icon-position={iconPosition}
          data-direction={textDirection}
          required={field.required}
          dir={textDirection}
        />
      </div>
      
      <div className={`codform-field-help ${directionClass}`} dir={textDirection}>
        {field.helpText && (
          <p 
            className={`mt-1 text-xs text-gray-500 codform-help-text ${directionClass}`}
            style={{
              marginTop: '4px',
              fontSize: '14px',
              color: '#6b7280',
              textAlign: labelAlignment
            }}
            dir={textDirection}
          >
            {field.helpText}
          </p>
        )}
        
        {field.errorMessage && field.required && (
          <div 
            className={`hidden error-message text-sm text-red-500 mt-1 codform-error-message ${directionClass}`}
            style={{
              display: 'none',
              color: '#ef4444',
              fontSize: '14px',
              marginTop: '4px',
              textAlign: labelAlignment
            }}
            dir={textDirection}
          >
            {field.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextInput;

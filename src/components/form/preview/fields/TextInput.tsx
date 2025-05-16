
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { User, Phone, MapPin, Mail, MessageSquare, CheckSquare, CircleCheck, Image, FileText } from 'lucide-react';

interface TextInputProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const TextInput: React.FC<TextInputProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Default values for styling
  const showLabel = fieldStyle.showLabel !== false;
  const labelColor = fieldStyle.labelColor || '#334155';
  const labelFontSize = fieldStyle.labelFontSize || formStyle.fontSize || '1rem';
  const labelFontWeight = fieldStyle.labelFontWeight || '500';
  
  const fontFamily = fieldStyle.fontFamily || 'inherit';
  const textColor = fieldStyle.color || '#1f2937';
  const fontSize = fieldStyle.fontSize || formStyle.fontSize || '1rem';
  const fontWeight = fieldStyle.fontWeight || '400';
  
  const backgroundColor = fieldStyle.backgroundColor || '#ffffff';
  const borderColor = fieldStyle.borderColor || '#d1d5db';
  const borderWidth = fieldStyle.borderWidth || '1px';
  const borderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
  const paddingY = fieldStyle.paddingY ? `${fieldStyle.paddingY}px` : '8px';
  
  // Explicitly check for showIcon (default to true if icon is present and not none)
  const showIcon = fieldStyle.showIcon !== undefined 
    ? fieldStyle.showIcon 
    : (field.icon && field.icon !== 'none');

  // Function to render the field icon based on the icon name
  const renderIcon = () => {
    // Don't render if icon is disabled or is set to 'none'
    if (!field.icon || field.icon === 'none' || !showIcon) return null;
    
    const iconProps = { 
      size: 18, 
      className: "text-gray-400"
    };
    
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
      default: return null;
    }
  };
  
  return (
    <div className="mb-4">
      {showLabel && (
        <label 
          htmlFor={field.id} 
          className={`block mb-2 ${field.required ? 'relative pr-2' : ''}`}
          style={{ 
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            fontFamily: fontFamily
          }}
        >
          {field.label || (language === 'ar' ? 'حقل نصي' : 'Text field')}
          {field.required && (
            <span className="text-red-500 absolute right-0 top-0">*</span>
          )}
        </label>
      )}
      
      <div className="relative">
        {showIcon && field.icon && field.icon !== 'none' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {renderIcon()}
          </div>
        )}
        
        <input
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          id={field.id}
          placeholder={field.placeholder || ''}
          aria-label={field.inputFor || field.label}
          className="w-full outline-none transition-all"
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
            paddingLeft: (showIcon && field.icon && field.icon !== 'none') ? '2.5rem' : '0.75rem',
            paddingRight: '0.75rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        />
      </div>
      
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      
      {field.errorMessage && field.required && (
        <div className="hidden error-message text-sm text-red-500 mt-1">
          {field.errorMessage}
        </div>
      )}
    </div>
  );
};

export default TextInput;

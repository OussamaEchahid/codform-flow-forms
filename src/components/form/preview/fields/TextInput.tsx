
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

// استيراد الأيقونات مباشرة لتجنب مشاكل التحميل الديناميكي
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
    formDirection?: 'ltr' | 'rtl';
  };
}

const TextInput: React.FC<TextInputProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // استخدام اتجاه النموذج من formStyle بدلاً من لغة الموقع
  const formDirection = formStyle.formDirection || 'ltr';
  
  // القيم الافتراضية للتنسيق
  const showLabel = fieldStyle.showLabel !== false;
  const labelColor = fieldStyle.labelColor || '#333333';
  const labelFontSize = fieldStyle.labelFontSize || '1rem';
  const labelFontWeight = fieldStyle.labelFontWeight || '600';
  
  const fontFamily = fieldStyle.fontFamily || 'inherit';
  const textColor = fieldStyle.color || 'rgb(31, 41, 55)';
  const fontSize = fieldStyle.fontSize || '1rem';
  const fontWeight = fieldStyle.fontWeight || '400';
  
  // خلفية بيضاء ثابتة للحقول - مطابقة للمتجر
  const backgroundColor = 'rgb(255, 255, 255)';
  const borderColor = fieldStyle.borderColor || 'rgb(209, 213, 219)';
  const borderWidth = fieldStyle.borderWidth || '1px';
  const borderRadius = '1.5rem'; // توحيد مع المتجر
  const paddingY = fieldStyle.paddingY ? `${fieldStyle.paddingY}px` : '10px';
  
  // تحديد إذا كان هناك أيقونة وإذا كان يجب إظهارها
  const hasIcon = field.icon && field.icon !== 'none' && field.icon !== '';
  const showIcon = fieldStyle.showIcon !== undefined ? fieldStyle.showIcon : hasIcon;
  
  // تحسين وظيفة عرض الأيقونات مع التشخيص الإضافي
  const renderIcon = () => {
    if (!hasIcon || !showIcon) return null;
    
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
      default: 
        return null;
    }
  };
  
  const labelText = field.label || (language === 'ar' ? 'حقل نصي' : 'Text field');
  const placeholderText = field.placeholder || '';

  const getInputType = () => {
    const originalType = field.type;
    if (originalType === 'email') return 'email';
    if (originalType === 'phone') return 'tel';
    return 'text';
  };
  
  const inputId = `${field.id}-input`;
  
  return (
    <div 
      className="mb-4" 
      style={{ marginBottom: '16px', background: 'transparent' }}
      dir={formDirection} // استخدام اتجاه النموذج
    >
      {showLabel && (
        <label 
          htmlFor={inputId} 
          className="block mb-2"
          style={{ 
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            fontFamily: fontFamily,
            marginBottom: '8px',
            display: 'block',
            backgroundColor: 'transparent',
            background: 'transparent',
            padding: '0'
          }}
        >
          {labelText}
          {field.required && (
            <span 
              className="text-red-500" 
              style={{
                marginRight: formDirection === 'rtl' ? '0' : '4px',
                marginLeft: formDirection === 'rtl' ? '4px' : '0',
                color: 'rgb(239, 68, 68)'
              }}
            >
              *
            </span>
          )}
        </label>
      )}
      
      <div className="relative" style={{ position: 'relative', background: 'transparent' }}>
        {showIcon && hasIcon && (
          <div 
            className="absolute codform-field-icon" 
            style={{
              position: 'absolute',
              left: '12px', // دائماً على اليسار
              right: 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              color: 'rgb(156, 163, 175)',
              background: 'transparent'
            }}
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
            padding: paddingY,
            paddingLeft: (showIcon && hasIcon) ? '36px' : '12px',
            paddingRight: '12px',
            boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px',
            width: '100%',
            height: 'auto',
            lineHeight: 1.5,
            minHeight: '44px',
            boxSizing: 'border-box',
            direction: formDirection,
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          required={field.required}
        />
      </div>
      
      {field.helpText && (
        <p 
          className="mt-1 text-xs text-gray-500 codform-help-text" 
          style={{
            marginTop: '6px',
            fontSize: '14px',
            color: '#6b7280',
            background: 'transparent',
            padding: '0'
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default TextInput;

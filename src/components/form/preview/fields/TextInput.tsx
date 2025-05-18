
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
  };
}

const TextInput: React.FC<TextInputProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // القيم الافتراضية للتنسيق
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
  
  // تحديد إذا كان هناك أيقونة وإذا كان يجب إظهارها
  const hasIcon = field.icon && field.icon !== 'none' && field.icon !== '';
  const showIcon = fieldStyle.showIcon !== undefined ? fieldStyle.showIcon : hasIcon;
  
  // تحسين وظيفة عرض الأيقونات مع التشخيص الإضافي
  const renderIcon = () => {
    if (!hasIcon || !showIcon) return null;
    
    // إضافة سمات إضافية للتشخيص
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
    
    // تسجيل معلومات عن أي أيقونة يتم عرضها للمساعدة في التشخيص
    console.log(`Rendering icon: ${field.icon} for field ${field.id}`);
    
    // استخدام switch للمطابقة الدقيقة وإرجاع عنصر React المناسب
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
  
  // الحصول على نص التسمية الفعلي للعرض
  const labelText = field.label || (language === 'ar' ? 'حقل نصي' : 'Text field');
  
  // الحصول على نص العنصر البديل الفعلي للعرض
  const placeholderText = field.placeholder || '';

  // تحديد نوع الإدخال الصحيح بناءً على نوع الحقل
  const getInputType = () => {
    const originalType = field.type;
    if (originalType === 'email') return 'email';
    if (originalType === 'phone') return 'tel';
    return 'text';
  };
  
  // إضافة معرف فريد للمساعدة في ضمان تطابق العرض والتحديثات
  const inputId = `${field.id}-input`;
  
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
    >
      {showLabel && (
        <label 
          htmlFor={field.id} 
          className={`block mb-2 ${field.required ? 'relative pr-2' : ''}`}
          style={{ 
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            fontFamily: fontFamily,
            marginBottom: '8px'
          }}
          data-label-text={labelText}
        >
          {labelText}
          {field.required && (
            <span className="text-red-500 absolute right-0 top-0">*</span>
          )}
        </label>
      )}
      
      <div className="relative">
        {/* Render the icon if it should be shown */}
        {showIcon && hasIcon && (
          <div 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 codform-field-icon" 
            style={{
              position: 'absolute',
              left: '12px',
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
            paddingLeft: (showIcon && hasIcon) ? '36px' : '12px',
            paddingRight: '12px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            width: '100%',
            height: 'auto',
            lineHeight: 1.5
          }}
          data-has-icon={hasIcon && showIcon ? 'true' : 'false'}
          required={field.required}
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


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
  const paddingY = fieldStyle.paddingY ? `${fieldStyle.paddingY}px` : '8px';
  
  // تحسين معالجة إظهار الأيقونة - تصحيح الأخطاء من الإصدار السابق
  const hasIcon = field.icon && field.icon !== 'none';
  const showIcon = fieldStyle.showIcon !== undefined ? fieldStyle.showIcon : hasIcon;
  
  // وظيفة محسنة لعرض أيقونة الحقل بناءً على اسم الأيقونة
  const renderIcon = () => {
    if (!hasIcon || !showIcon) return null;
    
    // تحسين خصائص الأيقونات لحل مشكلة TypeScript
    const iconProps = { 
      size: 18,
      className: "text-gray-400",
      "aria-hidden": true, // استخدام قيمة منطقية boolean بدلاً من سلسلة نصية string
      "data-testid": `icon-${field.icon}` // استخدام data-testid للاختبارات
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
  
  // إضافة سمات البيانات تفصيلية لتحسين التوافق بين المعاينة والمتجر
  const dataAttributes = {
    'data-field-type': field.type,
    'data-field-id': field.id,
    'data-show-label': showLabel.toString(),
    'data-label-text': labelText,
    'data-has-icon': hasIcon ? 'true' : 'false',
    'data-show-icon': showIcon ? 'true' : 'false',
    'data-icon-type': field.icon || 'none',
    'data-required': field.required ? 'true' : 'false',
    'data-font-family': fontFamily,
    'data-font-size': fontSize,
    'data-border-radius': borderRadius,
    'data-input-id': inputId,
  };
  
  return (
    <div className="mb-0" data-component="TextInput" {...dataAttributes}>
      {showLabel && (
        <label 
          htmlFor={field.id} 
          className={`block mb-1 ${field.required ? 'relative pr-2' : ''}`}
          style={{ 
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            fontFamily: fontFamily
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
        {showIcon && hasIcon && (
          <div 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 codform-field-icon" 
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
            paddingLeft: (showIcon && hasIcon) ? '2.5rem' : '0.75rem',
            paddingRight: '0.75rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            marginBottom: '0',
          }}
          data-has-icon={hasIcon && showIcon ? 'true' : 'false'}
          required={field.required}
        />
      </div>
      
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500 codform-help-text">{field.helpText}</p>
      )}
      
      {field.errorMessage && field.required && (
        <div className="hidden error-message text-sm text-red-500 mt-1 codform-error-message">
          {field.errorMessage}
        </div>
      )}
    </div>
  );
};

export default TextInput;

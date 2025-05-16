
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
  
  // تطبيع معالجة الأيقونة - التحقق صراحة مما إذا كان showIcon محددًا أولاً
  const showIcon = fieldStyle.showIcon !== undefined 
    ? fieldStyle.showIcon 
    : (field.icon && field.icon !== 'none');

  // وظيفة لعرض أيقونة الحقل بناءً على اسم الأيقونة
  const renderIcon = () => {
    // لا تعرض إذا كانت الأيقونة معطلة أو تم تعيينها إلى 'none'
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
  
  // الحصول على نص التسمية الفعلي للعرض - استخدام القيمة الأحدث
  const labelText = field.label || (language === 'ar' ? 'حقل نصي' : 'Text field');
  
  // الحصول على نص العنصر البديل الفعلي للعرض - استخدام القيمة الأحدث
  const placeholderText = field.placeholder || '';

  // فرض مفتاح المكون للتحديث عند تغيير البيانات
  const componentKey = `${field.id}-${labelText}-${placeholderText}-${JSON.stringify(fieldStyle)}-${field.icon || 'none'}-${Date.now()}`;
  
  // تحديد نوع الإدخال الصحيح بناءً على نوع الحقل
  const getInputType = () => {
    const originalType = field.type;
    if (originalType === 'email') return 'email';
    if (originalType === 'phone') return 'tel';
    return 'text';
  };
  
  // إضافة سمات البيانات للمساعدة في ضمان تطابق العرض
  const inputAttributes = {
    'data-field-type': field.type,
    'data-show-label': showLabel.toString(),
    'data-label-color': labelColor,
    'data-label-font-size': labelFontSize,
    'data-font-family': fontFamily,
    'data-text-color': textColor,
    'data-font-size': fontSize,
    'data-has-icon': showIcon && field.icon && field.icon !== 'none' ? 'true' : 'false',
    'data-icon': field.icon || 'none',
    'data-border-radius': borderRadius,
    'data-required': field.required ? 'true' : 'false',
  };
  
  return (
    <div className="mb-0" key={componentKey} {...inputAttributes}>
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
        >
          {labelText}
          {field.required && (
            <span className="text-red-500 absolute right-0 top-0">*</span>
          )}
        </label>
      )}
      
      <div className="relative">
        {showIcon && field.icon && field.icon !== 'none' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 codform-field-icon">
            {renderIcon()}
          </div>
        )}
        
        <input
          type={getInputType()}
          id={field.id}
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
            paddingLeft: (showIcon && field.icon && field.icon !== 'none') ? '2.5rem' : '0.75rem',
            paddingRight: '0.75rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            marginBottom: '0', // إزالة الهامش السفلي
          }}
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


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
  // Normalizamos el procesamiento de iconos - verificamos explícitamente si showIcon está definido primero
  const showIcon = fieldStyle.showIcon !== undefined 
    ? fieldStyle.showIcon 
    : (field.icon && field.icon !== 'none');

  // وظيفة لعرض أيقونة الحقل بناءً على اسم الأيقونة
  // Función para mostrar el icono del campo según el nombre del icono
  const renderIcon = () => {
    // لا تعرض إذا كانت الأيقونة معطلة أو تم تعيينها إلى 'none'
    // No mostrar si el icono está desactivado o está configurado como 'none'
    if (!field.icon || field.icon === 'none' || !showIcon) return null;
    
    const iconProps = { 
      size: 18, 
      className: "text-gray-400"
    };
    
    // Aseguramos que los iconos sean accesibles tanto en el preview como en la tienda
    // Creamos SVGs inline para mayor compatibilidad
    switch(field.icon) {
      case 'user': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        );
      case 'phone': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        );
      case 'map-pin': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        );
      case 'mail': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        );
      case 'message-square': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        );
      case 'check-square': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        );
      case 'circle-check': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'image': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        );
      case 'file-text': 
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      default: return null;
    }
  };
  
  // الحصول على نص التسمية الفعلي للعرض - استخدام القيمة الأحدث
  // Obtener el texto de la etiqueta actual para mostrar - usar el valor más reciente
  const labelText = field.label || (language === 'ar' ? 'حقل نصي' : 'Text field');
  
  // الحصول على نص العنصر البديل الفعلي للعرض - استخدام القيمة الأحدث
  // Obtener el texto del marcador de posición actual para mostrar - usar el valor más reciente
  const placeholderText = field.placeholder || '';

  // فرض مفتاح المكون للتحديث عند تغيير البيانات
  // Imponer una clave de componente para actualizar cuando los datos cambien
  const componentKey = `${field.id}-${labelText}-${placeholderText}-${JSON.stringify(fieldStyle)}-${field.icon || 'none'}-${Date.now()}`;
  
  // تحديد نوع الإدخال الصحيح بناءً على نوع الحقل
  // Determinar el tipo de entrada correcto según el tipo de campo
  const getInputType = () => {
    const originalType = field.type;
    if (originalType === 'email') return 'email';
    if (originalType === 'phone') return 'tel';
    return 'text';
  };

  // Obtener la alineación del texto de la etiqueta basada en el idioma
  const labelAlign = language === 'ar' ? 'right' : 'left';
  
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
    'dir': language === 'ar' ? 'rtl' : 'ltr',
  };
  
  return (
    <div className="mb-4" key={componentKey} {...inputAttributes}>
      {showLabel && (
        <label 
          htmlFor={field.id} 
          className={`block mb-1 ${field.required ? 'relative pr-2' : ''}`}
          style={{ 
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            fontFamily: fontFamily,
            textAlign: labelAlign
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
            width: '100%',
            display: 'block',
            height: 'auto',
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

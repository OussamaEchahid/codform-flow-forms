
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

// استيراد الأيقونات مباشرة لتجنب مشاكل التحميل الديناميكي
import {
  User,
  Users,
  IdCard,
  Crown,
  Star,
  Award,
  Diamond,
  Phone,
  Smartphone,
  PhoneCall,
  Zap,
  Target,
  MapPin,
  Home,
  Building,
  Map,
  Truck,
  Mail,
  MessageSquare,
  StickyNote,
  Edit,
  Sparkles,
  Heart,
  CheckSquare,
  CircleCheck,
  Image,
  FileText
} from 'lucide-react';

interface TextInputProps {
  field: FormField & {
    onChange?: (value: string) => void;
  };
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    formDirection?: 'ltr' | 'rtl';
    floatingLabels?: boolean;
    focusBorderColor?: string;
    fieldBorderColor?: string;
    fieldBorderWidth?: string;
    fieldBorderRadius?: string;
  };
  formCountry?: string;
  formPhonePrefix?: string;
}

const TextInput: React.FC<TextInputProps> = ({ field, formStyle, formCountry = 'SA', formPhonePrefix = '+966' }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // استخدام اتجاه النموذج من formStyle
  const formDirection = formStyle.formDirection || 'ltr';
  
  // القيم الافتراضية للتنسيق
  const showLabel = fieldStyle.showLabel !== false;
  const labelColor = fieldStyle.labelColor || '#333333';
  const labelFontSize = fieldStyle.labelFontSize || '15px';
  const labelFontWeight = fieldStyle.labelFontWeight || '500';
  
  const fontFamily = language === 'ar' ? "'Cairo', sans-serif" : (fieldStyle.fontFamily || 'inherit');
  const textColor = fieldStyle.color || 'rgb(31, 41, 55)';
  const fontSize = fieldStyle.fontSize?.replace('px', '') ? `${fieldStyle.fontSize.replace('px', '')}px` : '15px';
  const fontWeight = fieldStyle.fontWeight || '400';
  
  // خلفية بيضاء ثابتة للحقول
  const backgroundColor = 'rgb(255, 255, 255)';
  const borderColor = fieldStyle.borderColor || formStyle.fieldBorderColor || 'rgb(209, 213, 219)';
  const borderWidth = fieldStyle.borderWidth || formStyle.fieldBorderWidth || '1px';
  const borderRadius = fieldStyle.borderRadius || formStyle.fieldBorderRadius || '8px';
  const focusBorderColor = formStyle.focusBorderColor || formStyle.primaryColor || '#9b87f5';
  // حساب paddingY ديناميكياً بناءً على حجم الخط
  const baseFontSize = 15; // الحجم الأساسي للخط
  const currentFontSize = parseInt(fontSize.replace('px', '')) || baseFontSize;
  const fontSizeRatio = currentFontSize / baseFontSize;
  const basePaddingY = fieldStyle.paddingY?.replace('px', '') ? parseInt(fieldStyle.paddingY.replace('px', '')) : 10;
  const dynamicPaddingY = Math.max(8, Math.round(basePaddingY * fontSizeRatio));
  const paddingY = `${dynamicPaddingY}px`;
  
  // تحديد إذا كان هناك أيقونة وإذا كان يجب إظهارها
  const hasIcon = field.icon && field.icon !== 'none' && field.icon !== '';
  const showIcon = fieldStyle.showIcon !== undefined ? fieldStyle.showIcon : hasIcon;
  
  // تحديد موضع الأيقونة بناءً على اتجاه النموذج
  const iconPosition = formDirection === 'rtl' ? 'right' : 'left';
  
  // تحسين وظيفة عرض الأيقونات
  const renderIcon = () => {
    if (!hasIcon || !showIcon) return null;
    
    const iconProps = { 
      size: 18,
      className: "codform-icon",
      style: {
        width: '18px',
        height: '18px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: field.style?.iconColor || '#6b7280'
      },
      "aria-hidden": true as boolean,
    };
    
    switch(field.icon) {
      // أيقونات الاسم
      case 'user': return <User {...iconProps} />;
      case 'users': return <Users {...iconProps} />;
      case 'id-card': return <IdCard {...iconProps} />;
      case 'crown': return <Crown {...iconProps} />;
      case 'star': return <Star {...iconProps} />;
      case 'award': return <Award {...iconProps} />;
      case 'diamond': return <Diamond {...iconProps} />;
      
      // أيقونات الهاتف
      case 'phone': return <Phone {...iconProps} />;
      case 'smartphone': return <Smartphone {...iconProps} />;
      case 'phone-call': return <PhoneCall {...iconProps} />;
      
      // أيقونات العنوان
      case 'map-pin': return <MapPin {...iconProps} />;
      case 'home': return <Home {...iconProps} />;
      case 'building': return <Building {...iconProps} />;
      case 'map': return <Map {...iconProps} />;
      case 'truck': return <Truck {...iconProps} />;
      
      // أيقونات الرسائل والبريد
      case 'mail': return <Mail {...iconProps} />;
      case 'message-square': return <MessageSquare {...iconProps} />;
      case 'sticky-note': return <StickyNote {...iconProps} />;
      case 'edit': return <Edit {...iconProps} />;
      case 'sparkles': return <Sparkles {...iconProps} />;
      case 'heart': return <Heart {...iconProps} />;
      
      // أيقونات عامة
      case 'zap': return <Zap {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      case 'check-square': return <CheckSquare {...iconProps} />;
      case 'circle-check': return <CircleCheck {...iconProps} />;
      case 'image': return <Image {...iconProps} />;
      case 'file-text': return <FileText {...iconProps} />;
      
      default: 
        return null;
    }
  };
  
  const labelText = field.label || (language === 'ar' ? 'حقل نصي' : 'Text field');
  let placeholderText = field.placeholder || '';
  
  // استخدام كود الدولة الصحيح من إعدادات النموذج
  if (field.type === 'phone' && placeholderText && !placeholderText.includes('+')) {
    // استخدام formPhonePrefix من إعدادات النموذج بدلاً من القيمة الافتراضية
    const actualPhonePrefix = formPhonePrefix || '+966';
    placeholderText = `${actualPhonePrefix} ${placeholderText}`;
  }

  const getInputType = () => {
    const originalType = field.type;
    if (originalType === 'email') return 'email';
    if (originalType === 'phone') return 'tel';
    return 'text';
  };
  
  const inputId = `${field.id}-input`;
  
  // FIXED: حساب المسافات الداخلية للنص بناءً على وجود الأيقونة واتجاه النموذج
  const paddingLeft = formDirection === 'rtl' 
    ? '12px'  // في العربي، النص على اليمين فلا نحتاج padding إضافي على اليسار
    : ((showIcon && hasIcon) ? '40px' : '12px'); // في الإنجليزي، الأيقونة على اليسار
    
  const paddingRight = formDirection === 'rtl' 
    ? ((showIcon && hasIcon) ? '40px' : '12px') // في العربي، الأيقونة على اليمين
    : '12px'; // في الإنجليزي، لا نحتاج padding إضافي على اليمين
  
  const isFloatingLabels = formStyle.floatingLabels;
  const [hasValue, setHasValue] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div 
      className="mb-2" 
      style={{ background: 'transparent' }}
      dir={formDirection}
    >
      {showLabel && !isFloatingLabels && (
        <label 
          htmlFor={inputId} 
          className="block mb-2"
          style={{ 
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            fontFamily: fontFamily,
            marginBottom: '4px',
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
              left: iconPosition === 'left' ? '12px' : 'auto',
              right: iconPosition === 'right' ? '12px' : 'auto',
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

        {/* Floating label */}
        {showLabel && isFloatingLabels && (
          <label 
            htmlFor={inputId} 
            className="absolute transition-all pointer-events-none"
            style={{
              position: 'absolute',
              left: formDirection === 'rtl' ? 'auto' : ((showIcon && hasIcon) ? '40px' : '12px'),
              right: formDirection === 'rtl' ? ((showIcon && hasIcon) ? '40px' : '12px') : 'auto',
              top: (hasValue || isFocused) ? '-8px' : '50%',
              transform: (hasValue || isFocused) ? 'translateY(0)' : 'translateY(-50%)',
              fontSize: (hasValue || isFocused) ? '12px' : labelFontSize,
              color: isFocused ? (formStyle.primaryColor || '#9b87f5') : labelColor,
              fontWeight: labelFontWeight,
              fontFamily: fontFamily,
              backgroundColor: backgroundColor,
              padding: (hasValue || isFocused) ? '0 4px' : '0',
              zIndex: 3,
              transition: 'all 0.2s ease',
              pointerEvents: 'none'
            }}
          >
            {labelText}
            {field.required && (
              <span 
                style={{
                  marginLeft: formDirection === 'rtl' ? '0' : '4px',
                  marginRight: formDirection === 'rtl' ? '4px' : '0',
                  color: 'rgb(239, 68, 68)'
                }}
              >
                *
              </span>
            )}
          </label>
        )}
        
        <input
          type={getInputType()}
          id={inputId}
          name={field.id}
          placeholder={isFloatingLabels ? '' : placeholderText}
          aria-label={field.inputFor || labelText}
          className="w-full outline-none transition-all codform-input codform-fixed-placeholder"
          style={{
            color: textColor,
            fontSize: fontSize,
            fontWeight: fontWeight,
            fontFamily: fontFamily,
            backgroundColor: backgroundColor,
            borderColor: isFocused ? focusBorderColor : borderColor,
            borderRadius: borderRadius,
            borderWidth: borderWidth,
            borderStyle: 'solid',
            paddingTop: paddingY,
            paddingBottom: paddingY,
            paddingLeft: paddingLeft,
            paddingRight: paddingRight,
            boxShadow: isFocused 
              ? `0 0 0 3px ${focusBorderColor}20` 
              : 'rgba(0, 0, 0, 0.05) 0px 1px 2px',
            width: '100%',
            minHeight: '44px',
            height: 'auto',
            lineHeight: Math.max(1.2, 1.5 - (fontSizeRatio - 1) * 0.2),
            boxSizing: 'border-box',
            direction: formDirection,
            textAlign: formDirection === 'rtl' ? 'right' : 'left',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          required={field.required}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(e.target.value.length > 0);
          }}
          onChange={(e) => {
            setHasValue(e.target.value.length > 0);
            if (field.onChange) {
              field.onChange(e.target.value);
            }
          }}
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

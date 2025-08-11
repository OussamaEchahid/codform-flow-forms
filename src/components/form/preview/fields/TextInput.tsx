
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
  
  // 🔥 تطبيق fontSize مباشر بنفس منطق TextArea المُجرب 
  console.log('🔧 TextInput FIXED VERSION:', {
    fieldId: field.id,
    fontSize: fieldStyle.fontSize,
    labelFontSize: fieldStyle.labelFontSize,
    hasIcon: field.icon
  });
  
  // تحديد القيم الافتراضية للحجم
  const actualFontSize = fieldStyle.fontSize || '16px';
  const actualLabelFontSize = fieldStyle.labelFontSize || '16px';
  
  // إعدادات التسمية
  const showLabel = fieldStyle.showLabel !== false;
  const labelColor = fieldStyle.labelColor || '#334155';
  const labelFontWeight = fieldStyle.labelFontWeight || '500';
  
  // Set default values for border styling - نفس TextArea
  const inputBorderRadius = fieldStyle.borderRadius || formStyle.fieldBorderRadius || '8px';
  const inputBorderWidth = fieldStyle.borderWidth || formStyle.fieldBorderWidth || '1px';
  const inputBorderColor = fieldStyle.borderColor || formStyle.fieldBorderColor || '#d1d5db';
  const focusBorderColor = formStyle.focusBorderColor || formStyle.primaryColor || '#9b87f5';
  
  // تحديد إذا كان هناك أيقونة وإذا كان يجب إظهارها
  const actualIcon = field.style?.icon || field.icon;
  const hasIcon = !!(actualIcon && actualIcon !== 'none' && actualIcon !== '');
  const showIcon = fieldStyle.showIcon !== undefined ? fieldStyle.showIcon : hasIcon;
  const iconSize = parseInt(String(field.style?.iconSize || '18').replace('px','')) || 18;
  
  // تحديد موضع الأيقونة مع إمكانية تخصيصها من الإعدادات
  const iconPosition = field.style?.iconPosition || (formDirection === 'rtl' ? 'right' : 'left');
  
  // تحسين وظيفة عرض الأيقونات
  const renderIcon = () => {
    if (!hasIcon || !showIcon) return null;
    
    const iconProps = { 
      size: iconSize,
      className: "codform-icon",
      style: {
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: field.style?.iconColor || '#6b7280'
      },
      "aria-hidden": true as boolean,
    };
    
    switch(actualIcon) {
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
    ? '12px'
    : ((showIcon && hasIcon) ? `${12 + iconSize + 10}px` : '12px');
    
  const paddingRight = formDirection === 'rtl' 
    ? ((showIcon && hasIcon) ? `${12 + iconSize + 10}px` : '12px')
    : '12px';
  
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
              fontSize: actualLabelFontSize,
              fontWeight: labelFontWeight,
              fontFamily: fieldStyle.fontFamily || 'inherit',
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
              zIndex: 10,
              color: fieldStyle.iconColor || '#6b7280',
              background: 'transparent',
              pointerEvents: 'none',
              width: `${iconSize}px`,
              height: `${iconSize}px`
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
              fontSize: (hasValue || isFocused) ? '12px' : actualLabelFontSize,
              color: isFocused ? (formStyle.primaryColor || '#9b87f5') : labelColor,
              fontWeight: labelFontWeight,
              fontFamily: fieldStyle.fontFamily || 'inherit',
              backgroundColor: '#FFFFFF',
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
          className="w-full py-2 px-3 bg-white border outline-none focus:ring-2 focus:ring-opacity-50 transition-all codform-text-input-custom"
          style={{
            color: fieldStyle.color || '#1f2937',
            fontSize: actualFontSize,
            fontWeight: fieldStyle.fontWeight || '400',
            fontFamily: fieldStyle.fontFamily || 'inherit',
            backgroundColor: '#FFFFFF',
            borderColor: isFocused ? focusBorderColor : inputBorderColor,
            borderRadius: inputBorderRadius,
            borderWidth: inputBorderWidth,
            borderStyle: 'solid',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: paddingLeft,
            paddingRight: paddingRight,
            boxShadow: isFocused 
              ? `0 0 0 3px ${focusBorderColor}20` 
              : '0 1px 2px rgba(0, 0, 0, 0.05)',
            width: '100%',
            minHeight: '44px',
            height: 'auto',
            lineHeight: 1.5,
            direction: formDirection,
            textAlign: formDirection === 'rtl' ? 'right' : 'left',
            transition: 'all 0.2s ease',
            zIndex: 2,
            position: 'relative'
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

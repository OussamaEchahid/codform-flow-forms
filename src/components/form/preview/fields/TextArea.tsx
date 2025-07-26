
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

// استيراد الأيقونات الجديدة
import {
  MapPin,
  Home,
  Building,
  Map,
  Truck,
  Target,
  Mail,
  MessageSquare,
  StickyNote,
  Edit,
  Sparkles,
  Heart,
  Star
} from 'lucide-react';

interface TextAreaProps {
  field: FormField & {
    onChange?: (value: string) => void;
  };
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    formDirection?: 'ltr' | 'rtl';
    floatingLabels?: boolean;
  };
}

const TextArea: React.FC<TextAreaProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // استخدام اتجاه النموذج من formStyle
  const formDirection = formStyle.formDirection || 'ltr';
  
  // Set default values for styling
  const showLabel = fieldStyle.showLabel !== false;
  const labelColor = fieldStyle.labelColor || '#334155';
  const labelFontSize = fieldStyle.labelFontSize || formStyle.fontSize || '16px';
  const labelFontWeight = fieldStyle.labelFontWeight || '500';
  
  // Set default values for border styling - force smaller radius for textarea
  const inputBorderRadius = fieldStyle.borderRadius || '8px';
  const inputBorderWidth = fieldStyle.borderWidth || '1px';
  
  // Set default rows
  const rows = field.rows || 4;

  const isFloatingLabels = formStyle.floatingLabels;
  const [hasValue, setHasValue] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  
  // دالة لعرض الأيقونة
  const renderIcon = () => {
    if (!field.icon || field.icon === 'none' || !field.style?.showIcon) return null;
    
    const iconProps = {
      size: 16,
      style: { 
        color: field.style?.iconColor || fieldStyle.color || '#6b7280',
        marginRight: language === 'ar' ? '0' : '8px',
        marginLeft: language === 'ar' ? '8px' : '0'
      }
    };

    switch(field.icon) {
      // أيقونات العنوان
      case 'map-pin': return <MapPin {...iconProps} />;
      case 'home': return <Home {...iconProps} />;
      case 'building': return <Building {...iconProps} />;
      case 'map': return <Map {...iconProps} />;
      case 'truck': return <Truck {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      
      // أيقونات الرسائل والملاحظات
      case 'mail': return <Mail {...iconProps} />;
      case 'message-square': return <MessageSquare {...iconProps} />;
      case 'sticky-note': return <StickyNote {...iconProps} />;
      case 'edit': return <Edit {...iconProps} />;
      case 'sparkles': return <Sparkles {...iconProps} />;
      case 'heart': return <Heart {...iconProps} />;
      case 'star': return <Star {...iconProps} />;
      
      default: 
        return null;
    }
  };
  
  return (
    <div className="mb-4" dir={formDirection}>
      {showLabel && !isFloatingLabels && (
        <label 
          htmlFor={field.id} 
          className={`block mb-2 ${field.required ? 'relative' : ''}`}
          style={{ 
            color: labelColor,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            fontFamily: fieldStyle.fontFamily || 'inherit',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {renderIcon()}
          {field.label || (language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes')}
          {field.required && (
            <span 
              className="text-red-500" 
              style={{
                marginRight: language === 'ar' ? '0' : '4px',
                marginLeft: language === 'ar' ? '4px' : '0',
              }}
            >
              *
            </span>
          )}
        </label>
      )}
      
      <div className="relative" style={{ position: 'relative' }}>
        {/* Floating label */}
        {showLabel && isFloatingLabels && (
          <label 
            htmlFor={field.id} 
            className="absolute transition-all pointer-events-none"
            style={{
              position: 'absolute',
              left: formDirection === 'rtl' ? 'auto' : '12px',
              right: formDirection === 'rtl' ? '12px' : 'auto',
              top: (hasValue || isFocused) ? '-8px' : '20px',
              transform: (hasValue || isFocused) ? 'translateY(0)' : 'translateY(0)',
              fontSize: (hasValue || isFocused) ? '12px' : labelFontSize,
              color: isFocused ? (formStyle.primaryColor || '#9b87f5') : labelColor,
              fontWeight: labelFontWeight,
              fontFamily: fieldStyle.fontFamily || 'inherit',
              backgroundColor: '#FFFFFF',
              padding: (hasValue || isFocused) ? '0 4px' : '0',
              zIndex: 3,
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {renderIcon()}
            {field.label || (language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes')}
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
        
        <textarea
          id={field.id}
          rows={rows}
          placeholder={isFloatingLabels ? '' : (field.placeholder || '')}
          className="w-full py-2 px-3 bg-white border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
          style={{
            color: fieldStyle.color || '#1f2937',
            fontSize: fieldStyle.fontSize || formStyle.fontSize || '16px',
            fontWeight: fieldStyle.fontWeight || '400',
            fontFamily: fieldStyle.fontFamily || 'inherit',
            backgroundColor: '#FFFFFF',
            borderColor: isFocused ? (formStyle.primaryColor || '#9b87f5') : (fieldStyle.borderColor || '#d1d5db'),
            borderRadius: inputBorderRadius,
            borderWidth: inputBorderWidth,
            borderStyle: 'solid',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '12px',
            paddingRight: '12px',
            boxShadow: isFocused 
              ? `0 0 0 3px ${formStyle.primaryColor || '#9b87f5'}20` 
              : '0 1px 2px rgba(0, 0, 0, 0.05)',
            width: '100%',
            minHeight: '80px',
            height: '80px',
            resize: 'none',
            lineHeight: 1.5,
            direction: formDirection,
            textAlign: formDirection === 'rtl' ? 'right' : 'left',
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
          className="mt-1 text-sm text-gray-500"
          style={{
            marginTop: '4px',
            fontSize: '14px',
            color: '#6b7280'
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default TextArea;

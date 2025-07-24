
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
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const TextArea: React.FC<TextAreaProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Set default values for styling
  const labelColor = fieldStyle.labelColor || '#334155';
  const labelFontSize = fieldStyle.labelFontSize || formStyle.fontSize || '16px';
  const labelFontWeight = fieldStyle.labelFontWeight || '500';
  
  // Set default values for border styling - force smaller radius for textarea
  const inputBorderRadius = fieldStyle.borderRadius || '12px';
  const inputBorderWidth = fieldStyle.borderWidth || '1px';
  
  // Set default rows
  const rows = field.rows || 4;
  
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
    <div className="mb-4" style={{ marginBottom: '20px' }}>
      <label 
        htmlFor={field.id} 
        className={`block mb-2 ${field.required ? 'relative' : ''}`}
        style={{ 
          color: labelColor,
          fontSize: labelFontSize,
          fontWeight: labelFontWeight,
          fontFamily: "'Cairo', inherit",
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
      
      <textarea
        id={field.id}
        rows={rows}
        placeholder={field.placeholder || ''}
        className="w-full py-2 px-3 bg-white border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
        style={{
          color: fieldStyle.color || '#1F2937',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '16px',
          fontWeight: fieldStyle.fontWeight || '400',
          fontFamily: "'Cairo', inherit",
          backgroundColor: '#FFFFFF',
          borderColor: fieldStyle.borderColor || '#D1D5DB',
          borderRadius: inputBorderRadius,
          borderWidth: inputBorderWidth,
          borderStyle: 'solid',
          paddingTop: '10px',
          paddingBottom: '10px',
          paddingLeft: '12px',
          paddingRight: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          width: '100%',
          minHeight: '80px',
          height: '80px',
          resize: 'none',
          lineHeight: 1.5,
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#9b87f5';
          e.target.style.boxShadow = '0 0 0 3px rgba(155, 135, 245, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#D1D5DB';
          e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        }}
        required={field.required}
      />
      
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

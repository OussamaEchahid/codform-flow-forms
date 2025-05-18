
import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';

interface TextInputProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
}

const TextInput: React.FC<TextInputProps> = ({ field, formStyle }) => {
  const [value, setValue] = useState('');
  const isRtl = document.dir === 'rtl' || false;
  
  // استخراج الخصائص اللازمة مع القيم الافتراضية
  const {
    label,
    placeholder = '',
    required = false,
    icon,
    type = 'text',
  } = field;
  
  // الحصول على خصائص النمط مع القيم الافتراضية
  const {
    fontSize = formStyle.fontSize || '16px',
    showIcon = icon && icon !== 'none',
  } = field.style || {};

  // تسجيل تقديم الأيقونة لتصحيح الأخطاء
  if (icon && icon !== 'none' && showIcon) {
    console.log(`Rendering icon: ${icon} for field ${field.id}`);
  }

  // تعيين نوع الإدخال بناءً على نوع الحقل
  const inputType = field.type === 'phone' ? 'tel' : 
                    field.type === 'email' ? 'email' : 
                    'text';

  // معالجة عرض الأيقونة بناءً على اتجاه اللغة
  const iconPosition = isRtl ? 'right' : 'left';
  const iconClass = icon && showIcon ? `has-icon icon-${iconPosition}` : '';
  
  // إضافة سمات البيانات لاتساق النمط
  const dataAttributes = {
    'data-field-type': field.type,
    'data-has-icon': icon && icon !== 'none' && showIcon ? 'true' : 'false',
    'data-icon': icon || 'none',
    'data-icon-position': iconPosition,
  };
  
  return (
    <div className="form-field" {...dataAttributes}>
      {label && (
        <label className="block text-sm font-medium mb-1 form-label" style={{ fontSize }}>
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}
      <div className={`relative ${iconClass}`}>
        {icon && icon !== 'none' && showIcon && (
          <div className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`}>
            <i className={`icon icon-${icon}`} aria-hidden="true"></i>
          </div>
        )}
        <input
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          required={required}
          className={`w-full border rounded-md px-4 py-2 bg-white ${icon && showIcon ? (isRtl ? 'pr-10' : 'pl-10') : ''}`}
          style={{
            fontSize,
            borderRadius: formStyle.borderRadius || '0.375rem',
          }}
        />
      </div>
    </div>
  );
};

export default TextInput;

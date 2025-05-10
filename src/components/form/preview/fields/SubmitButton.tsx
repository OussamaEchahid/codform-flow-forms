
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface SubmitButtonProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  const isRtl = language === 'ar';
  
  // الألوان الافتراضية
  const primaryColor = formStyle.primaryColor || '#9b87f5';
  
  // تحديد شكل الزر بناءً على الإعدادات
  let buttonRadius = '0.5rem'; // الافتراضي
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  } else {
    buttonRadius = formStyle.borderRadius || '0.5rem';
  }
  
  return (
    <div className="mb-4 mt-8 w-full" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <button
        className="w-full py-3 px-4 font-medium transition-all duration-200 hover:opacity-90"
        style={{
          backgroundColor: fieldStyle.backgroundColor || primaryColor,
          color: fieldStyle.color || 'white',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '1rem',
          borderRadius: buttonRadius,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          direction: isRtl ? 'rtl' : 'ltr',
          lineHeight: '1.5',
          textAlign: 'center',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
        disabled={field.disabled}
        type="submit"
      >
        {field.label || (isRtl ? 'إرسال' : 'Submit')}
      </button>
    </div>
  );
};

export default SubmitButton;

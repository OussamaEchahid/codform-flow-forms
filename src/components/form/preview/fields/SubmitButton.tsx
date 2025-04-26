
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
  
  // Determine button radius based on style
  let buttonRadius = '0.5rem'; // default
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  } else {
    buttonRadius = formStyle.borderRadius || '0.5rem';
  }
  
  return (
    <div className="mb-4 mt-8">
      <button
        className="w-full py-3 px-4 font-medium"
        style={{
          backgroundColor: fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5',
          color: fieldStyle.color || 'white',
          fontSize: fieldStyle.fontSize || formStyle.fontSize,
          borderRadius: buttonRadius,
        }}
        disabled
      >
        {field.label || (language === 'ar' ? 'إرسال' : 'Submit')}
      </button>
    </div>
  );
};

export default SubmitButton;

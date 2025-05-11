
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { RadioGroup as UIRadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';

interface RadioGroupProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const RadioGroup: React.FC<RadioGroupProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  return (
    <div className="form-control mb-4">
      <label 
        className="form-label mb-2 block" 
        style={{ color: fieldStyle.color }}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {field.label}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <UIRadioGroup 
        defaultValue={field.options?.[0] || ""}
        className="space-y-2"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        disabled
      >
        {field.options?.map((option, index) => (
          <div key={index} className={`flex items-center ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : 'space-x-2'}`}>
            <RadioGroupItem value={option} id={`option-${field.id}-${index}`} />
            <label 
              htmlFor={`option-${field.id}-${index}`} 
              className="text-sm"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {option}
            </label>
          </div>
        ))}
      </UIRadioGroup>
    </div>
  );
};

export default RadioGroup;

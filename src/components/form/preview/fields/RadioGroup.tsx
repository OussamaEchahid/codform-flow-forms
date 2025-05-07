
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { RadioGroup as UIRadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';
import { Label } from '@/components/ui/label';

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
  const isRtl = language === 'ar';
  
  return (
    <div className="form-control mb-4" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <label 
        className="form-label mb-2 block" 
        style={{ 
          color: fieldStyle.color,
          textAlign: isRtl ? 'right' : 'left',
        }}
      >
        {field.label}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <UIRadioGroup 
        defaultValue={field.options?.[0] || ""}
        className="space-y-2"
        disabled
      >
        {field.options?.map((option, index) => (
          <div 
            key={index} 
            className={`flex items-center ${isRtl ? 'flex-row-reverse justify-end' : 'space-x-2'}`}
          >
            <RadioGroupItem 
              value={option} 
              id={`radio-${field.id}-${index}`} 
              style={{ 
                borderColor: field.required ? formStyle.primaryColor : undefined,
              }}
            />
            <Label 
              htmlFor={`radio-${field.id}-${index}`} 
              className={`text-sm ${isRtl ? 'mr-2' : 'ml-2'}`}
            >
              {option}
            </Label>
          </div>
        ))}
      </UIRadioGroup>
    </div>
  );
};

export default RadioGroup;

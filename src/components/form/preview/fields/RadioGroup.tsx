
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
  
  // Get the first option value for default
  const getDefaultValue = () => {
    if (!field.options || field.options.length === 0) return "";
    const firstOption = field.options[0];
    return typeof firstOption === 'string' ? firstOption : firstOption.value;
  };
  
  return (
    <div className="form-control mb-4 w-full" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <label 
        className="form-label mb-2 block font-medium" 
        style={{ 
          color: fieldStyle.color,
          textAlign: isRtl ? 'right' : 'left',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '1rem',
        }}
      >
        {field.label}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <UIRadioGroup 
        defaultValue={getDefaultValue()}
        className="space-y-2 w-full"
      >
        {field.options?.map((option, index) => {
          // Handle both string and object options for backward compatibility
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          
          return (
            <div 
              key={index} 
              className={`flex items-center ${isRtl ? 'flex-row-reverse justify-end' : 'space-x-2'}`}
              style={{ marginBottom: '0.5rem' }}
            >
              <RadioGroupItem 
                value={optionValue} 
                id={`radio-${field.id}-${index}`} 
                style={{ 
                  borderColor: formStyle.primaryColor || '#9b87f5',
                  backgroundColor: 'transparent',
                }}
              />
              <Label 
                htmlFor={`radio-${field.id}-${index}`} 
                className={`text-sm ${isRtl ? 'mr-2' : 'ml-2'}`}
                style={{ fontSize: fieldStyle.fontSize || formStyle.fontSize || '1rem' }}
              >
                {optionLabel}
              </Label>
            </div>
          );
        })}
      </UIRadioGroup>
    </div>
  );
};

export default RadioGroup;


import React from 'react';
import { FormField } from '@/lib/form-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/lib/i18n';

interface CheckboxGroupProps {
  field: FormField;
  formStyle: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
  };
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  return (
    <div className="form-control mb-4">
      <label className="form-label mb-2 block" style={{ color: fieldStyle.color }}>
        {field.label}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <div 
        className="space-y-2" 
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {field.options?.map((option, index) => {
          // Handle both string and object options for backward compatibility
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          
          return (
            <div key={index} className="flex items-center gap-2">
              <Checkbox id={`${field.id}-${index}`} disabled />
              <label 
                htmlFor={`${field.id}-${index}`}
                className="text-sm"
              >
                {optionLabel}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckboxGroup;

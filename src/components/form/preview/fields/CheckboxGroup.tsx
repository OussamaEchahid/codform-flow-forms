
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ensureColor, ensureSize } from '@/lib/utils';

interface CheckboxGroupProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Check if options is an array and if not, create a default array
  const options = Array.isArray(field.options) 
    ? field.options 
    : [
        { value: 'option1', label: language === 'ar' ? 'الخيار الأول' : 'First Option' },
        { value: 'option2', label: language === 'ar' ? 'الخيار الثاني' : 'Second Option' }
      ];

  return (
    <div className="mb-6">
      {field.label && (
        <label className="block font-medium mb-2" style={{ 
          color: ensureColor(fieldStyle.labelColor) || '#374151',
          fontSize: ensureSize(fieldStyle.fontSize) || formStyle.fontSize || '1rem',
        }}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center">
            <input
              type="checkbox"
              id={`${field.id}-option-${index}`}
              name={field.id}
              value={typeof option === 'string' ? option : option.value}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              style={{
                accentColor: formStyle.primaryColor || '#9b87f5',
              }}
              defaultChecked={field.defaultValue === (typeof option === 'string' ? option : option.value)}
              disabled={field.disabled}
            />
            <label
              htmlFor={`${field.id}-option-${index}`}
              className="ml-2 block"
              style={{
                color: ensureColor(fieldStyle.color) || '#374151',
                fontSize: ensureSize(fieldStyle.fontSize) || formStyle.fontSize || '1rem',
              }}
            >
              {typeof option === 'string' ? option : option.label}
            </label>
          </div>
        ))}
      </div>
      
      {field.helpText && (
        <p className="text-gray-500 text-sm mt-1">{field.helpText}</p>
      )}
    </div>
  );
};

export default CheckboxGroup;

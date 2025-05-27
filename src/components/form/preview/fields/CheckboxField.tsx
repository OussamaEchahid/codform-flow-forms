
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface CheckboxFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
    borderColor?: string;
    borderWidth?: string;
    backgroundColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    formGap?: string;
    formDirection?: 'ltr' | 'rtl';
    floatingLabels?: boolean;
  };
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ field, formStyle }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          required={field.required}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {field.helpText && (
        <p className="text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  );
};

export default CheckboxField;

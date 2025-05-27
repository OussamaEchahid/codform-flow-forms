
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface EmailInputFieldProps {
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

const EmailInputField: React.FC<EmailInputFieldProps> = ({ field, formStyle }) => {
  return (
    <div className="space-y-2">
      {field.label && (
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="email"
        placeholder={field.placeholder}
        required={field.required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          borderRadius: formStyle.borderRadius,
          fontSize: formStyle.fontSize,
          textAlign: field.style?.textAlign || 'left'
        }}
      />
      {field.helpText && (
        <p className="text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  );
};

export default EmailInputField;

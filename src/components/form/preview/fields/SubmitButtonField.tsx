
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface SubmitButtonFieldProps {
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

const SubmitButtonField: React.FC<SubmitButtonFieldProps> = ({ field, formStyle }) => {
  return (
    <button
      type="submit"
      className="w-full px-4 py-2 text-white font-medium rounded-md hover:opacity-90 transition-opacity"
      style={{
        backgroundColor: field.style?.backgroundColor || formStyle.primaryColor || '#9b87f5',
        color: field.style?.color || '#ffffff',
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize
      }}
    >
      {field.label || 'Submit'}
    </button>
  );
};

export default SubmitButtonField;

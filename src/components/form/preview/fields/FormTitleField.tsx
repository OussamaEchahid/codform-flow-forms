
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface FormTitleFieldProps {
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

// This component has been disabled - form titles are now handled at the form level
const FormTitleField: React.FC<FormTitleFieldProps> = () => {
  console.log('[FormTitleField] Title rendering is disabled - this component is deprecated');
  return null;
};

export default React.memo(FormTitleField);

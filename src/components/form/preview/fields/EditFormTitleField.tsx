
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface EditFormTitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

const EditFormTitleField: React.FC<EditFormTitleFieldProps> = () => {
  return null; // حذف المحتوى وإرجاع قيمة فارغة
};

export default EditFormTitleField;

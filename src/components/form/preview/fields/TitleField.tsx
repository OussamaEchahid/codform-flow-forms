
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface TitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

const TitleField: React.FC<TitleFieldProps> = () => {
  return null; // حذف المحتوى وإرجاع قيمة فارغة
};

export default TitleField;

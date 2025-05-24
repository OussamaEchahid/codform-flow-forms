
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

const FormTitleField: React.FC<FormTitleFieldProps> = ({ field, formStyle }) => {
  // الحصول على النص من content أو label مع نص افتراضي
  const titleText = field.content || field.label || 'عنوان النموذج';
  
  // تطبيق التنسيق من إعدادات الحقل مع قيم افتراضية مناسبة
  const textColor = field.style?.color || '#1f2937';
  const fontSize = field.style?.fontSize || '1.5rem';
  const fontWeight = field.style?.fontWeight || '600';
  const fontFamily = field.style?.fontFamily || 'Tajawal';
  
  // الحصول على قيم المسافات مع القيم الافتراضية
  const paddingTop = field.style?.paddingTop || '6px';
  const paddingBottom = field.style?.paddingBottom || '6px';
  const paddingLeft = field.style?.paddingLeft || '0px';
  const paddingRight = field.style?.paddingRight || '0px';

  // التأكد من أن العنوان يُعرض في الوسط دائماً
  const titleStyle: React.CSSProperties = {
    color: textColor,
    fontSize: fontSize,
    fontWeight: fontWeight,
    fontFamily: fontFamily,
    textAlign: 'center', // دائماً في الوسط
    margin: '0 0 1rem 0',
    lineHeight: '1.3',
    direction: formStyle.formDirection || 'ltr',
    paddingTop: paddingTop,
    paddingBottom: paddingBottom,
    paddingLeft: paddingLeft,
    paddingRight: paddingRight,
    width: '100%',
    display: 'block',
  };

  return (
    <div 
      className="form-title-field w-full"
      style={titleStyle}
      data-field-type="form-title"
      data-field-id={field.id}
    >
      {titleText}
    </div>
  );
};

export default React.memo(FormTitleField);

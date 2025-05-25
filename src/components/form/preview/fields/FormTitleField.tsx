
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
  
  // تطبيق التنسيق من إعدادات الحقل مع قيم افتراضية مناسبة - FORCE BLACK COLOR
  const textColor = '#000000'; // دائماً أسود
  const fontSize = field.style?.fontSize || '1.5rem';
  const fontWeight = field.style?.fontWeight || '600';
  const fontFamily = field.style?.fontFamily || 'Tajawal, Arial, sans-serif';
  
  // الحصول على قيم المسافات مع القيم الافتراضية
  const paddingTop = field.style?.paddingTop || '12px';
  const paddingBottom = field.style?.paddingBottom || '12px';
  const paddingLeft = field.style?.paddingLeft || '0px';
  const paddingRight = field.style?.paddingRight || '0px';

  // تأكد من أن العنوان دائماً أسود، وسط، وخلفية شفافة
  const titleStyle: React.CSSProperties = {
    color: textColor,
    fontSize: fontSize,
    fontWeight: fontWeight,
    fontFamily: fontFamily,
    textAlign: 'center',
    margin: '0 0 1rem 0',
    lineHeight: '1.4',
    direction: formStyle.formDirection || 'ltr',
    paddingTop: paddingTop,
    paddingBottom: paddingBottom,
    paddingLeft: paddingLeft,
    paddingRight: paddingRight,
    width: '100%',
    display: 'block',
    backgroundColor: 'transparent',
    background: 'none',
    border: 'none',
  };

  console.log('FormTitleField rendering FORCED BLACK:', {
    titleText,
    textColor: '#000000',
    fontSize,
    fontWeight,
    backgroundColor: 'transparent'
  });

  return (
    <div 
      className="form-title-field w-full"
      style={titleStyle}
      data-field-type="form-title"
      data-field-id={field.id}
      data-text-color="#000000"
      data-background="transparent"
      data-forced-black="true"
    >
      {titleText}
    </div>
  );
};

export default React.memo(FormTitleField);

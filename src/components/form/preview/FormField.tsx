
import React, { useMemo } from 'react';
import { FormField as FormFieldType } from '@/lib/form-utils';
import TextInput from './fields/TextInput';
import TextArea from './fields/TextArea';
import RadioGroup from './fields/RadioGroup';
import CheckboxGroup from './fields/CheckboxGroup';
import TitleField from './fields/TitleField';
import CartItems from './fields/CartItems';
import CartSummary from './fields/CartSummary';
import SubmitButton from './fields/SubmitButton';
import ShippingOptions from './fields/ShippingOptions';
import CountdownTimer from './fields/CountdownTimer';
import WhatsAppButton from './fields/WhatsAppButton';
import ImageField from './fields/ImageField';
import HtmlContent from './fields/HtmlContent';

interface FormFieldProps {
  field: FormFieldType;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
}

// نقل خريطة المكونات خارج دالة التصيير لمنع إعادة إنشاء المكونات
const fieldComponentMap: Record<string, React.ComponentType<any>> = {
  'text': TextInput,
  'textarea': TextArea,
  'radio': RadioGroup,
  'checkbox': CheckboxGroup,
  'title': TitleField,
  'text/html': HtmlContent,
  'cart-items': CartItems,
  'cart-summary': CartSummary,
  'submit': SubmitButton,
  'shipping': ShippingOptions,
  'countdown': CountdownTimer,
  'whatsapp': WhatsAppButton,
  'image': ImageField,
  'email': TextInput, // تعيين بريد إلكتروني كنوع نص
  'phone': TextInput, // تعيين هاتف كنوع نص
};

const FormField = React.memo(({ field, formStyle }: FormFieldProps) => {
  if (!field || !field.type) {
    console.warn('حقل غير صالح:', field);
    return null;
  }

  // تحسين المكون باستخدام useMemo لمنع إعادة التسجيل غير الضروري
  const Component = useMemo(() => {
    // معالجة تعيين نوع الحقل
    let fieldType = field.type;
    
    // تعيين البريد الإلكتروني والهاتف كمدخلات نصية
    if (fieldType === 'email' || fieldType === 'phone') {
      fieldType = 'text';
    }

    return fieldComponentMap[fieldType];
  }, [field.type]);
  
  if (!Component) {
    console.warn(`نوع حقل غير معروف: ${field.type}، الأنواع المتاحة:`, Object.keys(fieldComponentMap));
    return null;
  }

  return <Component field={field} formStyle={formStyle} />;
});

FormField.displayName = 'FormField';

export default FormField;

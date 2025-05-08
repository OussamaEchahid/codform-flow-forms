
import React from 'react';
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

// نقل خريطة المكونات خارج المكون لمنع إعادة إنشائها في كل رسم
const FIELD_COMPONENTS = {
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
  'email': TextInput, // البريد الإلكتروني يستخدم مكون النص
  'phone': TextInput, // الهاتف يستخدم مكون النص
};

// دالة المقارنة المخصصة للتحقق من تغييرات الخصائص
const arePropsEqual = (prevProps: FormFieldProps, nextProps: FormFieldProps) => {
  return (
    prevProps.field.id === nextProps.field.id &&
    prevProps.field.type === nextProps.field.type &&
    prevProps.field.label === nextProps.field.label &&
    prevProps.field.required === nextProps.field.required &&
    JSON.stringify(prevProps.formStyle) === JSON.stringify(nextProps.formStyle)
  );
};

// مكون وظيفي بسيط يتجنب التحديثات غير الضرورية
const FormField = (props: FormFieldProps) => {
  const { field, formStyle } = props;
  
  // التحقق من صحة البيانات
  if (!field || !field.type) {
    return null;
  }

  // تحديد نوع المكون المناسب
  let fieldType = field.type;
  
  // تعامل مع أنماط الإدخال الخاصة
  if (fieldType === 'email' || fieldType === 'phone') {
    fieldType = 'text';
  }

  const Component = FIELD_COMPONENTS[fieldType as keyof typeof FIELD_COMPONENTS];
  
  if (!Component) {
    return null;
  }

  // عرض المكون المناسب مع البيانات المطلوبة
  return <Component field={field} formStyle={formStyle} />;
};

// استخدام memo مع دالة المقارنة المخصصة للحد من عمليات إعادة التصيير غير الضرورية
export default React.memo(FormField, arePropsEqual);

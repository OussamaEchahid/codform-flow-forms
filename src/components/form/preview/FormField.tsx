
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

// تحديد أنماط الرسوم المتحركة لضمان الاتساق
const animationStyles = `
  @keyframes pulse-animation {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes shake-animation {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  @keyframes bounce-animation {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  
  @keyframes wiggle-animation {
    0%, 100% { transform: rotate(0); }
    25% { transform: rotate(-3deg); }
    75% { transform: rotate(3deg); }
  }
  
  @keyframes flash-animation {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  .pulse-animation {
    animation: pulse-animation 2s infinite ease-in-out !important;
  }
  
  .shake-animation {
    animation: shake-animation 0.8s infinite ease-in-out !important;
  }
  
  .bounce-animation {
    animation: bounce-animation 2s infinite ease-in-out !important;
  }
  
  .wiggle-animation {
    animation: wiggle-animation 2s infinite ease-in-out !important;
  }
  
  .flash-animation {
    animation: flash-animation 2s infinite ease-in-out !important;
  }
`;

// إنشاء مفتاح فريد للحقل بناءً على معرف الحقل فقط
const getFieldKey = (field: FormFieldType) => {
  if (!field || !field.id) {
    console.warn('حقل بدون معرف:', field);
    return `field-unknown-${Math.floor(Math.random() * 10000)}`;
  }
  
  // استخدام معرف الحقل فقط لضمان هوية متسقة عبر عمليات العرض
  return `field-${field.id}`;
};

const FormField: React.FC<FormFieldProps> = ({ field, formStyle }) => {
  // تحقق من صحة بيانات الحقل
  if (!field || !field.type || !field.id) {
    console.warn('حقل غير صالح:', field);
    return null;
  }

  // تطبيع خصائص الحقل - التأكد من تطبيق إعدادات الأيقونة بشكل صحيح
  const normalizedField = {
    ...field,
    // تحويل الأيقونة الفارغة إلى 'none'
    icon: field.icon === '' ? 'none' : field.icon,
    style: {
      ...field.style,
      // تعيين showIcon الافتراضي إلى true إذا كانت الأيقونة موجودة وليست 'none'
      showIcon: field.style?.showIcon !== undefined ? 
        field.style.showIcon : 
        (field.icon && field.icon !== 'none'),
      // تعيين القيم الافتراضية للون التسمية وحجم الخط إذا لم يتم تحديدها
      labelColor: field.style?.labelColor || '#333',
      labelFontSize: field.style?.labelFontSize || formStyle.fontSize || '16px',
      labelFontWeight: field.style?.labelFontWeight || '600',
      // التأكد من تمرير backgroundColor لزر الإرسال
      backgroundColor: field.style?.backgroundColor || (field.type === 'submit' ? formStyle.primaryColor : undefined),
    }
  };

  // معالجة خاصة لأنواع حقول البريد الإلكتروني والهاتف
  let fieldType = normalizedField.type;
  
  // تعيين البريد الإلكتروني والهاتف إلى حقول نصية
  if (fieldType === 'email' || fieldType === 'phone') {
    fieldType = 'text';
  }

  // التحقق مما إذا كان نوع الحقل هذا مدعومًا في معاينة المتجر
  const supportedStoreFieldTypes = [
    'text', 'textarea', 'radio', 'checkbox', 'title', 'text/html',
    'submit', 'image', 'whatsapp', 'form-title', 'cart-items', 'cart-summary',
    'email', 'phone'
  ];
  
  const isSupported = supportedStoreFieldTypes.includes(fieldType) || supportedStoreFieldTypes.includes(normalizedField.type);

  // تسجيل بيانات الرسوم المتحركة إذا كان هذا زر إرسال
  if (fieldType === 'submit' && normalizedField.style) {
    const animationType = normalizedField.style.animationType || 'none';
    const hasAnimation = !!normalizedField.style.animation;
    
    if (hasAnimation) {
      console.log(`Submit button using animation: ${animationType}`);
    }
    
    // تسجيل لون الزر أيضًا للتصحيح
    console.log(`Submit button color: ${normalizedField.style.backgroundColor || formStyle.primaryColor || '#9b87f5'}`);
  }

  const components: { [key: string]: React.FC<any> } = {
    'text': TextInput,
    'textarea': TextArea,
    'radio': RadioGroup,
    'checkbox': CheckboxGroup,
    'title': TitleField,
    'form-title': TitleField,
    'text/html': HtmlContent,
    'cart-items': CartItems,
    'cart-summary': CartSummary,
    'submit': SubmitButton,
    'shipping': ShippingOptions,
    'countdown': CountdownTimer,
    'whatsapp': WhatsAppButton,
    'image': ImageField,
    'email': TextInput,
    'phone': TextInput,
  };

  const Component = components[fieldType] || components[normalizedField.type];
  if (!Component) {
    console.warn(`نوع حقل غير معروف: ${field.type}، الأنواع المتاحة:`, Object.keys(components));
    return null;
  }

  // إنشاء مفتاح ثابت لمثيل هذا الحقل بناءً على المعرف فقط
  const fieldKey = getFieldKey(field);
  
  // تعيين الهوامش: استخدام الهوامش المحسّنة بناءً على نوع الحقل
  const marginClass = fieldType === 'submit' ? 'mt-0' : 'mb-4';

  // إضافة سمات البيانات للمساعدة في ضمان اتساق العرض بين المعاينة والمتجر
  const dataAttributes = {
    'data-field-type': normalizedField.type,
    'data-field-id': normalizedField.id,
    'data-has-icon': normalizedField.icon && normalizedField.icon !== 'none' ? 'true' : 'false',
    'data-show-icon': normalizedField.style?.showIcon ? 'true' : 'false',
    'data-icon': normalizedField.icon || 'none',
    'data-required': normalizedField.required ? 'true' : 'false',
    'data-label-color': normalizedField.style?.labelColor || '#333',
    'data-label-font-size': normalizedField.style?.labelFontSize || formStyle.fontSize || '16px',
    'data-label-font-weight': normalizedField.style?.labelFontWeight || '600',
    'data-background-color': normalizedField.style?.backgroundColor || (fieldType === 'submit' ? formStyle.primaryColor : undefined),
    'data-border-color': normalizedField.style?.borderColor,
    'data-border-width': normalizedField.style?.borderWidth,
  };

  // عرض تحذير إذا لم يكن النوع مدعومًا
  if (!isSupported && fieldType !== 'form-title') {
    return (
      <div className={`${marginClass} p-3 border border-yellow-300 bg-yellow-50 rounded-md`} key={fieldKey} {...dataAttributes}>
        <Component field={normalizedField} formStyle={formStyle} />
        <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
          {normalizedField.label ? `حقل "${normalizedField.label}"` : 'هذا الحقل'} غير مدعوم بشكل كامل في واجهة المتجر
        </div>
      </div>
    );
  }

  return (
    <div className={marginClass} key={fieldKey} {...dataAttributes}>
      <style>{animationStyles}</style>
      <Component field={normalizedField} formStyle={formStyle} />
    </div>
  );
};

export default React.memo(FormField);

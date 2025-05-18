
import React from 'react';
import { FormField as FormFieldType, FormFieldType as FieldType } from '@/lib/form-utils';
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

// تعريف أنماط الحركة لضمان توافقها في كل من المعاينة والمتجر
const animationStyles = `
  @keyframes pulse-animation {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes shake-animation {
    0% { transform: translateX(0); }
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
    animation: shake-animation 2s infinite ease-in-out !important;
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

// Helper function to ensure FormFieldType
const ensureFieldType = (type: string | FieldType): FieldType => {
  return type as FieldType;
};

// Helper function to convert rem to px for consistent styling
const remToPx = (value: string): string => {
  if (!value) return '';
  if (value.includes('rem')) {
    const remValue = parseFloat(value);
    return `${remValue * 16}px`;
  }
  if (!value.includes('px') && !isNaN(parseFloat(value))) {
    return `${value}px`;
  }
  return value;
};

// إنشاء مفتاح فريد لحقل النموذج لفرض إعادة العرض عند تغيير خصائص الحقل
const getFieldKey = (field: FormFieldType) => {
  // تضمين المزيد من الخصائص في المفتاح للتأكد من أن أي تغيير سيؤدي إلى إعادة العرض
  return `field-${field.id}-${field.label || ''}-${field.placeholder || ''}-${field.type}-${field.icon || 'none'}-${JSON.stringify(field.style || {})}-${Date.now()}`;
};

// Process field styles to ensure consistent formatting
const normalizeFieldStyle = (field: FormFieldType): FormFieldType => {
  if (!field.style) return field;
  
  const normalizedStyle = { ...field.style };
  
  // Convert all font size values to px
  if (normalizedStyle.fontSize) {
    normalizedStyle.fontSize = remToPx(normalizedStyle.fontSize);
  }
  
  // Convert description font size to px
  if (normalizedStyle.descriptionFontSize) {
    normalizedStyle.descriptionFontSize = remToPx(normalizedStyle.descriptionFontSize);
  }
  
  return {
    ...field,
    style: normalizedStyle
  };
};

const FormField: React.FC<FormFieldProps> = ({ field, formStyle }) => {
  if (!field || !field.type) {
    console.warn('Invalid field:', field);
    return null;
  }

  // تطبيع خصائص الحقل - ضمان تطبيق إعدادات الأيقونة بشكل صحيح
  const normalizedField = {
    ...field,
    // Ensure type is correctly handled
    type: ensureFieldType(field.type),
    // تحويل الأيقونة الفارغة إلى 'none'
    icon: field.icon === '' ? 'none' : field.icon,
    style: {
      ...field.style,
      // تعيين showIcon افتراضيًا إلى true إذا كانت الأيقونة موجودة وليست 'none'
      showIcon: field.style?.showIcon !== undefined ? 
        field.style.showIcon : 
        (field.icon && field.icon !== 'none')
    }
  };

  // Apply style normalization for consistent formatting
  const processedField = normalizeFieldStyle(normalizedField);

  // معالجة تعيين نوع الحقل
  let fieldType = processedField.type;
  
  // ربط البريد الإلكتروني والهاتف بإدخالات النص
  if (fieldType === 'email' || fieldType === 'phone') {
    fieldType = 'text';
  }

  // التحقق مما إذا كان نوع الحقل هذا مدعومًا في معاينة المتجر
  const supportedStoreFieldTypes = [
    'text', 'textarea', 'radio', 'checkbox', 'title', 'text/html',
    'submit', 'image', 'whatsapp', 'form-title', 'cart-items', 'cart-summary',
    'email', 'phone' // دعم صريح للبريد الإلكتروني والهاتف
  ];
  
  const isSupported = supportedStoreFieldTypes.includes(fieldType as string) || 
    supportedStoreFieldTypes.includes(normalizedField.type as string);

  // تسجيل بيانات الحركة إذا كان هذا زر إرسال
  if (fieldType === 'submit' && processedField.style) {
    const animationType = processedField.style.animationType || 'none';
    const hasAnimation = !!processedField.style.animation;
    
    if (hasAnimation) {
      console.log(`Submit button using animation: ${animationType}`);
    }
  }

  const components: { [key: string]: React.FC<FormFieldProps> } = {
    'text': TextInput,
    'textarea': TextArea,
    'radio': RadioGroup,
    'checkbox': CheckboxGroup,
    'title': TitleField,
    'form-title': TitleField, // استخدام مكون TitleField لنوع form-title
    'text/html': HtmlContent,
    'cart-items': CartItems,
    'cart-summary': CartSummary,
    'submit': SubmitButton,
    'shipping': ShippingOptions,
    'countdown': CountdownTimer,
    'whatsapp': WhatsAppButton,
    'image': ImageField,
    'email': TextInput, // إضافة دعم صريح للبريد الإلكتروني
    'phone': TextInput, // إضافة دعم صريح للهاتف
  };

  const Component = components[fieldType as string] || components[processedField.type as string];
  if (!Component) {
    console.warn(`Unknown field type: ${field.type}, available types:`, Object.keys(components));
    return null;
  }

  // إنشاء مفتاح فريد لمثيل هذا الحقل لفرض إعادة العرض عند تغيير الخصائص
  const fieldKey = getFieldKey(field);
  
  // ضبط الهوامش: استخدام هوامش أصغر لجميع الحقول، وجعل زر الإرسال قريب جدًا من الحقل السابق
  const marginClass = fieldType === 'submit' ? 'mt-0' : 'mb-1'; // تغيير من mt-1 إلى mt-0 لزر الإرسال

  // إضافة سمات البيانات للمساعدة في ضمان تطابق العرض بين المعاينة والمتجر
  const dataAttributes = {
    'data-field-type': processedField.type,
    'data-field-id': processedField.id,
    'data-has-icon': processedField.icon && processedField.icon !== 'none' ? 'true' : 'false',
    'data-show-icon': processedField.style?.showIcon ? 'true' : 'false',
    'data-icon': processedField.icon || 'none',
    'data-required': processedField.required ? 'true' : 'false',
  };

  if (!isSupported && fieldType !== 'form-title') { // لا تظهر تحذيرًا لـ form-title
    return (
      <div className={`${marginClass} p-3 border border-yellow-300 bg-yellow-50 rounded-md`} key={fieldKey} {...dataAttributes}>
        <Component field={processedField} formStyle={formStyle} />
        <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
          {processedField.label ? `حقل "${processedField.label}"` : 'هذا الحقل'} غير مدعوم بشكل كامل في واجهة المتجر
        </div>
      </div>
    );
  }

  return (
    <div className={marginClass} key={fieldKey} {...dataAttributes}>
      <style>{animationStyles}</style>
      <Component field={processedField} formStyle={formStyle} />
    </div>
  );
};

export default FormField;

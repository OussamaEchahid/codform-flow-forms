
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

// Define a mapping of field types to components
const fieldComponentMap: Record<string, React.FC<FormFieldProps>> = {
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
};

const FormField: React.FC<FormFieldProps> = ({ field, formStyle }) => {
  if (!field || !field.type) {
    console.warn('Invalid field:', field);
    return null;
  }

  // Handle field type mapping
  let fieldType = field.type;
  
  // Map email and phone to text inputs
  if (fieldType === 'email' || fieldType === 'phone') {
    fieldType = 'text';
  }

  const Component = fieldComponentMap[fieldType];
  
  if (!Component) {
    console.warn(`Unknown field type: ${field.type}, available types:`, Object.keys(fieldComponentMap));
    return null;
  }

  return <Component field={field} formStyle={formStyle} />;
};

export default React.memo(FormField);

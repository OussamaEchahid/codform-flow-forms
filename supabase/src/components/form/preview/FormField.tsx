
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
  };
}

const FormField: React.FC<FormFieldProps> = ({ field, formStyle }) => {
  if (!field || !field.type) {
    console.warn('Invalid field:', field);
    return null;
  }

  const components: { [key: string]: React.FC<FormFieldProps> } = {
    'text': TextInput,
    'email': TextInput,
    'phone': TextInput,
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

  const Component = components[field.type];
  if (!Component) {
    console.warn(`Unknown field type: ${field.type}`);
    return null;
  }

  return <Component field={field} formStyle={formStyle} />;
};

export default FormField;

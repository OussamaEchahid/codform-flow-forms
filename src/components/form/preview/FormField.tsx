
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

// Define a consistent FormStyleProps interface that all components will use
export interface FormStyleProps {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
}

export interface FormFieldProps {
  field: FormFieldType;
  formStyle: FormStyleProps;
}

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

  // Ensure formStyle has all required properties with default values
  const completeFormStyle: FormStyleProps = {
    primaryColor: formStyle.primaryColor || '#9b87f5',
    borderRadius: formStyle.borderRadius || '0.5rem',
    fontSize: formStyle.fontSize || '1rem',
    buttonStyle: formStyle.buttonStyle || 'rounded'
  };

  const components: { [key: string]: React.FC<FormFieldProps> } = {
    'text': TextInput as React.FC<FormFieldProps>,
    'textarea': TextArea as React.FC<FormFieldProps>,
    'radio': RadioGroup as React.FC<FormFieldProps>,
    'checkbox': CheckboxGroup as React.FC<FormFieldProps>,
    'title': TitleField as React.FC<FormFieldProps>,
    'text/html': HtmlContent as React.FC<FormFieldProps>,
    'cart-items': CartItems as React.FC<FormFieldProps>,
    'cart-summary': CartSummary as React.FC<FormFieldProps>,
    'submit': SubmitButton as React.FC<FormFieldProps>,
    'shipping': ShippingOptions as React.FC<FormFieldProps>,
    'countdown': CountdownTimer as React.FC<FormFieldProps>,
    'whatsapp': WhatsAppButton as React.FC<FormFieldProps>,
    'image': ImageField as React.FC<FormFieldProps>,
  };

  const Component = components[fieldType];
  if (!Component) {
    console.warn(`Unknown field type: ${field.type}, available types:`, Object.keys(components));
    return null;
  }

  return <Component field={field} formStyle={completeFormStyle} />;
};

export default FormField;

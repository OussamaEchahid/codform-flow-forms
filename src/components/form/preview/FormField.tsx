
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

// Move component mapping outside to prevent recreation on each render
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
  'email': TextInput, // Email uses text input component
  'phone': TextInput, // Phone uses text input component
};

// Custom comparison function to avoid unnecessary re-renders
const arePropsEqual = (prevProps: FormFieldProps, nextProps: FormFieldProps) => {
  return (
    prevProps.field.id === nextProps.field.id &&
    prevProps.field.type === nextProps.field.type &&
    prevProps.field.label === nextProps.field.label &&
    prevProps.field.required === nextProps.field.required &&
    JSON.stringify(prevProps.formStyle) === JSON.stringify(nextProps.formStyle)
  );
};

// Simple functional component that avoids unnecessary updates
const FormField = (props: FormFieldProps) => {
  const { field, formStyle } = props;
  
  // Data validation
  if (!field || !field.type) {
    return null;
  }

  // Determine component type
  let fieldType = field.type;
  
  // Handle special input types
  if (fieldType === 'email' || fieldType === 'phone') {
    fieldType = 'text';
  }

  const Component = FIELD_COMPONENTS[fieldType as keyof typeof FIELD_COMPONENTS];
  
  if (!Component) {
    return null;
  }

  // Render the appropriate component with the needed data
  return <Component field={field} formStyle={formStyle} />;
};

// Use memo with custom comparison function to limit unnecessary re-renders
export default React.memo(FormField, arePropsEqual);

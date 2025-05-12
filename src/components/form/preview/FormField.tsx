
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

  // Check if this field type is supported in the store preview
  const supportedStoreFieldTypes = [
    'text', 'textarea', 'radio', 'checkbox', 'title', 'text/html',
    'submit', 'image', 'whatsapp', 'form-title'
  ];
  
  const isSupported = supportedStoreFieldTypes.includes(fieldType);
  
  console.log(`Processing field (${field.id}): ${field.type} -> ${fieldType} (supported: ${isSupported})`);

  const components: { [key: string]: React.FC<FormFieldProps> } = {
    'text': TextInput,
    'textarea': TextArea,
    'radio': RadioGroup,
    'checkbox': CheckboxGroup,
    'title': TitleField,
    'form-title': TitleField, // Use TitleField component for form-title type
    'text/html': HtmlContent,
    'cart-items': CartItems,
    'cart-summary': CartSummary,
    'submit': SubmitButton,
    'shipping': ShippingOptions,
    'countdown': CountdownTimer,
    'whatsapp': WhatsAppButton,
    'image': ImageField,
  };

  const Component = components[fieldType];
  if (!Component) {
    console.warn(`Unknown field type: ${field.type}, available types:`, Object.keys(components));
    return null;
  }

  if (!isSupported && fieldType !== 'form-title') { // Don't show warning for form-title
    return (
      <div className="mb-4 p-3 border border-yellow-300 bg-yellow-50 rounded-md">
        <Component field={field} formStyle={formStyle} />
        <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
          {field.label ? `حقل "${field.label}"` : 'هذا الحقل'} غير مدعوم بشكل كامل في واجهة المتجر
        </div>
      </div>
    );
  }

  return <Component field={field} formStyle={formStyle} />;
};

export default FormField;

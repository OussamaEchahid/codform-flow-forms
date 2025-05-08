
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
import { useFormStore } from '@/hooks/useFormStore';

interface FormFieldProps {
  field: FormFieldType;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  formLanguage?: 'ar' | 'en' | 'fr';
}

const FormField: React.FC<FormFieldProps> = ({ field, formStyle, formLanguage = 'ar' }) => {
  const { getFieldTranslation } = useFormStore();
  
  if (!field || !field.type) {
    console.warn('Invalid field:', field);
    return null;
  }

  // Get translated field properties - but since we're Arabic only, the language parameter doesn't matter
  const translatedLabel = getFieldTranslation(field.id, 'label', 'ar');
  const translatedPlaceholder = getFieldTranslation(field.id, 'placeholder', 'ar');
  const translatedOptions = getFieldTranslation(field.id, 'options', 'ar');

  // Create translated field object
  const translatedField = {
    ...field,
    label: translatedLabel !== undefined ? translatedLabel : field.label,
    placeholder: translatedPlaceholder !== undefined ? translatedPlaceholder : field.placeholder,
    options: translatedOptions !== undefined ? translatedOptions : field.options
  };

  // Handle field type mapping
  let fieldType = field.type;
  
  // Map email and phone to text inputs
  if (fieldType === 'email' || fieldType === 'phone') {
    fieldType = 'text';
  }

  const components: { [key: string]: React.FC<FormFieldProps> } = {
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

  const Component = components[fieldType];
  if (!Component) {
    console.warn(`Unknown field type: ${field.type}, available types:`, Object.keys(components));
    return null;
  }

  return <Component field={translatedField} formStyle={formStyle} formLanguage="ar" />;
};

export default FormField;

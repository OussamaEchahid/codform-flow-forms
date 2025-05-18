
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

// Define animation styles to ensure consistency between preview and store
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

// Create a unique key for form field to force re-render when field properties change
const getFieldKey = (field: FormFieldType) => {
  // Include more properties in the key to ensure any change will trigger a re-render
  return `field-${field.id}-${field.label || ''}-${field.placeholder || ''}-${field.type}-${field.icon || 'none'}-${JSON.stringify(field.style || {})}-${Date.now()}`;
};

const FormField: React.FC<FormFieldProps> = ({ field, formStyle }) => {
  if (!field || !field.type) {
    console.warn('Invalid field:', field);
    return null;
  }

  // Normalize field properties - ensure icon settings are applied correctly
  const normalizedField = {
    ...field,
    // Convert empty icon to 'none'
    icon: field.icon === '' ? 'none' : field.icon,
    style: {
      ...field.style,
      // Set showIcon to true by default if icon exists and is not 'none'
      showIcon: field.style?.showIcon !== undefined ? 
        field.style.showIcon : 
        (field.icon && field.icon !== 'none')
    }
  };

  // Handle field type mapping
  let fieldType = normalizedField.type;
  
  // Map email and phone to text inputs
  if (fieldType === 'email' || fieldType === 'phone') {
    fieldType = 'text';
  }

  // Check if this field type is supported in store preview
  const supportedStoreFieldTypes = [
    'text', 'textarea', 'radio', 'checkbox', 'title', 'text/html',
    'submit', 'image', 'whatsapp', 'form-title', 'cart-items', 'cart-summary',
    'email', 'phone' // Explicit support for email and phone
  ];
  
  const isSupported = supportedStoreFieldTypes.includes(fieldType) || supportedStoreFieldTypes.includes(normalizedField.type);

  // Log animation data if this is a submit button
  if (fieldType === 'submit' && normalizedField.style) {
    const animationType = normalizedField.style.animationType || 'none';
    const hasAnimation = !!normalizedField.style.animation;
    
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
    'form-title': TitleField, // Use TitleField component for form-title type
    'text/html': HtmlContent,
    'cart-items': CartItems,
    'cart-summary': CartSummary,
    'submit': SubmitButton,
    'shipping': ShippingOptions,
    'countdown': CountdownTimer,
    'whatsapp': WhatsAppButton,
    'image': ImageField,
    'email': TextInput, // Add explicit support for email
    'phone': TextInput, // Add explicit support for phone
  };

  const Component = components[fieldType] || components[normalizedField.type];
  if (!Component) {
    console.warn(`Unknown field type: ${field.type}, available types:`, Object.keys(components));
    return null;
  }

  // Create unique key for this field instance to force re-render when properties change
  const fieldKey = getFieldKey(field);
  
  // Set margins: smaller margins for all fields, make submit button close to previous field
  const marginClass = fieldType === 'submit' ? 'mt-0' : 'mb-1'; // Changed from mt-1 to mt-0 for submit button

  // Add data attributes to help ensure display consistency between preview and store
  const dataAttributes = {
    'data-field-type': normalizedField.type,
    'data-field-id': normalizedField.id,
    'data-has-icon': normalizedField.icon && normalizedField.icon !== 'none' ? 'true' : 'false',
    'data-show-icon': normalizedField.style?.showIcon ? 'true' : 'false',
    'data-icon': normalizedField.icon || 'none',
    'data-required': normalizedField.required ? 'true' : 'false',
    'data-field-style': JSON.stringify(normalizedField.style || {}), // Add all style properties as JSON string
  };

  if (!isSupported && fieldType !== 'form-title') { // Don't show warning for form-title
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

export default FormField;

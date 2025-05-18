
import React, { memo } from 'react';
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
    0% { transform: rotate(0); }
    25% { transform: rotate(-3deg); }
    75% { transform: rotate(3deg); }
  }
  
  @keyframes flash-animation {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  .pulse-animation {
    animation: pulse-animation 2s infinite ease-in-out;
  }
  
  .shake-animation {
    animation: shake-animation 2s infinite ease-in-out;
  }
  
  .bounce-animation {
    animation: bounce-animation 2s infinite ease-in-out;
  }
  
  .wiggle-animation {
    animation: wiggle-animation 2s infinite ease-in-out;
  }
  
  .flash-animation {
    animation: flash-animation 2s infinite ease-in-out;
  }
`;

// Generate a key for FormField to force re-render when field properties change
const getFieldKey = (field: FormFieldType) => {
  return `field-${field.id}-${field.type}-${field.label || ''}-${field.placeholder || ''}-${JSON.stringify(field.style || {})}-${field.icon || 'none'}-${Date.now()}`;
};

// Remove memo to ensure component always updates when props change
const FormField: React.FC<FormFieldProps> = ({ field, formStyle }) => {
  if (!field || !field.type) {
    console.warn('Invalid field:', field);
    return null;
  }

  // Normalize field properties - ensure icon settings are properly applied
  const normalizedField = {
    ...field,
    icon: field.icon === '' ? 'none' : field.icon,
    style: {
      ...field.style,
      // Set default showIcon to true if icon is present and not none
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

  // Check if this field type is supported in the store preview
  const supportedStoreFieldTypes = [
    'text', 'textarea', 'radio', 'checkbox', 'title', 'text/html',
    'submit', 'image', 'whatsapp', 'form-title', 'cart-items', 'cart-summary'
  ];
  
  const isSupported = supportedStoreFieldTypes.includes(fieldType);

  // Additional logging especially for submit buttons
  if (fieldType === 'submit') {
    console.log('Submit button field object:', JSON.stringify(normalizedField, null, 2));
    
    // Enhanced debugging to track style properties
    if (normalizedField.style) {
      console.log('Submit button style properties:');
      console.log('- backgroundColor:', normalizedField.style.backgroundColor || 'not set');
      console.log('- color:', normalizedField.style.color || 'not set');
      console.log('- fontSize:', normalizedField.style.fontSize || 'not set');
      console.log('- animation:', normalizedField.style.animation ? 'true' : 'false');
      console.log('- animationType:', normalizedField.style.animationType || 'not set');
    }
  }

  const components: { [key: string]: React.FC<FormFieldProps> } = {
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
  };

  const Component = components[fieldType];
  if (!Component) {
    console.warn(`Unknown field type: ${field.type}, available types:`, Object.keys(components));
    return null;
  }

  // Generate a unique key for this field instance to force re-render when props change
  const fieldKey = getFieldKey(field);
  
  // Adjust margins: use smaller margins for all fields, and make submit button very close to previous field
  const marginClass = fieldType === 'submit' ? 'mt-0' : 'mb-1';

  if (!isSupported && fieldType !== 'form-title') {
    return (
      <div className={`${marginClass} p-3 border border-yellow-300 bg-yellow-50 rounded-md`} key={fieldKey}>
        <Component field={normalizedField} formStyle={formStyle} />
        <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
          {normalizedField.label ? `حقل "${normalizedField.label}"` : 'هذا الحقل'} غير مدعوم بشكل كامل في واجهة المتجر
        </div>
      </div>
    );
  }

  return (
    <div className={marginClass} key={fieldKey}>
      <style>{animationStyles}</style>
      <Component field={normalizedField} formStyle={formStyle} />
    </div>
  );
};

export default FormField;

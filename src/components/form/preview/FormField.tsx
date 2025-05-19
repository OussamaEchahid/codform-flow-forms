
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

// Define animation styles for consistency
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

// Create a stable unique key for field based solely on field ID
const getFieldKey = (field: FormFieldType) => {
  if (!field || !field.id) {
    console.warn('Field without ID:', field);
    return `field-unknown-${Math.floor(Math.random() * 10000)}`;
  }
  
  // Use only field ID to ensure consistent identity across renders
  return `field-${field.id}`;
};

// Use React.memo to prevent unnecessary re-renders
const FormField = React.memo(({ field, formStyle }: FormFieldProps) => {
  // Validate field data
  if (!field || !field.type || !field.id) {
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
      // Set default showIcon to true if icon exists and isn't 'none'
      showIcon: field.style?.showIcon !== undefined ? 
        field.style.showIcon : 
        (field.icon && field.icon !== 'none'),
      // Set default values for label color and font size if not specified
      labelColor: field.style?.labelColor || '#333',
      labelFontSize: field.style?.labelFontSize || formStyle.fontSize || '16px',
      labelFontWeight: field.style?.labelFontWeight || '600',
      // Ensure backgroundColor is passed for submit button
      backgroundColor: field.style?.backgroundColor || (field.type === 'submit' ? formStyle.primaryColor : undefined),
    }
  };

  // Special handling for email and phone field types
  let fieldType = normalizedField.type;
  
  // Set email and phone to text fields
  if (fieldType === 'email' || fieldType === 'phone') {
    fieldType = 'text';
  }

  // Check if this field type is supported in store preview
  const supportedStoreFieldTypes = [
    'text', 'textarea', 'radio', 'checkbox', 'title', 'text/html',
    'submit', 'image', 'whatsapp', 'form-title', 'cart-items', 'cart-summary',
    'email', 'phone'
  ];
  
  const isSupported = supportedStoreFieldTypes.includes(fieldType) || supportedStoreFieldTypes.includes(normalizedField.type);

  // Log animation data if this is a submit button
  if (fieldType === 'submit' && normalizedField.style) {
    const animationType = normalizedField.style.animationType || 'none';
    const hasAnimation = !!normalizedField.style.animation;
    
    if (hasAnimation) {
      console.log(`Submit button using animation: ${animationType}`);
    }
    
    // Also log button color for debugging
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
    console.warn(`Unknown field type: ${field.type}, Available types:`, Object.keys(components));
    return null;
  }

  // Create stable key for this field instance based solely on ID
  const fieldKey = getFieldKey(field);
  
  // Set margins: use optimized margins based on field type
  const marginClass = fieldType === 'submit' ? 'mt-0' : 'mb-4';

  // Add data attributes to help ensure consistency between preview and store
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

  // Show warning if type is not supported
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
});

FormField.displayName = 'FormField';

export default FormField;

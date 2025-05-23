import React, { memo } from 'react';
import { FormField as FormFieldType } from '@/lib/form-utils';
import TextInput from './fields/TextInput';
import TextArea from './fields/TextArea';
import RadioGroup from './fields/RadioGroup';
import CheckboxGroup from './fields/CheckboxGroup';
import CartItems from './fields/CartItems';
import CartSummary from './fields/CartSummary';
import SubmitButton from './fields/SubmitButton';
import ShippingOptions from './fields/ShippingOptions';
import CountdownTimer from './fields/CountdownTimer';
import WhatsAppButton from './fields/WhatsAppButton';
import ImageField from './fields/ImageField';
import HtmlContent from './fields/HtmlContent';
import FormTitleField from './fields/FormTitleField';

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

// Improved deep clone function with full TypeScript support
const deepCloneField = (field: FormFieldType): FormFieldType => {
  if (!field) return field;
  
  // Start with a complete copy of all properties
  const clonedField: FormFieldType = { ...field };
  
  // Preserve the exact ID - critical for stability
  clonedField.id = field.id;
  
  // Deep clone style object if it exists
  if (field.style) {
    clonedField.style = { ...field.style };
    
    // Ensure textAlign is properly typed
    if (field.style.textAlign) {
      const align = field.style.textAlign as string;
      clonedField.style.textAlign = 
        (align === 'left' || align === 'center' || align === 'right') 
          ? align as 'left' | 'center' | 'right'
          : (align === 'justify' ? 'left' : 'center') as 'left' | 'center' | 'right';
    }
  }
  
  // Deep clone options array if it exists
  if (field.options && Array.isArray(field.options)) {
    clonedField.options = field.options.map(option => ({ ...option }));
  }
  
  // Deep clone validation rules if they exist
  if (field.validationRules) {
    clonedField.validationRules = { ...field.validationRules };
  }
  
  // Deep clone any other nested objects that might exist
  if (field.settings) {
    clonedField.settings = { ...field.settings };
  }
  
  return clonedField;
};

// Improved FormField component with better stability during drag and drop
const FormField = memo(({ field, formStyle }: FormFieldProps) => {
  // Validate field data
  if (!field || !field.type || !field.id) {
    console.warn('Invalid field:', field);
    return null;
  }

  // Create a deep clone of the field to prevent unintended mutations
  const clonedField = deepCloneField(field);
  
  // Normalize field properties - ensure icon settings are applied correctly
  const normalizedField = React.useMemo(() => {
    return {
      ...clonedField,
      // Preserve the original field ID
      id: field.id,
      // Convert empty icon to 'none'
      icon: field.icon === '' ? 'none' : field.icon,
      style: {
        ...clonedField.style,
        // Set default showIcon to true if icon exists and isn't 'none'
        showIcon: field.style?.showIcon !== undefined ? 
          field.style.showIcon : 
          (field.icon && field.icon !== 'none'),
        // Set default values for label color and font size if not specified
        labelColor: field.style?.labelColor || '#333',
        labelFontSize: field.style?.labelFontSize || formStyle.fontSize || '16px',
        labelFontWeight: field.style?.labelFontWeight || '600',
        // Ensure backgroundColor is passed for submit button
        backgroundColor: field.style?.backgroundColor || (
          field.type === 'submit' ? formStyle.primaryColor : undefined
        ),
        // Add border properties if they exist in the field's style
        borderColor: field.style?.borderColor,
        borderWidth: field.style?.borderWidth,
        // Ensure textAlign is type-safe
        textAlign: field.style?.textAlign as 'left' | 'center' | 'right' | undefined
      }
    };
  }, [field, formStyle]);

  // Special handling for email and phone field types
  let fieldType = normalizedField.type;
  
  // Set email and phone to text fields
  if (fieldType === 'email' || fieldType === 'phone') {
    fieldType = 'text';
  }

  // Check if this field type is supported in store preview
  const supportedStoreFieldTypes = [
    'text', 'textarea', 'radio', 'checkbox', 'text/html',
    'submit', 'image', 'whatsapp', 'cart-items', 'cart-summary',
    'email', 'phone'
  ];
  
  const isSupported = supportedStoreFieldTypes.includes(fieldType) || supportedStoreFieldTypes.includes(normalizedField.type);

  const components: { [key: string]: React.FC<any> } = {
    'text': TextInput,
    'textarea': TextArea,
    'radio': RadioGroup,
    'checkbox': CheckboxGroup,
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
    'form-title': FormTitleField,
  };

  const Component = components[fieldType] || components[normalizedField.type];
  if (!Component) {
    console.warn(`Unknown field type: ${field.type}, Available types:`, Object.keys(components));
    return null;
  }

  // Create stable key for this field instance based solely on ID
  const fieldKey = getFieldKey(field);
  
  // Set margins: use optimized margins based on field type
  const marginClass = fieldType === 'submit' ? 'mt-0' : 
                      fieldType === 'form-title' ? 'mb-6' : 'mb-4';

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
    'data-content': normalizedField.content ? 'true' : 'false',
  };

  // Show warning if type is not supported
  if (!isSupported) {
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
}, 
// Improved deep comparison function for React.memo to prevent unnecessary re-renders
(prevProps, nextProps) => {
  // Quick reference check - if same object reference, no need to re-render
  if (prevProps === nextProps) return true;
  
  // Check ID first - most important for stability
  if (prevProps.field.id !== nextProps.field.id) return false;
  
  // Check primary fields that would affect rendering
  if (prevProps.field.type !== nextProps.field.type) return false;
  if (prevProps.field.label !== nextProps.field.label) return false;
  if (prevProps.field.helpText !== nextProps.field.helpText) return false;
  if (prevProps.field.required !== nextProps.field.required) return false;
  if (prevProps.field.placeholder !== nextProps.field.placeholder) return false;
  if (prevProps.field.icon !== nextProps.field.icon) return false;
  
  // Check content field which is used in rich content fields
  if (prevProps.field.content !== nextProps.field.content) return false;
  
  // Compare form styles that would affect rendering
  if (prevProps.formStyle?.primaryColor !== nextProps.formStyle?.primaryColor) return false;
  if (prevProps.formStyle?.borderRadius !== nextProps.formStyle?.borderRadius) return false;
  if (prevProps.formStyle?.fontSize !== nextProps.formStyle?.fontSize) return false;
  
  // Deep compare field options for dropdown, checkbox, and radio buttons
  const prevOptions = prevProps.field.options || [];
  const nextOptions = nextProps.field.options || [];
  
  if (prevOptions.length !== nextOptions.length) return false;
  
  for (let i = 0; i < prevOptions.length; i++) {
    if (prevOptions[i].value !== nextOptions[i].value) return false;
    if (prevOptions[i].label !== nextOptions[i].label) return false;
  }
  
  // Deep compare style properties that affect rendering
  const prevStyle = prevProps.field.style || {};
  const nextStyle = nextProps.field.style || {};
  
  const styleKeys = [
    'textAlign', 'color', 'backgroundColor', 'fontSize', 'fontWeight', 'showIcon',
    'showTitle', 'showDescription', 'borderColor', 'borderWidth', 'borderRadius', 
    'paddingY', 'paddingX', 'animation', 'animationType', 'labelColor', 'labelFontSize'
  ];
  
  for (const key of styleKeys) {
    if (prevStyle[key] !== nextStyle[key]) return false;
  }
  
  // If we made it here, consider them equal (no re-render needed)
  return true;
});

FormField.displayName = 'FormField';

export default FormField;

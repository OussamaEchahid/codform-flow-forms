
import React from 'react';
import { FormField as FormFieldType } from '@/lib/form-utils';
import TextInput from './fields/TextInput';
import TextArea from './fields/TextArea';
import RadioGroup from './fields/RadioGroup';
import CheckboxGroup from './fields/CheckboxGroup';
import ImageField from './fields/ImageField';
import SubmitButton from './fields/SubmitButton';
import CartItems from './fields/CartItems';
import CartSummary from './fields/CartSummary';
import TitleField from './fields/TitleField';
import HtmlContent from './fields/HtmlContent';
import ShippingOptions from './fields/ShippingOptions';
import CountdownTimer from './fields/CountdownTimer';
import WhatsAppButton from './fields/WhatsAppButton';

interface FormFieldProps {
  field: FormFieldType;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

const FormFieldComponent: React.FC<FormFieldProps> = ({ field, formStyle, formDirection }) => {
  // Determine field class based on direction
  const directionClass = formDirection === 'rtl' ? 'rtl' : 'ltr';
  
  // Get the field component based on type
  const getFieldComponent = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'city':
        return <TextInput field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'textarea':
        return <TextArea field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'radio':
        return <RadioGroup field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'checkbox':
        return <CheckboxGroup field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'image':
        return <ImageField field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'submit':
        return <SubmitButton field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'cart-items':
        return <CartItems field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'cart-summary':
        return <CartSummary field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'form-title':
      case 'title':
        // Title should be centered regardless, but we still pass formDirection for consistency
        return <TitleField field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'html':
        return <HtmlContent field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'shipping-options':
        return <ShippingOptions field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'countdown-timer':
        return <CountdownTimer field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'whatsapp-button':
        return <WhatsAppButton field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      default:
        return (
          <div dir={formDirection} className={directionClass}>
            Unsupported field type: {field.type}
          </div>
        );
    }
  };

  return (
    <div 
      className={`form-field-wrapper ${directionClass}`} 
      data-field-type={field.type}
      data-direction={formDirection}
      dir={formDirection}
    >
      {getFieldComponent()}
    </div>
  );
};

export default FormFieldComponent;

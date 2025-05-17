
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
  // تحديد المكونات التي تدعم خاصية formDirection
  const getFieldComponent = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'city':
        // TextInput يدعم formDirection
        return <TextInput field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'textarea':
        // TextArea لا يدعم formDirection حتى الآن
        return <TextArea field={field} formStyle={formStyle} />;
        
      case 'radio':
        // RadioGroup لا يدعم formDirection حتى الآن
        return <RadioGroup field={field} formStyle={formStyle} />;
        
      case 'checkbox':
        // CheckboxGroup لا يدعم formDirection حتى الآن
        return <CheckboxGroup field={field} formStyle={formStyle} />;
        
      case 'image':
        // ImageField لا يدعم formDirection حتى الآن
        return <ImageField field={field} formStyle={formStyle} />;
        
      case 'submit':
        // SubmitButton لا يدعم formDirection حتى الآن
        return <SubmitButton field={field} formStyle={formStyle} />;
        
      case 'cart-items':
        // CartItems لا يدعم formDirection حتى الآن
        return <CartItems field={field} formStyle={formStyle} />;
        
      case 'cart-summary':
        // CartSummary لا يدعم formDirection حتى الآن
        return <CartSummary field={field} formStyle={formStyle} />;
        
      case 'form-title':
      case 'title':
        // TitleField يدعم formDirection
        return <TitleField field={field} formStyle={formStyle} formDirection={formDirection} />;
        
      case 'html':
        // HtmlContent لا يدعم formDirection حتى الآن
        return <HtmlContent field={field} formStyle={formStyle} />;
        
      case 'shipping-options':
        // ShippingOptions لا يدعم formDirection حتى الآن
        return <ShippingOptions field={field} formStyle={formStyle} />;
        
      case 'countdown-timer':
        // CountdownTimer لا يدعم formDirection حتى الآن
        return <CountdownTimer field={field} formStyle={formStyle} />;
        
      case 'whatsapp-button':
        // WhatsAppButton لا يدعم formDirection حتى الآن
        return <WhatsAppButton field={field} formStyle={formStyle} />;
        
      default:
        return <div>Unsupported field type: {field.type}</div>;
    }
  };

  return (
    <div className="form-field-wrapper">
      {getFieldComponent()}
    </div>
  );
};

export default FormFieldComponent;

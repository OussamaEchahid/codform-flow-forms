import React from 'react';
import { FormField as FormFieldType } from '@/lib/form-utils';
import TextInput from './fields/TextInput';
import SubmitButton from './fields/SubmitButton';
import FormTitleField from './fields/FormTitleField';
import CartItems from './fields/CartItems';
import CartSummary from './fields/CartSummary';
import CheckboxGroup from './fields/CheckboxGroup';
import RadioGroup from './fields/RadioGroup';
import HtmlContent from './fields/HtmlContent';

interface FormFieldProps {
  field: FormFieldType;
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    formDirection?: 'ltr' | 'rtl';
  };
  formCountry?: string;
  formPhonePrefix?: string;
}

const FormField: React.FC<FormFieldProps> = ({ 
  field, 
  formStyle = {}, 
  formCountry = 'SA', 
  formPhonePrefix = '+966' 
}) => {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'textarea':
      return (
        <TextInput 
          field={field} 
          formStyle={formStyle} 
          formCountry={formCountry}
          formPhonePrefix={formPhonePrefix}
        />
      );
    
    case 'form-title':
      return <FormTitleField field={field} formStyle={formStyle} />;
    
    case 'submit':
      return <SubmitButton field={field} formStyle={formStyle} />;
    
    case 'cart-items':
      return <CartItems field={field} formStyle={formStyle} />;
    
    case 'cart-summary':
      return <CartSummary field={field} formStyle={formStyle} />;
    
    case 'checkbox':
      return <CheckboxGroup field={field} formStyle={formStyle} />;
    
    case 'radio':
      return <RadioGroup field={field} formStyle={formStyle} />;
    
    case 'text/html':
      return <HtmlContent field={field} formStyle={formStyle} />;
    
    case 'title':
      return <FormTitleField field={field} formStyle={formStyle} />;
    
    default:
      return (
        <div className="p-4 border border-dashed border-gray-300 rounded text-center text-gray-500">
          نوع حقل غير مدعوم: {field.type}
        </div>
      );
  }
};

export default FormField;

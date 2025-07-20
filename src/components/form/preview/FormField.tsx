import React from 'react';
import { FormField as FormFieldType } from '@/lib/form-utils';
import TextInput from './fields/TextInput';
import SubmitButton from './fields/SubmitButton';
import FormTitle from './fields/FormTitle';
import CartItems from './fields/CartItems';
import CartSummary from './fields/CartSummary';
import Select from './fields/Select';
import Checkbox from './fields/Checkbox';
import Radio from './fields/Radio';
import TextHTML from './fields/TextHTML';
import Title from './fields/Title';

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
      return <FormTitle field={field} formStyle={formStyle} />;
    
    case 'submit':
      return <SubmitButton field={field} formStyle={formStyle} />;
    
    case 'cart-items':
      return <CartItems field={field} formStyle={formStyle} />;
    
    case 'cart-summary':
      return <CartSummary field={field} formStyle={formStyle} />;
    
    case 'select':
      return <Select field={field} formStyle={formStyle} />;
    
    case 'checkbox':
      return <Checkbox field={field} formStyle={formStyle} />;
    
    case 'radio':
      return <Radio field={field} formStyle={formStyle} />;
    
    case 'text/html':
      return <TextHTML field={field} formStyle={formStyle} />;
    
    case 'title':
      return <Title field={field} formStyle={formStyle} />;
    
    default:
      return (
        <div className="p-4 border border-dashed border-gray-300 rounded text-center text-gray-500">
          نوع حقل غير مدعوم: {field.type}
        </div>
      );
  }
};

export default FormField;

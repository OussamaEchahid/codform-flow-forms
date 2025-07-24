
import React from 'react';
import { FormField as FormFieldType } from '@/lib/form-utils';
import TextInput from './fields/TextInput';
import TextArea from './fields/TextArea'; // إضافة import للمكون TextArea
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
  value?: any;
  onChange?: (value: any) => void;
  onClick?: () => void;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ 
  field, 
  formStyle = {}, 
  formCountry = 'MA', 
  formPhonePrefix = '+212',
  value,
  onChange,
  onClick,
  disabled
}) => {
  // Create enhanced field with value and onChange
  const enhancedField = {
    ...field,
    value,
    onChange
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <TextInput 
          field={enhancedField} 
          formStyle={formStyle} 
          formCountry={formCountry}
          formPhonePrefix={formPhonePrefix}
        />
      );
    
    case 'textarea':
      return (
        <TextArea 
          field={enhancedField} 
          formStyle={formStyle} 
        />
      );
    
    case 'form-title':
      return <FormTitleField field={enhancedField} formStyle={formStyle} />;
    
    case 'submit':
      return <SubmitButton field={enhancedField} formStyle={formStyle} onClick={onClick} disabled={disabled} />;
    
    case 'cart-items':
      return <CartItems field={enhancedField} formStyle={formStyle} />;
    
    case 'cart-summary':
      return <CartSummary field={enhancedField} formStyle={formStyle} />;
    
    case 'checkbox':
      return <CheckboxGroup field={enhancedField} formStyle={formStyle} />;
    
    case 'radio':
      return <RadioGroup field={enhancedField} formStyle={formStyle} />;
    
    case 'text/html':
      return <HtmlContent field={enhancedField} formStyle={formStyle} />;
    
    case 'title':
      return <FormTitleField field={enhancedField} formStyle={formStyle} />;
    
    
    default:
      return (
        <div className="p-4 border border-dashed border-gray-300 rounded text-center text-gray-500">
          نوع حقل غير مدعوم: {field.type}
        </div>
      );
  }
};

export default FormField;

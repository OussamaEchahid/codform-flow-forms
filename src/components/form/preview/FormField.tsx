
import React from 'react';
import { FormField } from '@/lib/form-utils';
import TextInputField from './fields/TextInputField';
import EmailInputField from './fields/EmailInputField';
import PhoneInputField from './fields/PhoneInputField';
import TextareaField from './fields/TextareaField';
import SelectField from './fields/SelectField';
import CheckboxField from './fields/CheckboxField';
import RadioField from './fields/RadioField';
import SubmitButtonField from './fields/SubmitButtonField';
import HtmlContentField from './fields/HtmlContentField';
import TitleField from './fields/TitleField';
import CartItemsField from './fields/CartItemsField';
import CartSummaryField from './fields/CartSummaryField';

interface FormFieldComponentProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
    borderColor?: string;
    borderWidth?: string;
    backgroundColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    formGap?: string;
    formDirection?: 'ltr' | 'rtl';
    floatingLabels?: boolean;
  };
}

const FormFieldComponent: React.FC<FormFieldComponentProps> = ({ field, formStyle }) => {
  // Skip form-title fields completely
  if (field.type === 'form-title') {
    return null;
  }

  switch (field.type) {
    case 'text':
      return <TextInputField field={field} formStyle={formStyle} />;
    case 'email':
      return <EmailInputField field={field} formStyle={formStyle} />;
    case 'phone':
      return <PhoneInputField field={field} formStyle={formStyle} />;
    case 'textarea':
      return <TextareaField field={field} formStyle={formStyle} />;
    case 'select':
      return <SelectField field={field} formStyle={formStyle} />;
    case 'checkbox':
      return <CheckboxField field={field} formStyle={formStyle} />;
    case 'radio':
      return <RadioField field={field} formStyle={formStyle} />;
    case 'submit':
      return <SubmitButtonField field={field} formStyle={formStyle} />;
    case 'text/html':
      return <HtmlContentField field={field} formStyle={formStyle} />;
    case 'title':
      return <TitleField field={field} formStyle={formStyle} />;
    case 'cart-items':
      return <CartItemsField field={field} formStyle={formStyle} />;
    case 'cart-summary':
      return <CartSummaryField field={field} formStyle={formStyle} />;
    default:
      return (
        <div className="p-2 bg-gray-100 border rounded text-center text-gray-500">
          نوع حقل غير مدعوم: {field.type}
        </div>
      );
  }
};

export default React.memo(FormFieldComponent);

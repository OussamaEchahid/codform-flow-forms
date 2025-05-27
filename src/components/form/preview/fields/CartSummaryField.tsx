
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface CartSummaryFieldProps {
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

const CartSummaryField: React.FC<CartSummaryFieldProps> = ({ field, formStyle }) => {
  return (
    <div className="space-y-4">
      {field.label && (
        <h3 className="text-lg font-medium text-gray-900">{field.label}</h3>
      )}
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>$0.00</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>$0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummaryField;

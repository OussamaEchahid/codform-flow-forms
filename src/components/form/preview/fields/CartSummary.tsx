
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface CartSummaryProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const CartSummary: React.FC<CartSummaryProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">
        {field.label || (language === 'ar' ? 'ملخص السلة' : 'Cart Summary')}
      </h3>
      <div className="border rounded-md p-4">
        <div className="flex justify-between mb-2">
          <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
          <span>$99.00</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
          <span>$10.00</span>
        </div>
        <div className="border-t pt-2 mt-2 flex justify-between font-medium">
          <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
          <span>$109.00</span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;

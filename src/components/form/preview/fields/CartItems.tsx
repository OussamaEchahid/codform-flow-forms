
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface CartItemsProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const CartItems: React.FC<CartItemsProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">
        {field.label || (language === 'ar' ? 'عناصر السلة' : 'Cart Items')}
      </h3>
      <div className="border rounded-md overflow-hidden">
        {/* Sample cart item for preview */}
        <div className="flex items-center p-4 border-b">
          <div className="w-16 h-16 bg-gray-100 rounded-md mr-4 flex-shrink-0"></div>
          <div className="flex-1">
            <h4 className="font-medium">
              {language === 'ar' ? 'منتج تجريبي' : 'Sample Product'}
            </h4>
            <div className="text-sm text-gray-500 mt-1">
              {language === 'ar' ? 'الكمية: ١' : 'Quantity: 1'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">$99.00</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;

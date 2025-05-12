
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
  const fieldStyle = field.style || {};
  
  // Use border radius from form style if available
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3" style={{
        color: fieldStyle.color || '#1f2937',
        fontSize: fieldStyle.fontSize || formStyle.fontSize || '1.2rem',
      }}>
        {field.label || (language === 'ar' ? 'المنتج المختار' : 'Selected Product')}
      </h3>
      <div className="border rounded-md overflow-hidden" style={{ borderRadius }}>
        {/* Sample cart item for preview */}
        <div className="flex items-center p-4 border-b">
          <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 ml-4" style={{ borderRadius: '0.25rem' }}>
            <img 
              src="https://via.placeholder.com/80" 
              alt="Product" 
              className="w-full h-full object-cover"
              style={{ borderRadius: '0.25rem' }}
            />
          </div>
          <div className="flex-1">
            <h4 className="font-medium" style={{
              fontSize: fieldStyle.titleFontSize || '1.1rem',
              color: fieldStyle.titleColor || '#1f2937',
            }}>
              {language === 'ar' ? 'منتج تجريبي' : 'Sample Product'}
            </h4>
            <div className="text-sm text-gray-500 mt-1" style={{
              fontSize: fieldStyle.descriptionFontSize || '0.9rem',
              color: fieldStyle.descriptionColor || '#6b7280',
            }}>
              {language === 'ar' ? 'الكمية: ١' : 'Quantity: 1'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium" style={{
              fontSize: fieldStyle.priceFontSize || '1rem',
              color: fieldStyle.priceColor || '#1f2937',
            }}>$99.00</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;

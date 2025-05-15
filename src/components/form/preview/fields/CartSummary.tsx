
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ensureColor, ensureSize } from '@/lib/utils';

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
  const fieldStyle = field.style || {};
  
  // استخدام نصف قطر الحدود من نمط النموذج إذا كان متاحًا
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  // Check if we should show the title (default to true if not explicitly set to false)
  const showTitle = field.label !== '' && field.label !== undefined;
  
  return (
    <div className="mb-6 codform-cart-summary">
      {showTitle && (
        <h3 className="text-lg font-medium mb-3" style={{
          color: ensureColor(fieldStyle.color) || '#1f2937',
          fontSize: ensureSize(fieldStyle.fontSize) || formStyle.fontSize || '1.2rem',
        }}>
          {field.label || (language === 'ar' ? 'ملخص الطلب' : 'Order Summary')}
        </h3>
      )}
      <div 
        className="border rounded-md p-4"
        style={{ 
          borderRadius,
          backgroundColor: ensureColor(fieldStyle.backgroundColor) || '#f9fafb',
          borderColor: ensureColor(fieldStyle.borderColor) || '#e5e7eb',
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        <div className="flex justify-between mb-3" data-product-price-display="subtotal">
          <span style={{ 
            fontSize: ensureSize(fieldStyle.labelFontSize) || '1rem',
            color: ensureColor(fieldStyle.labelColor) || '#6b7280' 
          }}>
            {language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
          </span>
          <span style={{
            fontSize: ensureSize(fieldStyle.valueFontSize) || '1rem',
            color: ensureColor(fieldStyle.valueColor) || '#1f2937',
            fontWeight: 500
          }} className="product-price">
            $99.00
          </span>
        </div>
        <div className="flex justify-between mb-3">
          <span style={{ 
            fontSize: ensureSize(fieldStyle.labelFontSize) || '1rem',
            color: ensureColor(fieldStyle.labelColor) || '#6b7280' 
          }}>
            {language === 'ar' ? 'الشحن' : 'Shipping'}
          </span>
          <span style={{
            fontSize: ensureSize(fieldStyle.valueFontSize) || '1rem',
            color: ensureColor(fieldStyle.valueColor) || '#1f2937',
            fontWeight: 500
          }} className="shipping-price">
            $10.00
          </span>
        </div>
        <div className="border-t pt-3 mt-3 flex justify-between">
          <span style={{
            fontSize: ensureSize(fieldStyle.totalLabelFontSize) || '1.1rem',
            color: ensureColor(fieldStyle.totalLabelColor) || '#1f2937',
            fontWeight: 'bold'
          }}>
            {language === 'ar' ? 'الإجمالي' : 'Total'}
          </span>
          <span style={{
            fontSize: ensureSize(fieldStyle.totalValueFontSize) || '1.1rem',
            color: ensureColor(fieldStyle.totalValueColor) || formStyle.primaryColor || '#9b87f5',
            fontWeight: 'bold'
          }} className="total-price">
            $109.00
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;


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
  const fieldStyle = field.style || {};
  
  // Use border radius from form style if available
  const borderRadius = formStyle.borderRadius || '0.5rem';
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3" style={{
        color: fieldStyle.color || '#1f2937',
        fontSize: fieldStyle.fontSize || formStyle.fontSize || '1.2rem',
      }}>
        {field.label || (language === 'ar' ? 'ملخص الطلب' : 'Order Summary')}
      </h3>
      <div 
        className="border rounded-md p-4"
        style={{ 
          borderRadius,
          backgroundColor: fieldStyle.backgroundColor || '#f9fafb',
          borderColor: fieldStyle.borderColor || '#e5e7eb'
        }}
      >
        <div className="flex justify-between mb-3">
          <span style={{ 
            fontSize: fieldStyle.labelFontSize || '1rem',
            color: fieldStyle.labelColor || '#6b7280' 
          }}>
            {language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
          </span>
          <span style={{
            fontSize: fieldStyle.valueFontSize || '1rem',
            color: fieldStyle.valueColor || '#1f2937',
            fontWeight: 500
          }}>
            $99.00
          </span>
        </div>
        <div className="flex justify-between mb-3">
          <span style={{ 
            fontSize: fieldStyle.labelFontSize || '1rem',
            color: fieldStyle.labelColor || '#6b7280' 
          }}>
            {language === 'ar' ? 'الشحن' : 'Shipping'}
          </span>
          <span style={{
            fontSize: fieldStyle.valueFontSize || '1rem',
            color: fieldStyle.valueColor || '#1f2937',
            fontWeight: 500
          }}>
            $10.00
          </span>
        </div>
        <div className="border-t pt-3 mt-3 flex justify-between">
          <span style={{
            fontSize: fieldStyle.totalLabelFontSize || '1.1rem',
            color: fieldStyle.totalLabelColor || '#1f2937',
            fontWeight: 'bold'
          }}>
            {language === 'ar' ? 'الإجمالي' : 'Total'}
          </span>
          <span style={{
            fontSize: fieldStyle.totalValueFontSize || '1.1rem',
            color: fieldStyle.totalValueColor || formStyle.primaryColor || '#9b87f5',
            fontWeight: 'bold'
          }}>
            $109.00
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;

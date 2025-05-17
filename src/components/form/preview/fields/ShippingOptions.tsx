
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';

interface ShippingOptionsProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

const ShippingOptions: React.FC<ShippingOptionsProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Determine direction based on formDirection prop or language
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  const shippingOptions = [
    {
      id: 'standard',
      name: language === 'ar' ? 'توصيل قياسي' : 'Standard Delivery',
      price: '$5.00',
      time: language === 'ar' ? '3-5 أيام' : '3-5 days',
    },
    {
      id: 'express',
      name: language === 'ar' ? 'توصيل سريع' : 'Express Delivery',
      price: '$15.00',
      time: language === 'ar' ? '1-2 أيام' : '1-2 days',
    }
  ];
  
  return (
    <div 
      className="form-control mb-6 shipping-options-container"
      style={{
        direction: textDirection
      }}
      dir={textDirection}
      data-direction={textDirection}
    >
      <label 
        className="form-label mb-2 block font-medium" 
        style={{ 
          color: fieldStyle.color,
          textAlign: textDirection === 'rtl' ? 'right' : 'left'
        }}
      >
        {field.label || (language === 'ar' ? 'خيارات التوصيل' : 'Shipping Options')}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <RadioGroup 
        defaultValue="standard"
        className="space-y-3"
        dir={textDirection}
        disabled
      >
        {shippingOptions.map((option) => (
          <div 
            key={option.id} 
            className="flex items-center space-x-2"
            style={{
              flexDirection: textDirection === 'rtl' ? 'row-reverse' : 'row',
              gap: '8px'
            }}
          >
            <RadioGroupItem value={option.id} />
            <div 
              className="flex flex-1 justify-between items-center"
              style={{
                flexDirection: textDirection === 'rtl' ? 'row-reverse' : 'row',
                direction: textDirection
              }}
            >
              <div style={{ textAlign: textDirection === 'rtl' ? 'right' : 'left' }}>
                <div className="font-medium">{option.name}</div>
                <div className="text-sm text-gray-500">{option.time}</div>
              </div>
              <div className="font-medium">{option.price}</div>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default ShippingOptions;

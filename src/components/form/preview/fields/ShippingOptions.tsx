
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';
import { Label } from '@/components/ui/label';

interface ShippingOptionsProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const ShippingOptions: React.FC<ShippingOptionsProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  const isRtl = language === 'ar';
  
  const shippingOptions = [
    {
      id: 'standard',
      name: isRtl ? 'توصيل قياسي' : 'Standard Delivery',
      price: '$5.00',
      time: isRtl ? '3-5 أيام' : '3-5 days',
    },
    {
      id: 'express',
      name: isRtl ? 'توصيل سريع' : 'Express Delivery',
      price: '$15.00',
      time: isRtl ? '1-2 أيام' : '1-2 days',
    }
  ];
  
  return (
    <div className="form-control mb-6" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <label 
        className="form-label mb-2 block" 
        style={{ 
          color: fieldStyle.color,
          textAlign: isRtl ? 'right' : 'left'
        }}
      >
        {field.label || (isRtl ? 'خيارات التوصيل' : 'Shipping Options')}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <RadioGroup 
        defaultValue="standard"
        className="space-y-3"
        disabled
      >
        {shippingOptions.map((option) => (
          <div key={option.id} className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <RadioGroupItem 
              value={option.id} 
              id={`shipping-${option.id}`}
              style={{ 
                borderColor: formStyle.primaryColor,
              }} 
            />
            <div className={`flex flex-1 justify-between items-center ${isRtl ? 'mr-2' : 'ml-2'}`}>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <Label htmlFor={`shipping-${option.id}`} className="font-medium">{option.name}</Label>
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

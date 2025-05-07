
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
    <div className="form-control mb-6">
      <label 
        className="form-label mb-2 block" 
        style={{ 
          color: fieldStyle.color,
          textAlign: language === 'ar' ? 'right' : 'left'
        }}
      >
        {field.label || (language === 'ar' ? 'خيارات التوصيل' : 'Shipping Options')}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <RadioGroup 
        defaultValue="standard"
        className="space-y-3"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        disabled
      >
        {shippingOptions.map((option) => (
          <div key={option.id} className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <RadioGroupItem value={option.id} id={`shipping-${option.id}`} />
            <div className={`flex flex-1 justify-between items-center ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
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

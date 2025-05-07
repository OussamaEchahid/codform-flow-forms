
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface CountdownTimerProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  return (
    <div className="mb-6">
      <div 
        className="p-4 border rounded-md text-center"
        style={{
          backgroundColor: fieldStyle.backgroundColor || 'rgba(155, 135, 245, 0.1)',
          borderColor: fieldStyle.borderColor || formStyle.primaryColor || '#9b87f5',
        }}
      >
        <h3 
          className="text-lg font-medium mb-2"
          style={{ color: fieldStyle.color || 'inherit' }}
        >
          {field.label || (language === 'ar' ? 'الوقت المتبقي للعرض' : 'Offer ends in')}
        </h3>
        <div className="flex justify-center gap-4 mt-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white p-2 rounded min-w-[60px] shadow-sm">
            <div className="text-2xl font-bold" style={{ color: formStyle.primaryColor || '#9b87f5' }}>24</div>
            <div className="text-xs text-gray-500">
              {language === 'ar' ? 'ساعة' : 'Hours'}
            </div>
          </div>
          <div className="bg-white p-2 rounded min-w-[60px] shadow-sm">
            <div className="text-2xl font-bold" style={{ color: formStyle.primaryColor || '#9b87f5' }}>00</div>
            <div className="text-xs text-gray-500">
              {language === 'ar' ? 'دقيقة' : 'Minutes'}
            </div>
          </div>
          <div className="bg-white p-2 rounded min-w-[60px] shadow-sm">
            <div className="text-2xl font-bold" style={{ color: formStyle.primaryColor || '#9b87f5' }}>00</div>
            <div className="text-xs text-gray-500">
              {language === 'ar' ? 'ثانية' : 'Seconds'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

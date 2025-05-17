
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
  formDirection?: 'ltr' | 'rtl';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Determine direction based on formDirection prop or language
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  return (
    <div 
      className="mb-6"
      dir={textDirection}
      data-direction={textDirection}
    >
      <div 
        className="p-4 border rounded-md text-center"
        style={{
          backgroundColor: fieldStyle.backgroundColor || 'rgba(155, 135, 245, 0.1)',
          borderColor: fieldStyle.borderColor || formStyle.primaryColor || '#9b87f5',
        }}
        dir={textDirection}
      >
        <h3 
          className="text-lg font-medium mb-2"
          dir={textDirection}
        >
          {field.label || (language === 'ar' ? 'الوقت المتبقي للعرض' : 'Offer ends in')}
        </h3>
        <div 
          className="flex justify-center gap-4 mt-3"
          dir={textDirection}
        >
          <div className="bg-white p-2 rounded min-w-[60px]">
            <div className="text-2xl font-bold">24</div>
            <div className="text-xs text-gray-500">
              {language === 'ar' ? 'ساعة' : 'Hours'}
            </div>
          </div>
          <div className="bg-white p-2 rounded min-w-[60px]">
            <div className="text-2xl font-bold">00</div>
            <div className="text-xs text-gray-500">
              {language === 'ar' ? 'دقيقة' : 'Minutes'}
            </div>
          </div>
          <div className="bg-white p-2 rounded min-w-[60px]">
            <div className="text-2xl font-bold">00</div>
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

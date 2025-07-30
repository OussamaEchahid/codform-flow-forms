
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
  const { t } = useI18n();
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
        <h3 className="text-lg font-medium mb-2">
          {field.label || t('offerEndsIn')}
        </h3>
        <div className="flex justify-center gap-4 mt-3">
          <div className="bg-white p-2 rounded min-w-[60px]">
            <div className="text-2xl font-bold">24</div>
            <div className="text-xs text-gray-500">
              {t('hours')}
            </div>
          </div>
          <div className="bg-white p-2 rounded min-w-[60px]">
            <div className="text-2xl font-bold">00</div>
            <div className="text-xs text-gray-500">
              {t('minutes')}
            </div>
          </div>
          <div className="bg-white p-2 rounded min-w-[60px]">
            <div className="text-2xl font-bold">00</div>
            <div className="text-xs text-gray-500">
              {t('seconds')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

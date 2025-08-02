
import React, { useState, useEffect } from 'react';
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
  const { t, language } = useI18n();
  const fieldStyle = field.style || {};
  
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 23,
    minutes: 59,
    seconds: 5
  });

  // Real countdown functionality
  useEffect(() => {
    const endDate = fieldStyle.endDate 
      ? new Date(fieldStyle.endDate).getTime()
      : Date.now() + (2 * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (5 * 1000); // Default: 2 days 23:59:05 from now

    const timer = setInterval(() => {
      const now = Date.now();
      const difference = endDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fieldStyle.endDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const containerStyle = {
    backgroundColor: fieldStyle.backgroundColor || '#d4ff00',
    borderColor: fieldStyle.borderColor || '#b8e600',
    borderRadius: fieldStyle.borderRadius || '8px',
    borderWidth: '2px',
    borderStyle: 'solid',
    fontFamily: fieldStyle.fontFamily || 'Tajawal',
    direction: (language === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr'
  };

  const titleStyle = {
    color: fieldStyle.titleColor || fieldStyle.color || '#000000',
    fontSize: fieldStyle.titleSize || fieldStyle.fontSize || '18px',
    fontWeight: fieldStyle.titleWeight || fieldStyle.fontWeight || '700',
    textAlign: fieldStyle.textAlign || 'center',
    marginBottom: '12px'
  };

  const counterBoxStyle = {
    backgroundColor: fieldStyle.counterBackgroundColor || '#ffffff',
    borderRadius: '8px',
    padding: '8px',
    minWidth: '60px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid rgba(0,0,0,0.1)'
  };

  const counterNumberStyle = {
    color: fieldStyle.counterColor || '#000000',
    fontSize: fieldStyle.counterFontSize || '24px',
    fontWeight: fieldStyle.counterFontWeight || '700',
    lineHeight: fieldStyle.counterLineHeight || '1.2',
    margin: '0'
  };

  const counterLabelStyle = {
    fontSize: '12px',
    color: '#666666',
    marginTop: '4px',
    fontWeight: '500'
  };

  return (
    <div className="mb-6">
      <div className="p-4" style={containerStyle}>
        <h3 style={titleStyle as any}>
          {field.label || (language === 'ar' ? 'العرض ينتهي خلال' : 'Offer ends in')}
        </h3>
        
        <div 
          className="flex justify-center gap-3"
          style={{ 
            flexDirection: language === 'ar' ? 'row-reverse' : 'row',
            alignItems: 'center'
          }}
        >
          {/* Days */}
          <div style={counterBoxStyle} className="text-center">
            <div style={counterNumberStyle}>
              {formatNumber(timeLeft.days)}
            </div>
            <div style={counterLabelStyle}>
              {fieldStyle.daysLabel || (language === 'ar' ? 'أيام' : 'Days')}
            </div>
          </div>

          {/* Separator */}
          <div 
            style={{ 
              color: fieldStyle.counterColor || '#000000',
              fontSize: fieldStyle.counterFontSize || '24px',
              fontWeight: 'bold',
              lineHeight: '1'
            }}
          >
            :
          </div>

          {/* Hours */}
          <div style={counterBoxStyle} className="text-center">
            <div style={counterNumberStyle}>
              {formatNumber(timeLeft.hours)}
            </div>
            <div style={counterLabelStyle}>
              {fieldStyle.hoursLabel || (language === 'ar' ? 'ساعات' : 'Hrs')}
            </div>
          </div>

          {/* Separator */}
          <div 
            style={{ 
              color: fieldStyle.counterColor || '#000000',
              fontSize: fieldStyle.counterFontSize || '24px',
              fontWeight: 'bold',
              lineHeight: '1'
            }}
          >
            :
          </div>

          {/* Minutes */}
          <div style={counterBoxStyle} className="text-center">
            <div style={counterNumberStyle}>
              {formatNumber(timeLeft.minutes)}
            </div>
            <div style={counterLabelStyle}>
              {fieldStyle.minutesLabel || (language === 'ar' ? 'دقائق' : 'Mins')}
            </div>
          </div>

          {/* Separator */}
          <div 
            style={{ 
              color: fieldStyle.counterColor || '#000000',
              fontSize: fieldStyle.counterFontSize || '24px',
              fontWeight: 'bold',
              lineHeight: '1'
            }}
          >
            :
          </div>

          {/* Seconds */}
          <div style={counterBoxStyle} className="text-center">
            <div style={counterNumberStyle}>
              {formatNumber(timeLeft.seconds)}
            </div>
            <div style={counterLabelStyle}>
              {fieldStyle.secondsLabel || (language === 'ar' ? 'ثواني' : 'Secs')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

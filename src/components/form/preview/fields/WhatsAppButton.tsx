
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface WhatsAppButtonProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};

  // تحديد رقم الواتساب والرسالة
  const phoneNumber = field.whatsappNumber || '';
  
  // لضمان التوافق مع الأنماط القديمة
  const message = field.message || '';
  
  // نص الزر
  const buttonText = field.label || (language === 'ar' ? 'تواصل عبر واتساب' : 'Contact via WhatsApp');

  // إنشاء رابط الواتساب
  const getWhatsAppLink = () => {
    let link = `https://wa.me/${phoneNumber.replace(/\D/g, '')}`;
    if (message) {
      link += `?text=${encodeURIComponent(message)}`;
    }
    return link;
  };

  return (
    <div className="mb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <a 
        href={getWhatsAppLink()} 
        target="_blank" 
        rel="noopener noreferrer"
        className="codform-whatsapp-button"
        style={{
          backgroundColor: '#25D366',
          borderRadius: fieldStyle.borderRadius || formStyle.borderRadius || '8px',
          fontSize: fieldStyle.fontSize || '18px',
        }}
      >
        <svg 
          className="codform-whatsapp-icon" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          strokeWidth="2" 
          stroke="currentColor" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"></path>
          <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"></path>
        </svg>
        {buttonText}
      </a>
      
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  );
};

export default WhatsAppButton;

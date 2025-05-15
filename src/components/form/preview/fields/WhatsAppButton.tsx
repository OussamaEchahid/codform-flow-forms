
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { MessageSquare } from 'lucide-react';
import { ensureString, ensureColor, ensureSize } from '@/lib/utils';

interface WhatsAppButtonProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Get WhatsApp number from the field
  const whatsappNumber = ensureString(field.whatsappNumber) || '';
  
  // Default message
  const message = ensureString(field.message) || '';
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  
  // Determine button radius based on style
  let buttonRadius = '0.5rem'; // default
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  } else {
    buttonRadius = ensureSize(formStyle.borderRadius) || '0.5rem';
  }
  
  return (
    <div className="mb-4">
      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 px-4 flex items-center justify-center gap-2 text-white font-medium transition-all duration-200 hover:opacity-90"
        style={{
          backgroundColor: ensureColor(fieldStyle.backgroundColor) || '#25D366',
          color: ensureColor(fieldStyle.color) || 'white',
          fontSize: ensureSize(fieldStyle.fontSize) || ensureSize(formStyle.fontSize) || '1.1rem',
          borderRadius: ensureSize(fieldStyle.borderRadius) || buttonRadius,
          textDecoration: 'none',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <MessageSquare size={20} />
        {field.label || (language === 'ar' ? 'تواصل عبر واتساب' : 'Contact via WhatsApp')}
      </a>
    </div>
  );
};

export default WhatsAppButton;

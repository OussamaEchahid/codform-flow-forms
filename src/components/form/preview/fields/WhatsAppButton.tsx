
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { MessageSquare } from 'lucide-react';

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
  const whatsappNumber = field.whatsappNumber || '';
  
  // Default message
  const message = field.message || '';
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  
  // Determine button radius based on style
  let buttonRadius = '8px'; // default to match the store's appearance
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  } else {
    buttonRadius = formStyle.borderRadius || '8px';
  }
  
  // Icon style to ensure consistent display
  const iconStyle = {
    width: '18px',
    height: '18px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };
  
  return (
    <div className="mb-4">
      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="codform-whatsapp-button"
        style={{
          backgroundColor: fieldStyle.backgroundColor || '#25D366',
          color: fieldStyle.color || 'white',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '18px',
          borderRadius: fieldStyle.borderRadius || buttonRadius,
          textDecoration: 'none',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '14px 20px',
          fontWeight: '600',
          width: '100%',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: 'Cairo, sans-serif',
          marginTop: '14px',
          marginBottom: '8px',
          textAlign: 'center'
        }}
        data-button-type="whatsapp"
        data-whatsapp-number={whatsappNumber}
      >
        <MessageSquare style={iconStyle} className="codform-whatsapp-icon" />
        {field.label || (language === 'ar' ? 'تواصل عبر واتساب' : 'Contact via WhatsApp')}
      </a>
    </div>
  );
};

export default WhatsAppButton;

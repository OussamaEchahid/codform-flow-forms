import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { MessageSquare, Facebook, Instagram, Twitter, Youtube, Linkedin, Phone, Mail } from 'lucide-react';

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
  
  // Icon mapping
  const iconMap = {
    whatsapp: MessageSquare,
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin,
    phone: Phone,
    email: Mail,
  };

  const IconComponent = iconMap[fieldStyle.icon as keyof typeof iconMap] || MessageSquare;
  
  // Determine button radius based on style
  let buttonRadius = fieldStyle.borderRadius || '8px';
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  }
  
  // Animation classes
  const animationClass = fieldStyle.animation && typeof fieldStyle.animation === 'string' && fieldStyle.animation !== 'none' 
    ? `animate-${fieldStyle.animation}` 
    : '';
  
  // Icon style to ensure consistent display
  const iconStyle = {
    width: '18px',
    height: '18px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: fieldStyle.iconColor || fieldStyle.color || 'white'
  };
  
  return (
    <div className="mb-2">
      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`codform-whatsapp-button ${animationClass}`}
        style={{
          backgroundColor: fieldStyle.backgroundColor || '#25D366',
          color: fieldStyle.color || 'white',
          fontSize: fieldStyle.fontSize || formStyle.fontSize || '18px',
          fontWeight: fieldStyle.fontWeight || '600',
          fontFamily: fieldStyle.fontFamily || 'Cairo, sans-serif',
          borderRadius: buttonRadius,
          textDecoration: 'none',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: `${fieldStyle.paddingY || '14px'} 20px`,
          width: '100%',
          border: fieldStyle.borderWidth && parseInt(fieldStyle.borderWidth) > 0 
            ? `${fieldStyle.borderWidth} solid ${fieldStyle.borderColor || '#000000'}`
            : 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginTop: '14px',
          marginBottom: '8px',
          textAlign: 'center'
        }}
        data-button-type="whatsapp"
        data-whatsapp-number={whatsappNumber}
      >
        {fieldStyle.showIcon !== false && (
          <IconComponent style={iconStyle} className="codform-whatsapp-icon" />
        )}
        {field.label || (language === 'ar' ? 'تواصل عبر واتساب' : 'Contact via WhatsApp')}
      </a>
    </div>
  );
};

export default WhatsAppButton;
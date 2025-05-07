
import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(field.whatsappNumber || '');
  const [whatsappMessage, setWhatsappMessage] = useState(field.message || '');
  
  // Determine button radius based on style
  let buttonRadius = '0.5rem'; // default
  if (formStyle.buttonStyle === 'pill') {
    buttonRadius = '9999px';
  } else if (formStyle.buttonStyle === 'square') {
    buttonRadius = '0';
  } else {
    buttonRadius = formStyle.borderRadius || '0.5rem';
  }
  
  // Format WhatsApp URL
  const formatWhatsAppUrl = () => {
    const phoneNumber = whatsappNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(whatsappMessage);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  };
  
  return (
    <div className="mb-4 mt-4">
      <a
        href={whatsappNumber ? formatWhatsAppUrl() : '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 px-4 font-medium flex items-center justify-center no-underline"
        style={{
          backgroundColor: fieldStyle.backgroundColor || '#25D366',
          color: fieldStyle.color || 'white',
          fontSize: fieldStyle.fontSize || formStyle.fontSize,
          borderRadius: buttonRadius,
          textDecoration: 'none',
          display: 'inline-flex',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          if (!whatsappNumber) {
            e.preventDefault();
            setIsDialogOpen(true);
          }
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="mr-2"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        {field.label || (language === 'ar' ? 'التواصل عبر واتساب' : 'Contact via WhatsApp')}
      </a>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إعداد زر واتساب' : 'Configure WhatsApp Button'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp-number" className="text-right">
                {language === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}
              </Label>
              <Input
                id="whatsapp-number"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: 966500000000' : 'Example: 15551234567'}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp-message" className="text-right">
                {language === 'ar' ? 'الرسالة' : 'Message'}
              </Label>
              <Input
                id="whatsapp-message"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل الرسالة الافتراضية' : 'Enter default message'}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => setIsDialogOpen(false)}
              style={{ backgroundColor: formStyle.primaryColor }}
            >
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppButton;

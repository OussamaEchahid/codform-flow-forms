
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Check, 
  CircleDot, 
  Mail, 
  Phone, 
  AlignLeft, 
  Image, 
  ShoppingCart, 
  Truck, 
  Timer, 
  MessageSquare 
} from 'lucide-react';

interface ElementPanelProps {
  onAddElement: (type: string) => void;
}

const ElementPanel: React.FC<ElementPanelProps> = ({ onAddElement }) => {
  const { language } = useI18n();
  
  const elements = [
    { type: 'text', label: language === 'ar' ? 'حقل نص' : 'Text Field', icon: <FileText size={16} /> },
    { type: 'email', label: language === 'ar' ? 'بريد إلكتروني' : 'Email', icon: <Mail size={16} /> },
    { type: 'phone', label: language === 'ar' ? 'هاتف' : 'Phone', icon: <Phone size={16} /> },
    { type: 'textarea', label: language === 'ar' ? 'نص طويل' : 'Textarea', icon: <AlignLeft size={16} /> },
    { type: 'checkbox', label: language === 'ar' ? 'خانة اختيار' : 'Checkbox', icon: <Check size={16} /> },
    { type: 'radio', label: language === 'ar' ? 'خيارات' : 'Radio', icon: <CircleDot size={16} /> },
    { type: 'image', label: language === 'ar' ? 'صورة' : 'Image', icon: <Image size={16} /> },
    { type: 'title', label: language === 'ar' ? 'عنوان' : 'Title', icon: <FileText size={16} /> },
    { type: 'text/html', label: language === 'ar' ? 'HTML' : 'HTML', icon: <FileText size={16} /> },
    { type: 'cart-items', label: language === 'ar' ? 'عناصر السلة' : 'Cart Items', icon: <ShoppingCart size={16} /> },
    { type: 'cart-summary', label: language === 'ar' ? 'ملخص السلة' : 'Cart Summary', icon: <ShoppingCart size={16} /> },
    { type: 'shipping', label: language === 'ar' ? 'خيارات الشحن' : 'Shipping', icon: <Truck size={16} /> },
    { type: 'countdown', label: language === 'ar' ? 'عداد تنازلي' : 'Countdown', icon: <Timer size={16} /> },
    { type: 'whatsapp', label: language === 'ar' ? 'واتساب' : 'WhatsApp', icon: <MessageSquare size={16} /> },
    { type: 'submit', label: language === 'ar' ? 'زر إرسال' : 'Submit Button', icon: <FileText size={16} /> },
  ];
  
  return (
    <div className="border rounded-md p-4">
      <h3 className="text-lg font-medium mb-4">
        {language === 'ar' ? 'إضافة عناصر' : 'Add Elements'}
      </h3>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {elements.map((element) => (
          <div 
            key={element.type}
            className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
            onClick={() => onAddElement(element.type)}
          >
            <div className="flex items-center gap-2">
              {element.icon}
              <span>{element.label}</span>
            </div>
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              +
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ElementPanel;

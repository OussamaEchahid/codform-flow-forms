
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface FormElementListProps {
  onAddElement: (type: string) => void;
}

const FormElementList: React.FC<FormElementListProps> = ({ onAddElement }) => {
  const { language } = useI18n();
  
  // Available elements with form-title as the first element
  const availableElements = [
    { 
      type: 'form-title', 
      label: language === 'ar' ? 'عنوان النموذج' : 'Form Title', 
      icon: 'T' 
    },
    { 
      type: 'text', 
      label: language === 'ar' ? 'حقل نص' : 'Text Input', 
      icon: 'T' 
    },
    { 
      type: 'textarea', 
      label: language === 'ar' ? 'نص متعدد الأسطر' : 'Multi-line Input', 
      icon: '¶' 
    },
    { 
      type: 'radio', 
      label: language === 'ar' ? 'زر راديو' : 'Single Choice', 
      icon: '◉' 
    },
    { 
      type: 'checkbox', 
      label: language === 'ar' ? 'خانة اختيار' : 'Multiple Choices', 
      icon: '☑' 
    },
    { 
      type: 'image', 
      label: language === 'ar' ? 'صورة' : 'Image', 
      icon: '🖼️' 
    },
    { 
      type: 'text/html', 
      label: language === 'ar' ? 'نص/HTML' : 'HTML Content', 
      icon: '</>' 
    },
    { 
      type: 'cart-items', 
      label: language === 'ar' ? 'عناصر السلة' : 'Cart Items', 
      icon: '🛒' 
    },
    { 
      type: 'cart-summary', 
      label: language === 'ar' ? 'ملخص السلة' : 'Cart Summary', 
      icon: '🧾' 
    },
    { 
      type: 'shipping', 
      label: language === 'ar' ? 'خيارات الشحن' : 'Shipping', 
      icon: '🚚' 
    },
    { 
      type: 'countdown', 
      label: language === 'ar' ? 'العد التنازلي' : 'Countdown', 
      icon: '⏱️' 
    },
    { 
      type: 'whatsapp', 
      label: language === 'ar' ? 'زر واتساب' : 'WhatsApp Button', 
      icon: '💬' 
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className={`font-medium text-lg mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
        {language === 'ar' ? 'عناصر للإضافة' : 'Elements To Add'}
      </h3>
      
      {availableElements.map((element) => (
        <div 
          key={element.type}
          className={`flex items-center justify-between p-3 hover:bg-gray-50 border rounded-md cursor-pointer ${language === 'ar' ? 'flex-row-reverse' : ''}`}
        >
          <Button 
            variant="ghost" 
            size="sm"
            className="p-1" 
            onClick={() => onAddElement(element.type)}
          >
            <Plus size={16} />
          </Button>
          
          <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span>{element.label}</span>
            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded">
              {element.icon}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormElementList;

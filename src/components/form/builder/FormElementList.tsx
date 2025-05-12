
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Define the available form elements locally to avoid dependency on external variables
const defaultElements = [
  { type: 'text', label: 'Text Input', icon: 'T' },
  { type: 'email', label: 'Email Input', icon: '@' },
  { type: 'phone', label: 'Phone Input', icon: '☎' },
  { type: 'textarea', label: 'Text Area', icon: '¶' },
  { type: 'select', label: 'Dropdown', icon: '▼' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑' },
  { type: 'radio', label: 'Radio Button', icon: '◉' },
  { type: 'text/html', label: 'HTML Content', icon: '</>' },
  { type: 'submit', label: 'Submit Button', icon: '✓' },
  { type: 'cart-items', label: 'Cart Items', icon: '🛒' },
  { type: 'cart-summary', label: 'Cart Summary', icon: '🧾' },
  { type: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'form-title', label: 'Form Title', icon: 'H1' }
];

interface FormElementListProps {
  availableElements?: Array<{
    type: string;
    label: string;
    icon: string;
  }>;
  onAddElement: (type: string) => void;
}

const FormElementList: React.FC<FormElementListProps> = ({ 
  availableElements = defaultElements, 
  onAddElement 
}) => {
  const { language } = useI18n();

  return (
    <div className="space-y-2">
      <h3 className={`font-medium text-lg mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
        {language === 'ar' ? 'عناصر للإضافة' : 'Elements To Add'}
      </h3>
      
      {availableElements.map((element) => (
        <div 
          key={element.type}
          className="flex items-center justify-between p-3 hover:bg-gray-50 border rounded-md cursor-pointer"
        >
          <Button 
            variant="ghost" 
            size="sm"
            className="p-1" 
            onClick={() => onAddElement(element.type)}
          >
            <Plus size={16} />
          </Button>
          
          <div className="flex items-center gap-2">
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

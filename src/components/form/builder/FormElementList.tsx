
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface FormElementListProps {
  availableElements?: Array<{
    type: string;
    label: string;
    icon: string;
  }>;
  onAddElement: (type: string) => void;
}

const defaultElements = [
  { type: 'text', label: 'حقل نص', icon: 'T' },
  { type: 'email', label: 'بريد إلكتروني', icon: '@' },
  { type: 'phone', label: 'رقم هاتف', icon: '📱' },
  { type: 'textarea', label: 'نص متعدد الأسطر', icon: '¶' },
  { type: 'select', label: 'قائمة منسدلة', icon: '▼' },
  { type: 'checkbox', label: 'خانة اختيار', icon: '☑' },
  { type: 'radio', label: 'زر راديو', icon: '○' },
  { type: 'text/html', label: 'نص/HTML', icon: '</>' }
];

const FormElementList = ({ 
  availableElements = defaultElements, 
  onAddElement 
}: FormElementListProps) => {
  const { language } = useI18n();

  const handleAddElement = React.useCallback((type: string) => {
    onAddElement(type);
  }, [onAddElement]);
  
  // إنشاء عناصر القائمة بطريقة مستقرة
  const listItems = React.useMemo(() => {
    return availableElements.map((element) => (
      <div 
        key={element.type}
        className="flex justify-between items-center p-3 hover:bg-gray-50 border rounded-md"
      >
        <Button 
          variant="ghost" 
          size="sm"
          className="p-1" 
          onClick={() => handleAddElement(element.type)}
          type="button"
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
    ));
  }, [availableElements, handleAddElement]);

  return (
    <div className="space-y-2">
      <h3 className={`font-medium text-lg mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
        {language === 'ar' ? 'عناصر للإضافة' : 'Elements To Add'}
      </h3>
      
      {listItems}
    </div>
  );
};

export default React.memo(FormElementList);

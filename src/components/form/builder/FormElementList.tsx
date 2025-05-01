
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface FormElementListProps {
  availableElements: Array<{
    type: string;
    label: string;
    icon: string;
  }>;
  onAddElement: (type: string) => void;
}

const FormElementList: React.FC<FormElementListProps> = ({ 
  availableElements = [], // Provide default empty array
  onAddElement 
}) => {
  const { language } = useI18n();

  // Check if availableElements exists before mapping
  if (!availableElements || availableElements.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className={`font-medium text-lg mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'لا توجد عناصر للإضافة' : 'No Elements Available'}
        </h3>
        <div className="p-3 border rounded-md text-center text-gray-500">
          {language === 'ar' ? 'لم يتم تكوين عناصر للإضافة' : 'No elements configured to add'}
        </div>
      </div>
    );
  }

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

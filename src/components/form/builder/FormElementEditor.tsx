
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface FormElementEditorProps {
  elements: FormField[];
  selectedIndex: number | null;
  onSelectElement: (index: number) => void;
  onEditElement: (index: number) => void;
  onDeleteElement: (index: number) => void;
  onDuplicateElement: (index: number) => void;
}

const FormElementEditor: React.FC<FormElementEditorProps> = ({
  elements = [], // Provide default empty array
  selectedIndex,
  onSelectElement,
  onEditElement,
  onDeleteElement,
  onDuplicateElement
}) => {
  const { language } = useI18n();

  // Handle case when elements is undefined
  if (!elements || elements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-md border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {language === 'ar' ? 'تنسيق النموذج العام' : 'Global form styling'}
            </h3>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-md border text-center text-gray-500">
          {language === 'ar' ? 'لا توجد عناصر في النموذج' : 'No elements in the form'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-md border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {language === 'ar' ? 'تنسيق النموذج العام' : 'Global form styling'}
          </h3>
        </div>
      </div>
      
      {elements.map((element, index) => (
        <div 
          key={element.id}
          className={`bg-white p-4 rounded-md border ${selectedIndex === index ? 'ring-2 ring-[#9b87f5]' : ''}`}
          onClick={() => onSelectElement(index)}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteElement(index);
                  }}
                >
                  <Trash size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-500 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateElement(index);
                  }}
                >
                  <Copy size={16} />
                </Button>
                <span className="border-r h-4 mx-2"></span>
                <span className="font-medium">
                  {element.label} {language === 'ar' ? 'إعدادات' : 'configuration'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="bg-green-100 text-green-700 rounded-full p-1 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateElement(index);
                }}
              >
                <Copy size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="bg-purple-100 text-purple-700 rounded-full p-1 h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEditElement(index);
                }}
              >
                <Edit size={16} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormElementEditor;

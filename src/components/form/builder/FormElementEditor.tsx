
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash, GripVertical } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

interface FormElementEditorProps {
  elements: FormField[];
  selectedIndex: number | null;
  onSelectElement: (index: number) => void;
  onEditElement: (index: number) => void;
  onDeleteElement: (index: number) => void;
  onDuplicateElement: (index: number) => void;
}

// Individual form element component with drag handle
const SortableFormElement = ({ 
  element, 
  index, 
  isSelected, 
  onSelect,
  onEdit,
  onDelete,
  onDuplicate 
}: { 
  element: FormField, 
  index: number,
  isSelected: boolean,
  onSelect: () => void,
  onEdit: () => void,
  onDelete: () => void,
  onDuplicate: () => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: element.id });
  const { language } = useI18n();
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 rounded-md border ${isSelected ? 'ring-2 ring-[#9b87f5]' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-move p-1"
        >
          <GripVertical size={16} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500 p-1"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
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
                onDuplicate();
              }}
            >
              <Copy size={16} />
            </Button>
            
            <span className="border-r h-4 mx-2"></span>
            
            <span className="font-medium">
              {element.label || element.type} {language === 'ar' ? 'إعدادات' : 'configuration'}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-purple-100 text-purple-700 rounded-full p-1 h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const FormElementEditor: React.FC<FormElementEditorProps> = ({
  elements,
  selectedIndex,
  onSelectElement,
  onEditElement,
  onDeleteElement,
  onDuplicateElement
}) => {
  const { language } = useI18n();

  return (
    <div className="space-y-4">
      {elements && elements.length > 0 ? (
        elements.map((element, index) => (
          <SortableFormElement
            key={element.id || index}
            element={element}
            index={index}
            isSelected={selectedIndex === index}
            onSelect={() => onSelectElement(index)}
            onEdit={() => onEditElement(index)}
            onDelete={() => onDeleteElement(index)}
            onDuplicate={() => onDuplicateElement(index)}
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-500 border rounded-lg">
          <p>{language === 'ar' ? 'لا توجد عناصر في هذا النموذج' : 'No elements in this form'}</p>
          <p className="text-sm">
            {language === 'ar' ? 'أضف عناصر من القائمة الجانبية' : 'Add elements from the sidebar'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FormElementEditor;


import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { GripVertical, Copy, Trash, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/lib/i18n';

interface SortableFieldProps {
  field: FormField;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const SortableField: React.FC<SortableFieldProps> = ({
  field,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const { language } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: field.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    // When expanding, automatically trigger edit
    if (!isExpanded) {
      onEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg mb-3 overflow-hidden",
        isDragging ? "shadow-lg" : ""
      )}
    >
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={field.id} className="border-0">
          <div className="flex justify-between items-center p-3">
            <div className="flex gap-2 items-center">
              <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded"
              >
                <GripVertical size={16} className="text-gray-500" />
              </div>
            </div>
            
            <div className={`flex-1 ${language === 'ar' ? 'text-right mr-2' : 'text-left ml-2'}`}>
              <div className="font-medium">{field.label || (language === 'ar' ? "حقل بدون عنوان" : "Untitled field")}</div>
              <div className="text-sm text-gray-500">
                {field.required ? (language === 'ar' ? 'مطلوب' : 'Required') : (language === 'ar' ? 'اختياري' : 'Optional')} | {field.type}
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit}
              className="mx-2"
            >
              <Edit size={16} />
              <span className="sr-only">{language === 'ar' ? 'تعديل' : 'Edit'}</span>
            </Button>
            
            <AccordionTrigger onClick={toggleExpand} className="py-0">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </AccordionTrigger>
          </div>
          
          <AccordionContent className="border-t pt-2">
            <div className="p-3">
              <div className="flex flex-col gap-3 mb-3">
                <h4 className="font-medium text-sm">
                  {language === 'ar' ? 'إعدادات الحقل' : 'Field Settings'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-2 py-1 bg-gray-50 rounded text-sm">
                    <span className="text-gray-500">{language === 'ar' ? 'النوع:' : 'Type:'}</span> {field.type}
                  </div>
                  <div className="px-2 py-1 bg-gray-50 rounded text-sm">
                    <span className="text-gray-500">{language === 'ar' ? 'مطلوب:' : 'Required:'}</span> {field.required ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}
                  </div>
                </div>
              </div>
              
              {field.placeholder && (
                <div className="mb-3 text-sm">
                  <span className="font-medium">{language === 'ar' ? 'النص التوضيحي:' : 'Placeholder:'}</span> {field.placeholder}
                </div>
              )}
              
              {field.helpText && (
                <div className="mb-3 text-sm">
                  <span className="font-medium">{language === 'ar' ? 'النص المساعد:' : 'Help Text:'}</span> {field.helpText}
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onEdit}
                  className="flex items-center gap-1"
                >
                  <Edit size={16} />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onDuplicate}
                  className="flex items-center gap-1"
                >
                  <Copy size={14} />
                  {language === 'ar' ? 'نسخ' : 'Duplicate'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onDelete}
                  className="flex items-center gap-1 hover:text-red-500 hover:border-red-200"
                >
                  <Trash size={14} />
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SortableField;

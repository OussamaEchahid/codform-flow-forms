import React, { useState, useEffect } from 'react';
import { FormField } from '@/lib/form-utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Copy, Trash, GripVertical } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SortableFieldProps {
  field: FormField;
  index?: number;
  onEdit: (index?: number) => void;
  onDelete: (index?: number) => void;
  onDuplicate: (index?: number) => void;
  onFieldUpdate?: (field: FormField) => void;
  onUpdate?: (field: FormField) => void;
  isSelected?: boolean;
  onSelect?: (index: number) => void;
  disabled?: boolean;
}

const SortableField: React.FC<SortableFieldProps> = ({
  field,
  index = 0,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdate,
  onFieldUpdate,
  isSelected = false,
  onSelect,
  disabled = false
}) => {
  const { language } = useI18n();
  const [expanded, setExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const fieldDisplayName = () => {
    switch (field.type) {
      case 'text': return language === 'ar' ? 'حقل نص' : 'Text Input';
      case 'email': return language === 'ar' ? 'بريد إلكتروني' : 'Email';
      case 'phone': return language === 'ar' ? 'رقم هاتف' : 'Phone';
      case 'textarea': return language === 'ar' ? 'نص متعدد الأسطر' : 'Textarea';
      case 'submit': return language === 'ar' ? 'زر إرسال' : 'Submit Button';
      case 'form-title': return language === 'ar' ? 'عنوان النموذج' : 'Form Title';
      case 'image': return language === 'ar' ? 'صورة' : 'Image';
      case 'whatsapp': return language === 'ar' ? 'زر واتساب' : 'WhatsApp Button';
      default: return field.type;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white shadow-sm ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'border-gray-200'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <Accordion type="single" collapsible value={expanded ? "content" : ""} onValueChange={() => toggleExpand()}>
        <AccordionItem value="content" className="border-none">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded"
              >
                <GripVertical size={16} className="text-gray-500" />
              </div>
            </div>
            
            <div className={`flex-1 ${language === 'ar' ? 'text-right mr-2' : 'text-left ml-2'}`}>
              <div className="font-medium">
                {field.label || field.content || (language === 'ar' ? "حقل بدون عنوان" : "Untitled field")}
              </div>
              <div className="text-sm text-gray-500">
                {field.required ? (language === 'ar' ? 'مطلوب' : 'Required') : (language === 'ar' ? 'اختياري' : 'Optional')} | {fieldDisplayName()}
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDuplicate(index)}
                className="flex items-center gap-1 hover:text-blue-600 hover:border-blue-200 h-8 px-2"
              >
                <Copy size={12} />
              </Button>
              
              {field.type !== 'submit' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDelete(index)}
                  className="flex items-center gap-1 hover:text-red-500 hover:border-red-200 h-8 px-2"
                >
                  <Trash size={12} />
                </Button>
              )}
              
              <div className="ml-3">
                <AccordionTrigger onClick={toggleExpand} className="py-0">
                </AccordionTrigger>
              </div>
            </div>
          </div>
          
          <AccordionContent>
            <div className="p-3 border-t border-gray-100">
              <h2 className="text-lg font-semibold mb-4">
                {field.type === 'image'
                  ? (language === 'ar' ? 'إعدادات الصورة' : 'Image Settings')
                  : field.type === 'form-title' 
                  ? (language === 'ar' ? 'إعدادات العنوان' : 'Title Configuration')
                  : (language === 'ar' ? 'إعدادات الحقل' : 'Field Settings')
                }
              </h2>
              
              {/* For Image fields, show message to use Edit button */}
              {field.type === 'image' ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    {language === 'ar' ? 'انقر على زر "تحرير" بجانب اسم الحقل أعلاه لفتح إعدادات الصورة' : 'Click the "Edit" button next to the field name above to open image settings'}
                  </p>
                  <Button onClick={() => onEdit(index)} variant="default">
                    {language === 'ar' ? 'تحرير إعدادات الصورة' : 'Edit Image Settings'}
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-sm text-gray-600 mb-4">
                    {language === 'ar' ? 'انقر على زر "تحرير" لفتح إعدادات هذا الحقل' : 'Click "Edit" button to open field settings'}
                  </p>
                  <Button onClick={() => onEdit(index)} variant="default">
                    {language === 'ar' ? 'تحرير الحقل' : 'Edit Field'}
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SortableField;
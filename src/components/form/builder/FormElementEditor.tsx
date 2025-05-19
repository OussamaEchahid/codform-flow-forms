
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash, GripVertical } from 'lucide-react';

interface FormElementEditorProps {
  elements: FormField[];
  selectedIndex: number | null;
  onSelectElement: (index: number) => void;
  onEditElement: (index: number) => void;
  onDeleteElement: (index: number) => void;
  onDuplicateElement: (index: number) => void;
  onReorderElements: (reorderedElements: FormField[]) => void;
}

// Helper function to perform deep clone of field objects to prevent style loss during drag and drop
const deepCloneField = (field: FormField): FormField => {
  // Use JSON parse/stringify for deep cloning to avoid reference issues
  return JSON.parse(JSON.stringify(field));
};

// SortableElement component to handle individual items
const SortableElement = ({ 
  field, 
  index, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: { 
  field: FormField; 
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const { language } = useI18n();
  const fieldId = field.id; // Store field ID to avoid reference issues
  
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging
  } = useSortable({ 
    id: fieldId,
    data: {
      // Deep clone the field data to preserve all properties during drag and drop
      field: deepCloneField(field)
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  // Generate element name based on type
  const getElementName = (field: FormField) => {
    switch(field.type) {
      case 'form-title':
        return language === 'ar' ? 'عنوان النموذج' : 'Form Title';
      case 'text':
        return language === 'ar' ? 'حقل نص' : 'Text Field';
      case 'email':
        return language === 'ar' ? 'بريد إلكتروني' : 'Email Field';
      case 'phone':
        return language === 'ar' ? 'رقم هاتف' : 'Phone Field';
      case 'textarea':
        return language === 'ar' ? 'نص متعدد الأسطر' : 'Text Area';
      case 'select':
        return language === 'ar' ? 'قائمة منسدلة' : 'Dropdown';
      case 'checkbox':
        return language === 'ar' ? 'خانة اختيار' : 'Checkbox';
      case 'radio':
        return language === 'ar' ? 'زر راديو' : 'Radio Button';
      case 'submit':
        return language === 'ar' ? 'زر إرسال' : 'Submit Button';
      case 'text/html':
        return language === 'ar' ? 'نص/HTML' : 'Text/HTML';
      case 'cart-items':
        return language === 'ar' ? 'عناصر السلة' : 'Cart Items';
      case 'cart-summary':
        return language === 'ar' ? 'ملخص السلة' : 'Cart Summary';
      case 'whatsapp':
        return language === 'ar' ? 'واتساب' : 'WhatsApp';
      default:
        return field.type;
    }
  };

  // Preserve original background color for form-title elements
  const getBackgroundColor = () => {
    if (field.type === 'form-title' && field.style?.backgroundColor) {
      return field.style.backgroundColor;
    }
    return isSelected ? 'rgba(155, 135, 245, 0.1)' : 'transparent';
  };

  return (
    <div 
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: getBackgroundColor(),
        border: isSelected ? '1px solid #9b87f5' : '1px solid #e5e7eb',
      }} 
      className={`rounded-md p-3 mb-2 cursor-pointer hover:bg-gray-50 transition-colors group`}
      onClick={onSelect}
      data-field-id={fieldId}
      data-field-type={field.type}
      data-field-index={index}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab hover:bg-gray-100 p-1 rounded"
          >
            <GripVertical size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{getElementName(field)}</span>
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {field.label || field.placeholder || ''}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            <Copy size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash size={16} />
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
  onDuplicateElement,
}) => {
  const { language } = useI18n();
  
  if (elements.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-gray-500">
          {language === 'ar' ? 'لا توجد عناصر لعرضها' : 'No elements to display'}
        </p>
        <p className="text-sm text-gray-500">
          {language === 'ar' ? 'أضف عناصر من القائمة الجانبية' : 'Add elements from the sidebar'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {elements.map((element, index) => (
        <SortableElement
          key={element.id}
          field={element}
          index={index}
          isSelected={selectedIndex === index}
          onSelect={() => onSelectElement(index)}
          onEdit={() => onEditElement(index)}
          onDelete={() => onDeleteElement(index)}
          onDuplicate={() => onDuplicateElement(index)}
        />
      ))}
    </div>
  );
};

export default FormElementEditor;


import React from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField } from '@/lib/form-utils';
import SortableField from '@/components/form/SortableField';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import FieldEditor from '@/components/form/FieldEditor';

interface FormElementEditorProps {
  elements: FormField[];
  selectedIndex: number | null;
  onSelectElement: (index: number) => void;
  onEditElement: (index: number) => void;
  onDeleteElement: (index: number) => void;
  onDuplicateElement: (index: number) => void;
  onReorderElements?: (newOrder: FormField[]) => void;
  onUpdateElement?: (index: number, updatedElement: FormField) => void;
}

const FormElementEditor: React.FC<FormElementEditorProps> = ({
  elements,
  selectedIndex,
  onSelectElement,
  onEditElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements,
  onUpdateElement
}) => {
  const { language } = useI18n();
  const [isFieldEditorOpen, setIsFieldEditorOpen] = React.useState(false);
  const [editingField, setEditingField] = React.useState<{ field: FormField, index: number } | null>(null);
  
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = elements.findIndex(item => item.id === active.id);
    const newIndex = elements.findIndex(item => item.id === over.id);
    
    if (onReorderElements) {
      const newElements = arrayMove(elements, oldIndex, newIndex);
      onReorderElements(newElements);
      toast.success(language === 'ar' ? "تم إعادة ترتيب العناصر بنجاح" : "Elements reordered successfully");
    }
  };
  
  // Handle element updates when they are edited
  const handleElementUpdate = (index: number) => {
    // Only open the editor if we have a valid field type to edit
    const field = elements[index];
    const supportedTypes = ['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio', 'cart-items', 'cart-summary', 'submit', 'whatsapp', 'image', 'form-title', 'title', 'text/html'];
    
    if (supportedTypes.includes(field.type)) {
      setEditingField({ field, index });
      setIsFieldEditorOpen(true);
    } else {
      // For unsupported types, just call onEditElement directly
      onEditElement(index);
      toast.info(language === 'ar' ? "هذا النوع من الحقول لا يدعم التحرير المباشر" : "This field type doesn't support direct editing");
    }
  };
  
  // Save field after editing
  const handleSaveField = (updatedField: FormField) => {
    if (editingField && onUpdateElement) {
      // Normalize icon values: convert empty strings to 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Ensure proper icon settings are preserved
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set showIcon to true by default unless explicitly set to false
        updatedField.style.showIcon = updatedField.style.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      onUpdateElement(editingField.index, updatedField);
      toast.success(language === 'ar' ? "تم تحديث العنصر بنجاح" : "Element updated successfully");
    } 
    
    closeEditor();
  };
  
  // Close field editor
  const closeEditor = () => {
    setIsFieldEditorOpen(false);
    setEditingField(null);
  };
  
  // خاصية لمعرفة ما إذا كان هناك عناصر للعرض
  const hasElements = elements.length > 0;

  return (
    <div className="space-y-4">
      {!hasElements && (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">
            {language === 'ar' 
              ? 'لا توجد عناصر في النموذج. أضف بعض العناصر من القائمة الجانبية.' 
              : 'No elements in the form. Add some elements from the sidebar.'}
          </p>
        </div>
      )}
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={elements.map(element => element.id)} strategy={verticalListSortingStrategy}>
          {elements.map((element, index) => (
            <SortableField 
              key={element.id} 
              field={element} 
              onEdit={() => handleElementUpdate(index)} 
              onDuplicate={() => onDuplicateElement(index)} 
              onDelete={() => onDeleteElement(index)} 
            />
          ))}
        </SortableContext>
      </DndContext>
      
      {/* Field Editor Modal */}
      {isFieldEditorOpen && editingField && (
        <FieldEditor
          field={editingField.field}
          onSave={handleSaveField}
          onClose={closeEditor}
        />
      )}
    </div>
  );
};

export default FormElementEditor;

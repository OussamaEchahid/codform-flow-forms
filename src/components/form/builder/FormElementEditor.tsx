
import React from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField } from '@/lib/form-utils';
import SortableField from '@/components/form/SortableField';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

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
      
      // تسجيل التغييرات لأغراض التشخيص
      console.log('Elements reordered:', { 
        oldIndex, 
        newIndex, 
        movedElementId: elements[oldIndex].id,
        elementsCount: elements.length 
      });
    }
  };
  
  // Handle element updates when they are edited directly from the SortableField
  const handleElementUpdate = (index: number, field: FormField) => {
    // تسجيل التحديث لأغراض التشخيص
    console.log(`Updating element at index ${index}:`, { 
      id: field.id, 
      type: field.type,
      label: field.label,
      hasStyle: !!field.style,
      styleProps: Object.keys(field.style || {})
    });
    
    // تطبيق معالجة خاصة على العناوين - تأكد من تعيين خصائص الخلفية والنص بشكل صحيح
    if (field.type === 'form-title' || field.type === 'title') {
      // ضمان وجود كائن النمط
      if (!field.style) field.style = {};
      
      // تسجيل خصائص العنوان قبل التحديث
      console.log('Title field before update:', { 
        color: field.style.color,
        backgroundColor: field.style.backgroundColor,
        fontSize: field.style.fontSize
      });
    }
    
    // Normalize icon value (convert empty string to 'none')
    if (field.icon === '') {
      field.icon = 'none';
    }
    
    // Ensure proper icon settings
    if (field.icon && field.icon !== 'none') {
      if (!field.style) {
        field.style = {};
      }
      
      // Set showIcon based on existing value or default to true if icon exists
      field.style.showIcon = field.style.showIcon !== undefined 
        ? field.style.showIcon 
        : true;
    }
    
    // تسجيل معلومات عن الأيقونة
    if (field.icon && field.icon !== 'none') {
      console.log(`Field ${field.id} has icon: ${field.icon}, showIcon: ${field.style?.showIcon !== false}`);
    }
    
    // Notify parent component about the update
    if (onUpdateElement) {
      onUpdateElement(index, field);
    }
    
    // Force refresh the preview
    onSelectElement(index);
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
              key={`sortable-${element.id}-${index}`}
              field={element} 
              onEdit={() => onEditElement(index)}
              onDuplicate={() => onDuplicateElement(index)} 
              onDelete={() => onDeleteElement(index)}
              onFieldUpdate={(updatedField) => handleElementUpdate(index, updatedField)}
              isSelected={selectedIndex === index}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default FormElementEditor;

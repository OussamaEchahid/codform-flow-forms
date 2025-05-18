
import React, { useEffect, useState } from 'react';
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
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use sensitive drag detection (lower activation distance)
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5 // Make it more sensitive (default is 8)
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // Force refresh drag and drop context when elements change
  useEffect(() => {
    // This ensures DndContext is re-initialized when element list changes
    console.log("FormElementEditor: Elements updated, refreshing DndContext");
    setRefreshKey(prev => prev + 1);
  }, [elements.length]);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    console.log("Drag ended. Moving from", active.id, "to", over.id);
    
    const oldIndex = elements.findIndex(item => item.id === active.id);
    const newIndex = elements.findIndex(item => item.id === over.id);
    
    if (onReorderElements && oldIndex !== -1 && newIndex !== -1) {
      const newElements = arrayMove(elements, oldIndex, newIndex);
      onReorderElements(newElements);
      toast.success(language === 'ar' ? "تم إعادة ترتيب العناصر بنجاح" : "Elements reordered successfully");
    }
  };
  
  // Handle element updates when they are edited directly from the SortableField
  const handleElementUpdate = (index: number, field: FormField) => {
    try {
      console.log("Updating element", field.id, "at index", index);
      
      // Make a deep copy of the field to avoid reference issues
      const updatedField = JSON.parse(JSON.stringify(field));
      
      // Normalize icon value (convert empty string to 'none')
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Ensure proper icon settings
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set showIcon based on existing value or default to true if icon exists
        updatedField.style.showIcon = updatedField.style.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // Handle edit-form-title specific styling
      if (updatedField.type === 'form-title' || updatedField.type === 'edit-form-title') {
        // Make sure style object exists
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Ensure we have textAlign set
        if (!updatedField.style.textAlign) {
          updatedField.style.textAlign = 'center';
        }
        
        // Default show description to true if not explicitly set
        if (updatedField.style.showDescription === undefined) {
          updatedField.style.showDescription = true;
        }
        
        console.log("Updated form title field:", JSON.stringify(updatedField.style, null, 2));
      }
      
      // Notify parent component about the update
      if (onUpdateElement) {
        onUpdateElement(index, updatedField);
        console.log(`Element ${updatedField.id} at index ${index} updated with:`, updatedField);
      }
      
      // Force refresh the preview by selecting the element again
      onSelectElement(index);
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error(language === 'ar' ? "حدث خطأ أثناء تحديث الحقل" : "Error updating field");
    }
  };
  
  // Check if there are any elements to display
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
      
      <DndContext 
        key={`dnd-context-${refreshKey}`}
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={elements.map(element => element.id)} strategy={verticalListSortingStrategy}>
          {elements.map((element, index) => (
            <SortableField 
              key={`${element.id}-${refreshKey}`}
              field={element} 
              onEdit={() => onEditElement(index)}
              onDuplicate={() => onDuplicateElement(index)} 
              onDelete={() => onDeleteElement(index)}
              onFieldUpdate={(updatedField) => handleElementUpdate(index, updatedField)}
              selected={selectedIndex === index}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default FormElementEditor;

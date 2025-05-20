
import React, { useCallback } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField } from '@/lib/form-utils';
import SortableField from '@/components/form/SortableField';
import FormTitleEditor from '@/components/form/builder/FormTitleEditor';
import { useI18n } from '@/lib/i18n';

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

// Deep copy function that preserves all field properties and IDs
const deepCopyElement = (element: FormField): FormField => {
  if (!element) return element;
  
  // Create a complete copy of all properties
  const copy = { ...element };
  
  // Preserve the ID exactly as it was
  copy.id = element.id;
  
  // Deep copy the style object
  if (element.style) {
    copy.style = { ...element.style };
  }
  
  // Deep clone options array if it exists
  if (element.options && Array.isArray(element.options)) {
    copy.options = element.options.map(option => ({ ...option }));
  }
  
  return copy;
};

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
  
  // Configure sensors for drag and drop
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  
  // Handle drag end events
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = elements.findIndex(item => item.id === active.id);
    const newIndex = elements.findIndex(item => item.id === over.id);
    
    if (onReorderElements && oldIndex !== -1 && newIndex !== -1) {
      // Create exact deep copies of each element to prevent mutations
      const newElementsArray = elements.map(element => deepCopyElement(element));
      
      // Use arrayMove to reorder elements
      const reorderedElements = arrayMove(newElementsArray, oldIndex, newIndex);
      
      // Trigger the parent's reorder callback
      onReorderElements(reorderedElements);
    }
  }, [elements, onReorderElements]);
  
  // Handle element updates with improved field preservation
  const handleElementUpdate = useCallback((index: number, field: FormField) => {
    if (index < 0 || index >= elements.length) {
      console.error(`Invalid element index: ${index}`);
      return;
    }
    
    // Create deep copy to avoid modifying the original element
    const updatedField = deepCopyElement(field);
    
    // Preserve the original ID
    updatedField.id = elements[index].id;
    
    // Special handling for form-title field to preserve styling
    if (updatedField.type === 'form-title') {
      if (!updatedField.style) {
        updatedField.style = {};
      }
      
      // Ensure title field styles have defaults
      updatedField.style.backgroundColor = updatedField.style.backgroundColor || '#9b87f5';
      updatedField.style.color = updatedField.style.color || '#ffffff';
      updatedField.style.descriptionColor = updatedField.style.descriptionColor || 'rgba(255, 255, 255, 0.9)';
      updatedField.style.fontSize = updatedField.style.fontSize || '24px';
      updatedField.style.descriptionFontSize = updatedField.style.descriptionFontSize || '14px';
      updatedField.style.fontWeight = updatedField.style.fontWeight || 'bold';
    }
    
    // Special handling for submit button
    if (updatedField.type === 'submit') {
      if (!updatedField.style) {
        updatedField.style = {};
      }
      
      // Ensure submit button styles are preserved
      updatedField.style.backgroundColor = updatedField.style.backgroundColor || '#9b87f5';
      updatedField.style.color = updatedField.style.color || '#ffffff';
      
      // Ensure icon settings are properly handled
      if (updatedField.icon && updatedField.icon !== 'none') {
        updatedField.style.showIcon = updatedField.style.showIcon !== undefined ? updatedField.style.showIcon : true;
        updatedField.style.iconPosition = updatedField.style.iconPosition || (language === 'ar' ? 'right' : 'left');
      }
    }
    
    // Notify parent component about the update
    if (onUpdateElement) {
      onUpdateElement(index, updatedField);
    }
  }, [elements, onUpdateElement, language]);
  
  return (
    <div className="space-y-4">
      {elements.length === 0 && (
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
            element.type === 'form-title' ? (
              <FormTitleEditor
                key={element.id}
                field={element}
                onUpdateField={(updatedField) => handleElementUpdate(index, updatedField)}
                isDraggable={true}
              />
            ) : (
              <SortableField 
                key={element.id} 
                field={element} 
                onEdit={() => onEditElement(index)}
                onDuplicate={() => onDuplicateElement(index)} 
                onDelete={() => onDeleteElement(index)}
                onFieldUpdate={(updatedField) => handleElementUpdate(index, updatedField)}
                disabled={false}
              />
            )
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default React.memo(FormElementEditor);

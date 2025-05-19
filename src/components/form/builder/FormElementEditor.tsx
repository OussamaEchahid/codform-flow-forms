
import React, { useCallback } from 'react';
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

// Improved deep copy function to ensure all nested properties are preserved exactly
const deepCopyElement = (element: FormField): FormField => {
  if (!element) return element;
  
  // Create a complete copy of all properties
  const copy = { ...element };
  
  // Preserve the ID exactly as it was - critical for drag and drop stability
  copy.id = element.id;
  
  // Deep copy the style object to prevent reference issues
  if (element.style) {
    copy.style = { ...element.style };
    
    // Special handling for form-title and title fields
    if (element.type === 'form-title' || element.type === 'title') {
      // Ensure critical style properties are preserved exactly
      copy.style.backgroundColor = element.style.backgroundColor || '#9b87f5';
      copy.style.color = element.style.color || '#ffffff';
      copy.style.textAlign = element.style.textAlign;
      copy.style.fontSize = element.style.fontSize;
      copy.style.descriptionColor = element.style.descriptionColor;
      copy.style.descriptionFontSize = element.style.descriptionFontSize;
    }
  }
  
  // Special handling for options array (used in select, radio, checkbox)
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
  
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = elements.findIndex(item => item.id === active.id);
    const newIndex = elements.findIndex(item => item.id === over.id);
    
    if (onReorderElements && oldIndex !== -1 && newIndex !== -1) {
      // Create exact deep copies of each element to preserve all properties
      const newElementsArray = elements.map(element => deepCopyElement(element));
      
      // Use arrayMove to reorder elements but maintain their exact properties
      const reorderedElements = arrayMove(newElementsArray, oldIndex, newIndex);
      
      // Special handling for form-title fields to ensure their properties are preserved
      reorderedElements.forEach((element, idx) => {
        // Find the original element by ID to preserve critical properties
        const originalElement = elements.find(e => e.id === element.id);
        
        if (originalElement && (originalElement.type === 'form-title' || originalElement.type === 'title')) {
          // Ensure all style properties are preserved exactly
          if (!element.style) element.style = {};
          
          // Copy all style properties from the original element
          element.style = { ...originalElement.style };
          
          // Ensure these critical properties exist
          element.style.backgroundColor = originalElement.style?.backgroundColor || '#9b87f5';
          element.style.color = originalElement.style?.color || '#ffffff';
          
          // Preserve the label and helpText exactly
          element.label = originalElement.label;
          element.helpText = originalElement.helpText;
        }
      });
      
      onReorderElements(reorderedElements);
    }
  }, [elements, onReorderElements]);
  
  // Handle element updates when they are edited directly from the SortableField
  const handleElementUpdate = useCallback((index: number, field: FormField) => {
    if (index < 0 || index >= elements.length) {
      console.error(`Invalid element index: ${index}`);
      return;
    }
    
    // Create deep copy to avoid modifying the original element
    const updatedField = deepCopyElement(field);
    
    // Preserve the original ID to ensure consistent references
    updatedField.id = elements[index].id;
    
    // Special handling for form-title and title fields
    if (updatedField.type === 'form-title' || updatedField.type === 'title') {
      if (!updatedField.style) {
        updatedField.style = {};
      }
      
      // Ensure text alignment is set
      if (!updatedField.style.textAlign) {
        updatedField.style.textAlign = language === 'ar' ? 'right' : 'left';
      }
      
      // Ensure color and background color are set
      updatedField.style.color = updatedField.style.color || '#ffffff';
      updatedField.style.backgroundColor = updatedField.style.backgroundColor || '#9b87f5';
    }

    // Special handling for submit button
    if (updatedField.type === 'submit') {
      if (!updatedField.style) {
        updatedField.style = {};
      }
      
      // Make sure submit button style properties are preserved
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
  
  // Property to determine if there are elements to display
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
              onEdit={() => onEditElement(index)}
              onDuplicate={() => onDuplicateElement(index)} 
              onDelete={() => onDeleteElement(index)}
              onFieldUpdate={(updatedField) => handleElementUpdate(index, updatedField)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

// Wrap the component with React.memo to prevent unnecessary re-renders
export default React.memo(FormElementEditor);

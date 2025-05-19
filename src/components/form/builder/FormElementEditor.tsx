
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
  
  // Deep copy function for preserving all properties including nested objects
  const deepCopyElement = useCallback((element: FormField): FormField => {
    if (!element) return element;
    // Use JSON parse/stringify for deep copying, but ensure we handle any potential circular references
    try {
      return JSON.parse(JSON.stringify(element));
    } catch (error) {
      console.error("Error creating deep copy:", error);
      // Fallback to a simple copy if JSON serialization fails
      return { ...element, style: element.style ? { ...element.style } : undefined };
    }
  }, []);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = elements.findIndex(item => item.id === active.id);
    const newIndex = elements.findIndex(item => item.id === over.id);
    
    if (onReorderElements && oldIndex !== -1 && newIndex !== -1) {
      // Create exact copies of each element to preserve all properties
      const newElementsArray = elements.map(element => deepCopyElement(element));
      
      // Use arrayMove to reorder elements but maintain their exact properties
      const reorderedElements = arrayMove(newElementsArray, oldIndex, newIndex);
      
      console.log(`Reordering element from index ${oldIndex} to ${newIndex}`);
      console.log(`Element being moved: ${elements[oldIndex].type} (ID: ${elements[oldIndex].id})`);
      
      // Verify that all element IDs are preserved exactly as they were
      reorderedElements.forEach((element, idx) => {
        const originalElement = elements.find(e => e.id === element.id);
        if (!originalElement) {
          console.warn(`Unable to find original element for ID ${element.id}`);
        }
      });
      
      onReorderElements(reorderedElements);
      toast.success(language === 'ar' ? "تم إعادة ترتيب العناصر بنجاح" : "Elements reordered successfully");
    }
  }, [elements, onReorderElements, deepCopyElement, language]);
  
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
    
    // Log the update for debugging
    console.log(`Updating element at index ${index}:`, updatedField);
    
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
      
      // Convert rem units to px for compatibility
      if (updatedField.style.fontSize) {
        if (updatedField.style.fontSize.endsWith('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize.replace('rem', ''));
          updatedField.style.fontSize = `${Math.round(remValue * 16)}px`;
        } else if (!updatedField.style.fontSize.endsWith('px')) {
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      } else {
        updatedField.style.fontSize = updatedField.type === 'form-title' ? '24px' : '20px';
      }
      
      if (updatedField.style.descriptionFontSize) {
        if (updatedField.style.descriptionFontSize.endsWith('rem')) {
          const remValue = parseFloat(updatedField.style.descriptionFontSize.replace('rem', ''));
          updatedField.style.descriptionFontSize = `${Math.round(remValue * 16)}px`;
        } else if (!updatedField.style.descriptionFontSize.endsWith('px')) {
          updatedField.style.descriptionFontSize = `${updatedField.style.descriptionFontSize}px`;
        }
      } else {
        updatedField.style.descriptionFontSize = '14px';
      }
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
  }, [elements, onUpdateElement, deepCopyElement, language]);
  
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


import React, { useCallback } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField } from '@/lib/form-utils';
import SortableField from '@/components/form/SortableField';
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
  formTitle: string;
  formDescription: string;
  formStyle: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
    // Add new style properties
    borderColor?: string;
    borderWidth?: string;
    backgroundColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    formGap?: string;
    formDirection?: 'ltr' | 'rtl';
    floatingLabels?: boolean;
  };
  onTitleUpdate: (title: string, description: string, style: any) => void;
  onStyleChange?: (key: string, value: string) => void;
}

// Improved deep copy function with proper TypeScript support
const deepCopyElement = (element: FormField): FormField => {
  if (!element) return element;
  
  // Create a complete copy of all properties
  const copy = JSON.parse(JSON.stringify(element));
  
  // Ensure the ID is properly preserved
  copy.id = element.id;
  
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
  
  // Handle drag end events for field reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    // Filter reorderable elements
    const reorderableElements = elements;
    
    const oldIndex = reorderableElements.findIndex(item => item.id === active.id);
    const newIndex = reorderableElements.findIndex(item => item.id === over.id);
    
    if (onReorderElements && oldIndex !== -1 && newIndex !== -1) {
      // Create deep copies using JSON serialization to prevent mutations
      const newElementsArray = reorderableElements.map(element => deepCopyElement(element));
      
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
    
    // Ensure all fields have an id
    if (!updatedField.id) {
      console.error('Field is missing ID property:', updatedField);
      return;
    }
    
    // Notify parent component about the update
    if (onUpdateElement) {
      onUpdateElement(index, updatedField);
    }
  }, [elements, onUpdateElement]);
  
  return (
    <div className="space-y-4">
      {/* Form Fields */}
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
            <SortableField 
              key={element.id} 
              field={element} 
              onEdit={() => onEditElement(index)}
              onDuplicate={() => onDuplicateElement(index)} 
              onDelete={() => onDeleteElement(index)}
              onFieldUpdate={(updatedField) => handleElementUpdate(index, updatedField)}
              disabled={false}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default React.memo(FormElementEditor);

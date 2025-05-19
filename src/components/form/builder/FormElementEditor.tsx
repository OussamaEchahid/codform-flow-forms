
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
  
  // Create a deep copy function to ensure all properties are preserved
  const deepCopyElement = (element: FormField): FormField => {
    // Use JSON parse/stringify for deep copying to preserve all nested properties
    return JSON.parse(JSON.stringify(element));
  };
  
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
      // Create deep copies of elements to prevent reference issues
      const newElementsArray = elements.map(element => deepCopyElement(element));
      const reorderedElements = arrayMove(newElementsArray, oldIndex, newIndex);
      
      // Process each element to ensure proper formatting is preserved
      const processedElements = reorderedElements.map(element => {
        // Handle title fields specifically to preserve all formatting
        if (element.type === 'form-title' || element.type === 'title') {
          // Ensure style object exists
          if (!element.style) {
            element.style = {};
          }
          
          // Always preserve these properties exactly as they were
          // No default values should overwrite user customizations
          
          // Ensure fontSize is properly formatted (px format)
          if (element.style.fontSize) {
            if (element.style.fontSize.endsWith('rem')) {
              const remValue = parseFloat(element.style.fontSize.replace('rem', ''));
              element.style.fontSize = `${Math.round(remValue * 16)}px`;
            } else if (!element.style.fontSize.endsWith('px')) {
              element.style.fontSize = `${element.style.fontSize}px`;
            }
          } else {
            element.style.fontSize = element.type === 'form-title' ? '24px' : '20px';
          }
          
          // Ensure all other title styling properties are preserved
          element.style.color = element.style.color || '#ffffff';
          element.style.backgroundColor = element.style.backgroundColor || '#9b87f5';
          element.style.textAlign = element.style.textAlign || (language === 'ar' ? 'right' : 'left');
          
          // Handle description font size
          if (element.style.descriptionFontSize) {
            if (element.style.descriptionFontSize.endsWith('rem')) {
              const remValue = parseFloat(element.style.descriptionFontSize.replace('rem', ''));
              element.style.descriptionFontSize = `${Math.round(remValue * 16)}px`;
            } else if (!element.style.descriptionFontSize.endsWith('px')) {
              element.style.descriptionFontSize = `${element.style.descriptionFontSize}px`;
            }
          } else {
            element.style.descriptionFontSize = '14px';
          }
          
          // Description color
          element.style.descriptionColor = element.style.descriptionColor || 'rgba(255, 255, 255, 0.9)';
        }
        
        // Handle submit button fields
        if (element.type === 'submit') {
          if (!element.style) {
            element.style = {};
          }
          
          // Preserve submit button styling
          element.style.backgroundColor = element.style.backgroundColor || '#9b87f5';
          element.style.color = element.style.color || '#ffffff';
          element.style.fontSize = element.style.fontSize || '18px';
          element.style.fontWeight = element.style.fontWeight || '600';
          element.style.borderRadius = element.style.borderRadius || '8px';
          element.style.borderColor = element.style.borderColor || 'transparent';
          
          // Preserve icon settings
          if (element.icon && element.icon !== 'none') {
            element.style.showIcon = element.style.showIcon !== undefined 
              ? element.style.showIcon 
              : true;
            element.style.iconPosition = element.style.iconPosition || (language === 'ar' ? 'right' : 'left');
          }
          
          // Preserve animation settings
          if (element.style.animation) {
            element.style.animationType = element.style.animationType || 'pulse';
          }
        }
        
        return element;
      });
      
      onReorderElements(processedElements);
      toast.success(language === 'ar' ? "تم إعادة ترتيب العناصر بنجاح" : "Elements reordered successfully");
    }
  };
  
  // Handle element updates when they are edited directly from the SortableField
  const handleElementUpdate = (index: number, field: FormField) => {
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

    // Special handling for form-title and title fields
    if (field.type === 'form-title' || field.type === 'title') {
      if (!field.style) {
        field.style = {};
      }
      
      // Ensure text alignment is set
      if (!field.style.textAlign) {
        field.style.textAlign = language === 'ar' ? 'right' : 'left';
      }
      
      // Ensure color and background color are set
      field.style.color = field.style.color || '#ffffff';
      field.style.backgroundColor = field.style.backgroundColor || '#9b87f5';
      
      // تحويل وحدات rem إلى px لضمان التوافق
      if (field.style.fontSize) {
        if (field.style.fontSize.endsWith('rem')) {
          const remValue = parseFloat(field.style.fontSize.replace('rem', ''));
          field.style.fontSize = `${Math.round(remValue * 16)}px`;
        } else if (!field.style.fontSize.endsWith('px')) {
          field.style.fontSize = `${field.style.fontSize}px`;
        }
      } else {
        field.style.fontSize = field.type === 'form-title' ? '24px' : '20px';
      }
      
      if (field.style.descriptionFontSize) {
        if (field.style.descriptionFontSize.endsWith('rem')) {
          const remValue = parseFloat(field.style.descriptionFontSize.replace('rem', ''));
          field.style.descriptionFontSize = `${Math.round(remValue * 16)}px`;
        } else if (!field.style.descriptionFontSize.endsWith('px')) {
          field.style.descriptionFontSize = `${field.style.descriptionFontSize}px`;
        }
      } else {
        field.style.descriptionFontSize = '14px';
      }
    }

    // Special handling for submit button
    if (field.type === 'submit') {
      if (!field.style) {
        field.style = {};
      }
      
      // Make sure submit button style properties are preserved
      field.style.backgroundColor = field.style.backgroundColor || '#9b87f5';
      field.style.color = field.style.color || '#ffffff';
      
      // Ensure icon settings are properly handled
      if (field.icon && field.icon !== 'none') {
        field.style.showIcon = field.style.showIcon !== undefined ? field.style.showIcon : true;
        field.style.iconPosition = field.style.iconPosition || (language === 'ar' ? 'right' : 'left');
      }
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

export default FormElementEditor;


import React, { useCallback, useState, useRef } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField } from '@/lib/form-utils';
import SortableField from '@/components/form/SortableField';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import FormTitleEditor from '../editor/FormTitleEditor';

// Constant ID for form title to match across components
const FORM_TITLE_ID = 'form-title-static';

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
  };
  onTitleUpdate: (title: string, description: string, style: any) => void;
}

// Improved deep copy function with proper TypeScript support
const deepCopyElement = (element: FormField): FormField => {
  if (!element) return element;
  
  // Create a complete copy of all properties
  const copy: FormField = { ...element };
  
  // Preserve the ID exactly as it was
  copy.id = element.id;
  
  // Deep copy the style object - ensure ALL properties are preserved
  if (element.style) {
    copy.style = { ...element.style };
    
    // Make sure boolean properties are properly preserved
    if (typeof element.style.showTitle === 'boolean') {
      copy.style.showTitle = element.style.showTitle;
    }
    
    if (typeof element.style.showDescription === 'boolean') {
      copy.style.showDescription = element.style.showDescription;
    }
  }
  
  // Deep clone options array if it exists
  if (element.options && Array.isArray(element.options)) {
    copy.options = element.options.map(option => ({ ...option }));
  }
  
  // Deep clone validation rules if they exist
  if (element.validationRules) {
    copy.validationRules = { ...element.validationRules };
  }
  
  // Deep clone any other nested objects that might exist
  if (element.settings) {
    copy.settings = { ...element.settings };
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
  onUpdateElement,
  formTitle,
  formDescription,
  formStyle,
  onTitleUpdate
}) => {
  const { language } = useI18n();
  const [isTitleEditorOpen, setIsTitleEditorOpen] = useState(false);
  const editorInstanceId = useRef(`editor-${Math.random().toString(36).substr(2, 9)}`);
  
  // Find the form title field with its exact ID to ensure consistency
  const titleField = elements.find(el => el.type === 'form-title' && (el.id === FORM_TITLE_ID));
  
  // Get the form title style from existing form-title field or default
  const titleFieldStyle = titleField?.style || {
    backgroundColor: formStyle.primaryColor,
    color: '#ffffff',
    textAlign: language === 'ar' ? 'right' : 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    descriptionColor: 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize: '14px',
    borderRadius: formStyle.borderRadius || '8px',
    paddingY: '16px',
    showTitle: true,
    showDescription: true
  };
  
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
    
    // Filter out form-title fields before handling reordering
    const reorderableElements = elements.filter(element => element.type !== 'form-title' || element.id !== FORM_TITLE_ID);
    
    const oldIndex = reorderableElements.findIndex(item => item.id === active.id);
    const newIndex = reorderableElements.findIndex(item => item.id === over.id);
    
    if (onReorderElements && oldIndex !== -1 && newIndex !== -1) {
      // Create exact deep copies of each element to prevent mutations
      const newElementsArray = reorderableElements.map(element => deepCopyElement(element));
      
      // Use arrayMove to reorder elements
      const reorderedElements = arrayMove(newElementsArray, oldIndex, newIndex);
      
      // If we have a title field, add it back at the beginning
      if (titleField) {
        reorderedElements.unshift(deepCopyElement(titleField));
      }
      
      // Trigger the parent's reorder callback
      onReorderElements(reorderedElements);
    }
  }, [elements, onReorderElements, titleField]);
  
  // Handle element updates with improved field preservation
  const handleElementUpdate = useCallback((index: number, field: FormField) => {
    if (index < 0 || index >= elements.length) {
      console.error(`Invalid element index: ${index}`);
      return;
    }
    
    // Skip title field in direct element updates - it has its own flow
    if (elements[index].type === 'form-title' && elements[index].id === FORM_TITLE_ID) {
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
  
  const handleTitleEditorOpen = () => {
    setIsTitleEditorOpen(true);
  };
  
  const handleTitleEditorClose = () => {
    setIsTitleEditorOpen(false);
  };
  
  const handleTitleSave = (title: string, description: string, style: any) => {
    console.log("Saving title with style:", style);
    
    // Use onTitleUpdate to handle title updates - this ensures consistency
    if (onTitleUpdate) {
      // Create a complete style object with all required properties
      const completeStyle = {
        ...titleFieldStyle,  // Start with existing style to preserve any properties
        ...style,            // Override with new style properties
        // Ensure critical properties are always present
        backgroundColor: style.backgroundColor || titleFieldStyle.backgroundColor || formStyle.primaryColor,
        borderRadius: style.borderRadius || titleFieldStyle.borderRadius || formStyle.borderRadius,
        paddingY: style.paddingY || titleFieldStyle.paddingY || '16px',
        // Ensure boolean values are properly preserved
        showTitle: typeof style.showTitle === 'boolean' ? style.showTitle : 
                   typeof titleFieldStyle.showTitle === 'boolean' ? titleFieldStyle.showTitle : true,
        showDescription: typeof style.showDescription === 'boolean' ? style.showDescription : 
                        typeof titleFieldStyle.showDescription === 'boolean' ? titleFieldStyle.showDescription : true
      };
      
      // Call the parent's title update function with complete style
      onTitleUpdate(title, description, completeStyle);
    }
    
    setIsTitleEditorOpen(false);
  };
  
  // Filter out title field to get sortable elements
  const sortableElements = elements.filter(element => element.type !== 'form-title' || element.id !== FORM_TITLE_ID);
  
  return (
    <div className="space-y-4">
      {/* Form Title Editor Button */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
            </h3>
            <p className={`text-sm text-gray-500 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' 
                ? 'عنوان النموذج الذي سيظهر في أعلى النموذج'
                : 'The form title that will appear at the top of your form'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleTitleEditorOpen}>
            <Edit className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'تعديل العنوان' : 'Edit Title'}
          </Button>
        </div>
        
        <div className="mt-3 p-2 rounded-md bg-white border">
          <div 
            className="rounded-md p-3"
            style={{
              backgroundColor: titleFieldStyle.backgroundColor || formStyle.primaryColor,
              textAlign: (titleFieldStyle.textAlign as any) || (language === 'ar' ? 'right' : 'center'),
              borderRadius: titleFieldStyle.borderRadius || formStyle.borderRadius,
              padding: `${titleFieldStyle.paddingY || '16px'} 16px`
            }}
            data-show-title={titleFieldStyle.showTitle !== false ? 'true' : 'false'}
            data-show-description={titleFieldStyle.showDescription !== false ? 'true' : 'false'}
          >
            {(titleFieldStyle.showTitle !== false) && (
              <h3 style={{ 
                color: titleFieldStyle.color || '#ffffff',
                fontSize: titleFieldStyle.fontSize || '24px', 
                fontWeight: (titleFieldStyle.fontWeight as any) || 'bold',
                margin: 0
              }}>
                {formTitle || (language === 'ar' ? 'عنوان النموذج' : 'Form Title')}
              </h3>
            )}
            {(titleFieldStyle.showDescription !== false) && formDescription && (
              <p style={{ 
                color: titleFieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)',
                fontSize: titleFieldStyle.descriptionFontSize || '14px',
                margin: '8px 0 0 0'
              }}>
                {formDescription}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Form Fields */}
      {sortableElements.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">
            {language === 'ar' 
              ? 'لا توجد عناصر في النموذج. أضف بعض العناصر من القائمة الجانبية.' 
              : 'No elements in the form. Add some elements from the sidebar.'}
          </p>
        </div>
      )}
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableElements.map(element => element.id)} strategy={verticalListSortingStrategy}>
          {sortableElements.map((element, index) => (
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
      
      {/* Form Title Editor Modal */}
      <FormTitleEditor
        key={`title-editor-${editorInstanceId.current}`}
        isOpen={isTitleEditorOpen}
        onClose={handleTitleEditorClose}
        title={formTitle}
        description={formDescription}
        style={titleFieldStyle}
        onSave={handleTitleSave}
        primaryColor={formStyle.primaryColor}
        borderRadius={formStyle.borderRadius}
      />
    </div>
  );
};

export default React.memo(FormElementEditor);

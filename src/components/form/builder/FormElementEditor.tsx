
import React, { useCallback, useState } from 'react';
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
  onUpdateElement,
  formTitle,
  formDescription,
  formStyle,
  onTitleUpdate,
  onStyleChange
}) => {
  const { language } = useI18n();
  const [isTitleEditorOpen, setIsTitleEditorOpen] = useState(false);
  
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
      // Create deep copies using JSON serialization to prevent mutations
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
  
  // This function updates both the title field and syncs with global style if needed
  const handleTitleSave = (title: string, description: string, style: any) => {
    // Use onTitleUpdate to handle title updates - this ensures consistency
    if (onTitleUpdate) {
      // Make a deep copy of the style to prevent mutations
      const styleToSave = JSON.parse(JSON.stringify(style));
      
      console.log("Saving title with style:", styleToSave);
      onTitleUpdate(title, description, styleToSave);
    }
    
    // Update primaryColor for other elements like buttons
    if (style.backgroundColor && onStyleChange) {
      onStyleChange('primaryColor', style.backgroundColor);
    }
    
    setIsTitleEditorOpen(false);
  };
  
  // Handle global style updates for title editor
  const handleGlobalStyleUpdate = (key: string, value: string) => {
    if (onStyleChange) {
      onStyleChange(key, value);
    }
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
            <p className={`text-xs text-amber-600 mt-1 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' 
                ? 'لون الخلفية يؤثر فقط على خلفية العنوان وليس النموذج بأكمله'
                : 'Background color only affects the title area, not the entire form'}
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
              borderRadius: formStyle.borderRadius
            }}
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
        isOpen={isTitleEditorOpen}
        onClose={handleTitleEditorClose}
        title={formTitle}
        description={formDescription}
        style={{
          ...titleFieldStyle,
          backgroundColor: titleFieldStyle.backgroundColor || formStyle.primaryColor
        }}
        onSave={handleTitleSave}
        primaryColor={formStyle.primaryColor}
        borderRadius={formStyle.borderRadius}
        updateGlobalStyle={handleGlobalStyleUpdate}
      />
    </div>
  );
};

export default React.memo(FormElementEditor);

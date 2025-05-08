
import React, { memo } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useI18n } from '@/lib/i18n';
import { FormField } from '@/lib/form-utils';
import FormElementEditor from './FormElementEditor';

interface FormEditorCanvasProps {
  elements: FormField[];
  selectedElementIndex: number | null;
  onSelectElement: (index: number) => void;
  onEditElement: (index: number) => void;
  onDeleteElement: (index: number) => void;
  onDuplicateElement: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

// Memoize the component to prevent unnecessary re-renders
const FormEditorCanvas: React.FC<FormEditorCanvasProps> = memo(({
  elements,
  selectedElementIndex,
  onSelectElement,
  onEditElement,
  onDeleteElement,
  onDuplicateElement,
  onDragEnd
}) => {
  const { language } = useI18n();

  // Memoize the items array to prevent unnecessary re-renders
  const itemIds = React.useMemo(() => elements.map(el => el.id), [elements]);

  return (
    <div className="space-y-4">
      <DndContext 
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext 
          items={itemIds}
          strategy={verticalListSortingStrategy}
        >
          <FormElementEditor
            elements={elements}
            selectedIndex={selectedElementIndex}
            onSelectElement={onSelectElement}
            onEditElement={onEditElement}
            onDeleteElement={onDeleteElement}
            onDuplicateElement={onDuplicateElement}
          />
        </SortableContext>
      </DndContext>
      
      {elements.length === 0 && (
        <div className="text-center p-6 border rounded-md border-dashed">
          <p className="text-gray-500 mb-2">
            {language === 'ar' 
              ? 'لا توجد عناصر في النموذج' 
              : 'No elements in this form'}
          </p>
          <p className="text-gray-500 text-sm">
            {language === 'ar' 
              ? 'اختر نوع العنصر من القائمة لإضافته' 
              : 'Choose an element type from the panel to add'}
          </p>
        </div>
      )}
    </div>
  );
});

FormEditorCanvas.displayName = 'FormEditorCanvas';

export default FormEditorCanvas;

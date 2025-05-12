
import React from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField } from '@/lib/form-utils';
import { SortableField } from '@/components/form/SortableField';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash } from 'lucide-react';
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
}

const FormElementEditor: React.FC<FormElementEditorProps> = ({
  elements,
  selectedIndex,
  onSelectElement,
  onEditElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements
}) => {
  const { language } = useI18n();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = elements.findIndex((item) => item.id === active.id);
    const newIndex = elements.findIndex((item) => item.id === over.id);
    
    if (onReorderElements) {
      const newElements = arrayMove(elements, oldIndex, newIndex);
      onReorderElements(newElements);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-md border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {language === 'ar' ? 'تنسيق النموذج العام' : 'Global form styling'}
          </h3>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={elements.map(element => element.id)}
          strategy={verticalListSortingStrategy}
        >
          {elements.map((element, index) => (
            <SortableField
              key={element.id}
              field={element}
              onEdit={() => onEditElement(index)}
              onDuplicate={() => onDuplicateElement(index)}
              onDelete={() => onDeleteElement(index)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default FormElementEditor;

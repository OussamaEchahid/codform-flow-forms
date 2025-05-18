
import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField, FormStep } from '@/lib/form-utils';
import SortableField from '../SortableField';
import { useI18n } from '@/lib/i18n';

interface FieldListEditorProps {
  formSteps: FormStep[];
  currentEditStep: number;
  setFormSteps: (steps: FormStep[]) => void;
  setPreviewRefresh: (callback: (prev: number) => number) => void;
  onEditField: (field: FormField) => void;
}

const FieldListEditor: React.FC<FieldListEditorProps> = ({
  formSteps,
  currentEditStep,
  setFormSteps,
  setPreviewRefresh,
  onEditField
}) => {
  const { language } = useI18n();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndFields = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const updatedSteps = [...formSteps];
    const currentStep = updatedSteps[currentEditStep];
    const oldIndex = currentStep.fields.findIndex((field) => field.id === active.id);
    const newIndex = currentStep.fields.findIndex((field) => field.id === over.id);
    
    currentStep.fields = arrayMove(currentStep.fields, oldIndex, newIndex);
    setFormSteps(updatedSteps);
    setPreviewRefresh(prev => prev + 1);
  };
  
  const deleteField = (fieldId: string) => {
    const updatedSteps = [...formSteps];
    updatedSteps[currentEditStep].fields = updatedSteps[currentEditStep].fields.filter(f => f.id !== fieldId);
    setFormSteps(updatedSteps);
    setPreviewRefresh(prev => prev + 1);
  };

  const duplicateField = (field: FormField) => {
    const newField = {
      ...field,
      id: `${field.id}-copy`,
      label: `${field.label} (${language === 'ar' ? 'نسخة' : 'Copy'})`
    };
    
    const updatedSteps = [...formSteps];
    const stepIndex = currentEditStep;
    const fieldIndex = updatedSteps[stepIndex].fields.findIndex(f => f.id === field.id);
    
    updatedSteps[stepIndex].fields.splice(fieldIndex + 1, 0, newField);
    setFormSteps(updatedSteps);
    setPreviewRefresh(prev => prev + 1);
  };
  
  const currentStepFields = formSteps[currentEditStep]?.fields || [];
  const currentStepTitle = formSteps[currentEditStep]?.title;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-3 text-right">
        {language === 'ar' 
          ? `حقول الخطوة: ${currentStepTitle}`
          : `Step Fields: ${currentStepTitle}`}
      </h3>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndFields}
      >
        <SortableContext
          items={currentStepFields.map(field => field.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {currentStepFields.map((field) => (
              <SortableField
                key={field.id}
                field={field}
                onEdit={() => onEditField(field)}
                onDuplicate={() => duplicateField(field)}
                onDelete={() => deleteField(field.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {currentStepFields.length === 0 && (
        <div className="text-center py-8 text-gray-500 border rounded-lg">
          <p>{language === 'ar' ? 'لا توجد حقول في هذه الخطوة' : 'No fields in this step'}</p>
          <p className="text-sm">{language === 'ar' ? 'أضف حقولًا من القائمة أعلاه' : 'Add fields from the list above'}</p>
        </div>
      )}
    </div>
  );
};

export default FieldListEditor;

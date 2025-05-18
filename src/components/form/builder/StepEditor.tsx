
import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableStep from '../SortableStep';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FormStep } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface StepEditorProps {
  formSteps: FormStep[];
  currentEditStep: number;
  setCurrentEditStep: (index: number) => void;
  setFormSteps: (steps: FormStep[]) => void;
  setPreviewRefresh: (callback: (prev: number) => number) => void;
}

const StepEditor: React.FC<StepEditorProps> = ({
  formSteps,
  currentEditStep,
  setCurrentEditStep,
  setFormSteps,
  setPreviewRefresh
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

  const handleDragEndSteps = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFormSteps((steps) => {
      const oldIndex = steps.findIndex((step) => step.id === active.id);
      const newIndex = steps.findIndex((step) => step.id === over.id);
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      return newSteps;
    });
    setPreviewRefresh(prev => prev + 1);
  };
  
  const addNewStep = () => {
    const newStep = {
      id: (formSteps.length + 1).toString(),
      title: language === 'ar' 
        ? `خطوة جديدة ${formSteps.length + 1}`
        : `New Step ${formSteps.length + 1}`,
      fields: []
    };
    setFormSteps([...formSteps, newStep]);
    setCurrentEditStep(formSteps.length);
    setPreviewRefresh(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-right">
        {language === 'ar' ? 'خطوات النموذج' : 'Form Steps'}
      </h3>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndSteps}
      >
        <SortableContext
          items={formSteps.map(step => step.id)}
          strategy={verticalListSortingStrategy}
        >
          {formSteps.map((step, index) => (
            <SortableStep
              key={step.id}
              step={step}
              isActive={currentEditStep === index}
              onClick={() => setCurrentEditStep(index)}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      <Button 
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={addNewStep}
      >
        <Plus size={16} />
        {language === 'ar' ? 'إضافة خطوة جديدة' : 'Add New Step'}
      </Button>
    </div>
  );
};

export default StepEditor;

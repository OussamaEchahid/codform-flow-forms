
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { FormStep } from '@/lib/form-utils';
import { GripVertical, Settings, Trash } from 'lucide-react';

interface SortableStepProps {
  step: FormStep;
  isActive: boolean;
  onClick: () => void;
}

const SortableStep: React.FC<SortableStepProps> = ({ step, isActive, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 border rounded-lg cursor-pointer transition-all",
        isActive ? "border-codform-purple bg-codform-light-purple" : "border-gray-200 hover:border-gray-300",
        isDragging ? "shadow-lg" : ""
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical size={16} className="text-gray-500" />
          </button>
          <Settings size={16} className="text-gray-500" />
          <Trash size={16} className="text-gray-500" />
        </div>
        <div className="text-right">
          <h3 className="font-medium">{step.title}</h3>
          <p className="text-sm text-gray-500">{step.fields.length} حقول</p>
        </div>
      </div>
    </div>
  );
};

export default SortableStep;

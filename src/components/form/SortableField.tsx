
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { GripVertical, Settings, Copy, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SortableFieldProps {
  field: FormField;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const SortableField: React.FC<SortableFieldProps> = ({
  field,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

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
        "flex justify-between items-center p-3 border rounded-lg",
        isDragging ? "shadow-lg" : ""
      )}
    >
      <div className="flex gap-2 items-center">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={16} className="text-gray-500" />
        </button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Settings size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate}>
          <Copy size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash size={16} />
        </Button>
      </div>
      
      <div className="text-right">
        <div className="font-medium">{field.label}</div>
        <div className="text-sm text-gray-500">
          {field.required ? 'مطلوب' : 'اختياري'} | {field.type}
        </div>
      </div>
    </div>
  );
};

export default SortableField;

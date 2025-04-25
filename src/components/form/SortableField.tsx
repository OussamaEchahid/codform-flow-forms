
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { GripVertical, Settings, Copy, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  } = useSortable({ 
    id: field.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex justify-between items-center p-3 border rounded-lg mb-3",
        isDragging ? "shadow-lg" : ""
      )}
    >
      <div className="flex gap-2 items-center">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded"
        >
          <GripVertical size={16} className="text-gray-500" />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className="hover:bg-gray-100"
        >
          <Settings size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDuplicate();
          }}
          className="hover:bg-gray-100"
        >
          <Copy size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="hover:text-red-500 hover:bg-red-50"
        >
          <Trash size={16} />
        </Button>
      </div>
      
      <div className="text-right">
        <div className="font-medium">{field.label || "حقل بدون عنوان"}</div>
        <div className="text-sm text-gray-500">
          {field.required ? 'مطلوب' : 'اختياري'} | {field.type}
        </div>
      </div>
    </div>
  );
};

export default SortableField;

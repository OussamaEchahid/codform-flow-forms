
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, GripVertical } from 'lucide-react';

interface SortableFieldItemProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({
  field,
  isSelected,
  onSelect,
  onDelete,
  onEdit
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const { language } = useI18n();
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center border rounded-md p-3 mb-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
      onClick={onSelect}
    >
      <div 
        className="cursor-grab mr-2 text-gray-400" 
        {...listeners}
      >
        <GripVertical size={16} />
      </div>
      
      <div className="flex-1">
        <div className="font-medium">{field.label}</div>
        <div className="text-xs text-gray-500">
          {language === 'ar' ? 'النوع:' : 'Type:'} {field.type}
          {field.required && (
            <span className="ml-2 text-red-500">
              {language === 'ar' ? '(مطلوب)' : '(Required)'}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-500"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil size={16} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash size={16} />
        </Button>
      </div>
    </div>
  );
};

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldIndex: number | null;
  onSelectField: (index: number) => void;
  onUpdateField: (index: number, field: FormField) => void;
  onDeleteField: (index: number) => void;
}

const FormCanvas: React.FC<FormCanvasProps> = ({
  fields,
  selectedFieldIndex,
  onSelectField,
  onUpdateField,
  onDeleteField
}) => {
  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <SortableFieldItem
          key={field.id}
          field={field}
          isSelected={selectedFieldIndex === index}
          onSelect={() => onSelectField(index)}
          onDelete={() => onDeleteField(index)}
          onEdit={() => {
            // For now, just select the field - we'll add an editor later
            onSelectField(index);
          }}
        />
      ))}
    </div>
  );
};

export default FormCanvas;

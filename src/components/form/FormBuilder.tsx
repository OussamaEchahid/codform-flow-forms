
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  Move, 
  GripVertical,
  ChevronUp,
  ChevronDown,
  Settings,
  Copy
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

// Basic field types
const fieldTypes = [
  { value: 'text', label: 'حقل نص' },
  { value: 'email', label: 'بريد إلكتروني' },
  { value: 'phone', label: 'رقم هاتف' },
  { value: 'textarea', label: 'نص متعدد الأسطر' },
  { value: 'select', label: 'قائمة منسدلة' },
  { value: 'checkbox', label: 'خانة اختيار' },
  { value: 'radio', label: 'زر راديو' },
  { value: 'submit', label: 'زر إرسال الطلب' },
];

// SortableField component
const SortableField = ({ field, onEdit, onDelete, onDuplicate }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center border rounded-md p-3 bg-white mb-2 group"
    >
      <div className="cursor-move text-gray-400" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>
      
      <div className="flex-1 mx-4">
        <div className="font-medium">{field.label || 'حقل بدون عنوان'}</div>
        <div className="text-sm text-gray-500">{fieldTypes.find(ft => ft.value === field.type)?.label}</div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(field)}
          className="text-gray-500 hover:text-gray-700 p-1"
          title="تعديل"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => onDuplicate(field)}
          className="text-gray-500 hover:text-gray-700 p-1"
          title="نسخ"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={() => onDelete(field.id)}
          className="text-red-500 hover:text-red-700 p-1"
          title="حذف"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// Field Editor Dialog
const FieldEditorDialog = ({ field, onSave, onClose }) => {
  const [editedField, setEditedField] = useState({ ...field });
  const [options, setOptions] = useState(field.options || []);
  
  const handleChange = (key, value) => {
    setEditedField(prev => ({ ...prev, [key]: value }));
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], label: value };
    setOptions(newOptions);
  };
  
  const addOption = () => {
    setOptions([...options, { value: `option-${options.length + 1}`, label: `الخيار ${options.length + 1}` }]);
  };
  
  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };
  
  const handleSave = () => {
    // Update options if field type requires them
    const needsOptions = ['select', 'checkbox', 'radio'].includes(editedField.type);
    const updatedField = {
      ...editedField,
      options: needsOptions ? options : undefined
    };
    
    onSave(updatedField);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-4">تحرير الحقل</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">نوع الحقل</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={editedField.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {fieldTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">عنوان الحقل</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={editedField.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">نص توضيحي (اختياري)</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={editedField.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="required-field"
              checked={editedField.required || false}
              onChange={(e) => handleChange('required', e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="required-field" className="mr-2">حقل إلزامي</label>
          </div>
          
          {/* Options for select, checkbox, and radio */}
          {['select', 'checkbox', 'radio'].includes(editedField.type) && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">الخيارات</h4>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + إضافة خيار
                </button>
              </div>
              
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      className="flex-1 border rounded px-3 py-2"
                      value={option.label}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                {options.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    انقر على "إضافة خيار" لإنشاء خيارات لهذا الحقل
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave}>حفظ التغييرات</Button>
        </div>
      </div>
    </div>
  );
};

// Main FormBuilder component
export interface FormBuilderProps {
  data: any[];
  onChange: (newData: any[]) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ data, onChange }) => {
  // Initialize with a default empty step if data is empty
  const initialData = data && data.length > 0 
    ? data 
    : [{ id: '1', title: 'نموذج جديد', fields: [] }];
  
  const [formData, setFormData] = useState(initialData);
  const [currentEditingField, setCurrentEditingField] = useState(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  
  // Update parent when our local data changes
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  // Setup DnD sensors
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
  
  // Get the current fields (first step only)
  const currentFields = formData[0]?.fields || [];
  
  // Add a new field
  const addField = (type) => {
    const newField = {
      id: uuidv4(),
      type,
      label: fieldTypes.find(ft => ft.value === type)?.label || 'حقل جديد',
      required: false,
      placeholder: '',
    };
    
    if (['select', 'checkbox', 'radio'].includes(type)) {
      newField.options = [
        { value: 'option1', label: 'الخيار 1' },
        { value: 'option2', label: 'الخيار 2' }
      ];
    }
    
    const updatedData = [...formData];
    updatedData[0] = {
      ...updatedData[0],
      fields: [...currentFields, newField]
    };
    
    setFormData(updatedData);
  };
  
  // Edit a field
  const editField = (field) => {
    setCurrentEditingField(field);
    setShowFieldEditor(true);
  };
  
  // Save edited field
  const saveField = (updatedField) => {
    const updatedData = [...formData];
    
    updatedData[0] = {
      ...updatedData[0],
      fields: currentFields.map(f => 
        f.id === updatedField.id ? updatedField : f
      )
    };
    
    setFormData(updatedData);
    setShowFieldEditor(false);
    setCurrentEditingField(null);
  };
  
  // Delete a field
  const deleteField = (fieldId) => {
    const updatedData = [...formData];
    
    updatedData[0] = {
      ...updatedData[0],
      fields: currentFields.filter(f => f.id !== fieldId)
    };
    
    setFormData(updatedData);
  };
  
  // Duplicate a field
  const duplicateField = (field) => {
    const newField = {
      ...field,
      id: uuidv4(),
      label: `${field.label} (نسخة)`
    };
    
    const fieldIndex = currentFields.findIndex(f => f.id === field.id);
    const newFields = [...currentFields];
    newFields.splice(fieldIndex + 1, 0, newField);
    
    const updatedData = [...formData];
    updatedData[0] = {
      ...updatedData[0],
      fields: newFields
    };
    
    setFormData(updatedData);
  };
  
  // Handle drag end event for field reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = currentFields.findIndex(f => f.id === active.id);
      const newIndex = currentFields.findIndex(f => f.id === over.id);
      
      const newFields = arrayMove(currentFields, oldIndex, newIndex);
      
      const updatedData = [...formData];
      updatedData[0] = {
        ...updatedData[0],
        fields: newFields
      };
      
      setFormData(updatedData);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">حقول النموذج</h3>
        
        {currentFields.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentFields.map(field => field.id)}
              strategy={verticalListSortingStrategy}
            >
              {currentFields.map(field => (
                <SortableField
                  key={field.id}
                  field={field}
                  onEdit={editField}
                  onDelete={deleteField}
                  onDuplicate={duplicateField}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
            <p className="mb-2">لا توجد حقول في هذا النموذج</p>
            <p className="text-sm">انقر على "إضافة حقل" أدناه لإضافة حقول للنموذج</p>
          </div>
        )}
      </div>
      
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">إضافة حقل جديد</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fieldTypes.map(type => (
            <Button
              key={type.value}
              variant="outline"
              onClick={() => addField(type.value)}
              className="justify-start h-auto py-3"
            >
              <Plus size={16} className="mr-2" />
              {type.label}
            </Button>
          ))}
        </div>
      </div>
      
      {showFieldEditor && currentEditingField && (
        <FieldEditorDialog
          field={currentEditingField}
          onSave={saveField}
          onClose={() => {
            setShowFieldEditor(false);
            setCurrentEditingField(null);
          }}
        />
      )}
    </div>
  );
};

export default FormBuilder;

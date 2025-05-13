
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2,
  GripVertical,
  Copy,
  Settings
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
} from '@dnd-kit/sortable';
import SortableField from './SortableField';
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

// Type definition for field
interface FieldType {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{value: string; label: string}>;
}

// Field Editor Dialog
const FieldEditorDialog = ({ field, onSave, onClose }: { 
  field: FieldType, 
  onSave: (field: FieldType) => void, 
  onClose: () => void 
}) => {
  const [editedField, setEditedField] = useState<FieldType>({ ...field });
  const [options, setOptions] = useState<Array<{value: string; label: string}>>(field.options || []);
  
  const handleChange = (key: string, value: any) => {
    setEditedField(prev => ({ ...prev, [key]: value }));
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], label: value };
    setOptions(newOptions);
  };
  
  const addOption = () => {
    setOptions([...options, { value: `option-${options.length + 1}`, label: `الخيار ${options.length + 1}` }]);
  };
  
  const removeOption = (index: number) => {
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
  const [currentEditingField, setCurrentEditingField] = useState<FieldType | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  
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
  
  // Update parent when our local data changes - using useCallback to prevent dependency loop
  const updateParent = useCallback(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  // Update parent data after initial render and when formData changes
  useEffect(() => {
    // Only update parent if formData has changed compared to the initialData
    if (JSON.stringify(formData) !== JSON.stringify(initialData)) {
      updateParent();
    }
  }, [formData, initialData, updateParent]);
  
  // Update local state when parent data changes
  useEffect(() => {
    // Only update if data is valid and different from current formData
    if (data && data.length > 0 && JSON.stringify(data) !== JSON.stringify(formData)) {
      setFormData(data);
    }
  }, [data]);
  
  // Get the current fields (first step only)
  const currentFields = formData[0]?.fields || [];
  
  // Add a new field
  const addField = (type: string) => {
    const newField: FieldType = {
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
    if (updatedData[0]) {
      updatedData[0] = {
        ...updatedData[0],
        fields: [...currentFields, newField]
      };
      
      setFormData(updatedData);
    } else {
      // Handle case where formData[0] might be undefined
      const newFormData = [{ 
        id: '1', 
        title: 'نموذج جديد', 
        fields: [newField] 
      }];
      setFormData(newFormData);
    }
  };
  
  // Edit a field
  const editField = (field: FieldType) => {
    setCurrentEditingField(field);
    setShowFieldEditor(true);
  };
  
  // Save edited field
  const saveField = (updatedField: FieldType) => {
    const updatedData = [...formData];
    
    if (updatedData[0]) {
      updatedData[0] = {
        ...updatedData[0],
        fields: currentFields.map(f => 
          f.id === updatedField.id ? updatedField : f
        )
      };
      
      setFormData(updatedData);
    }
    
    setShowFieldEditor(false);
    setCurrentEditingField(null);
  };
  
  // Delete a field
  const deleteField = (fieldId: string) => {
    const updatedData = [...formData];
    
    if (updatedData[0]) {
      updatedData[0] = {
        ...updatedData[0],
        fields: currentFields.filter(f => f.id !== fieldId)
      };
      
      setFormData(updatedData);
    }
  };
  
  // Duplicate a field
  const duplicateField = (field: FieldType) => {
    const newField = {
      ...field,
      id: uuidv4(),
      label: `${field.label} (نسخة)`
    };
    
    const fieldIndex = currentFields.findIndex(f => f.id === field.id);
    if (fieldIndex === -1) {
      toast.error('Failed to duplicate field');
      return;
    }
    
    const newFields = [...currentFields];
    newFields.splice(fieldIndex + 1, 0, newField);
    
    const updatedData = [...formData];
    if (updatedData[0]) {
      updatedData[0] = {
        ...updatedData[0],
        fields: newFields
      };
      
      setFormData(updatedData);
    }
  };
  
  // Handle drag end event for field reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = currentFields.findIndex(f => f.id === active.id);
      const newIndex = currentFields.findIndex(f => f.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(currentFields, oldIndex, newIndex);
        
        const updatedData = [...formData];
        if (updatedData[0]) {
          updatedData[0] = {
            ...updatedData[0],
            fields: newFields
          };
          
          setFormData(updatedData);
        }
      }
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
                  onEdit={() => editField(field)}
                  onDelete={() => deleteField(field.id)}
                  onDuplicate={() => duplicateField(field)}
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

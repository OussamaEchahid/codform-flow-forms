
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// Simplified form builder interface
export interface FormBuilderProps {
  formData: any[];
  onChange: (newFormData: any[]) => void;
}

// Simple field types for the form builder
const FIELD_TYPES = [
  { id: 'text', name: 'نص', name_en: 'Text' },
  { id: 'number', name: 'رقم', name_en: 'Number' },
  { id: 'select', name: 'قائمة منسدلة', name_en: 'Dropdown' },
  { id: 'checkbox', name: 'مربع اختيار', name_en: 'Checkbox' }
];

const FormBuilder: React.FC<FormBuilderProps> = ({ formData = [], onChange }) => {
  const { language } = useI18n();
  
  // Add a new field to the form
  const addField = (type: string) => {
    const newField = {
      id: `field-${Date.now()}`,
      type,
      label: language === 'ar' ? 'حقل جديد' : 'New Field',
      required: false
    };
    
    const updatedFormData = [...formData, newField];
    onChange(updatedFormData);
  };
  
  // Remove a field from the form
  const removeField = (index: number) => {
    const updatedFormData = [...formData];
    updatedFormData.splice(index, 1);
    onChange(updatedFormData);
  };

  return (
    <div className="form-builder space-y-4">
      {/* List of current fields */}
      {formData && formData.length > 0 ? (
        <div className="space-y-2">
          {formData.map((field, index) => (
            <div key={field.id || index} className="p-3 border rounded bg-white flex justify-between items-center">
              <div>
                <span className="font-medium">{field.label || `Field ${index + 1}`}</span>
                <span className="ml-2 text-sm text-gray-500">({FIELD_TYPES.find(t => t.id === field.type)?.name_en || field.type})</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeField(index)} 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                {language === 'ar' ? 'حذف' : 'Remove'}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 border rounded-md bg-gray-50">
          {language === 'ar' 
            ? 'لم تتم إضافة أي حقول بعد. أضف حقولًا لبدء إنشاء النموذج.'
            : 'No fields added yet. Add fields to start building your form.'}
        </div>
      )}
      
      {/* Add field buttons */}
      <div className="pt-4 border-t">
        <h3 className="mb-2 font-medium">
          {language === 'ar' ? 'إضافة حقل جديد' : 'Add New Field'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {FIELD_TYPES.map(type => (
            <Button 
              key={type.id}
              variant="outline" 
              size="sm"
              onClick={() => addField(type.id)}
              className="flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              {language === 'ar' ? type.name : type.name_en}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;

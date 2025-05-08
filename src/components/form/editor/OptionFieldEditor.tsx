
import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import BaseFieldEditor from './BaseFieldEditor';

interface OptionFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const OptionFieldEditor = ({ field, onSave, onClose }: OptionFieldEditorProps) => {
  const { language } = useI18n();
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    field.options?.map(option => {
      // Handle both string and object options for backward compatibility
      if (typeof option === 'string') {
        return { value: option, label: option };
      }
      return option as { value: string; label: string };
    }) || []
  );
  const [newOption, setNewOption] = useState({ value: '', label: '' });
  
  const addOption = () => {
    if (newOption.value.trim() && newOption.label.trim()) {
      setOptions([...options, { ...newOption }]);
      setNewOption({ value: '', label: '' });
    }
  };

  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleSaveField = (updatedField: FormField) => {
    // Ensure numeric fields are properly typed
    if (typeof updatedField.minLength === 'string') {
      updatedField.minLength = parseInt(updatedField.minLength, 10) || 0;
    }
    
    if (typeof updatedField.maxLength === 'string') {
      updatedField.maxLength = parseInt(updatedField.maxLength, 10) || 0;
    }
    
    updatedField.options = options;
    onSave(updatedField);
  };

  return (
    <BaseFieldEditor field={field} onSave={handleSaveField} onClose={onClose}>
      {/* Options Section */}
      <div className="space-y-2">
        <FormLabel>{language === 'ar' ? 'الخيارات' : 'Options'}</FormLabel>
        
        {options.length === 0 && (
          <div className="p-4 text-center text-gray-500 border rounded-md border-dashed">
            {language === 'ar' ? 'لا توجد خيارات. أضف خيارات أدناه.' : 'No options. Add options below.'}
          </div>
        )}
        
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
            <div className="flex-1">
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-xs text-gray-500">{option.value}</div>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => removeOption(index)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <div className="p-4 border rounded-md mt-2">
          <h4 className="text-sm font-medium mb-2">{language === 'ar' ? 'إضافة خيار جديد' : 'Add New Option'}</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs">{language === 'ar' ? 'النص' : 'Label'}</label>
              <Input 
                value={newOption.label}
                onChange={(e) => setNewOption({...newOption, label: e.target.value})}
                placeholder={language === 'ar' ? 'نص الخيار' : 'Option label'}
                size="sm"
              />
            </div>
            <div>
              <label className="text-xs">{language === 'ar' ? 'القيمة' : 'Value'}</label>
              <Input 
                value={newOption.value}
                onChange={(e) => setNewOption({...newOption, value: e.target.value})}
                placeholder={language === 'ar' ? 'قيمة الخيار' : 'Option value'}
                size="sm"
              />
            </div>
            <Button 
              type="button"
              onClick={addOption}
              disabled={!newOption.label.trim() || !newOption.value.trim()}
              className="w-full mt-2"
              size="sm"
            >
              {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
            </Button>
          </div>
        </div>
      </div>
    </BaseFieldEditor>
  );
};

export default OptionFieldEditor;

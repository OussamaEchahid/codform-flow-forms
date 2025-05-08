import React, { useState, useEffect } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

interface OptionFieldEditorProps {
  field: FormField;
  onChange: (field: FormField) => void;
}

const OptionFieldEditor: React.FC<OptionFieldEditorProps> = ({ field, onChange }) => {
  const { language } = useI18n();
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    if (field.options && Array.isArray(field.options)) {
      // Check if options are strings or objects
      if (typeof field.options[0] === 'string') {
        // Convert string options to object options
        setOptions(field.options.map((option: string) => ({ value: option, label: option })));
      } else {
        // Use existing object options
        setOptions(field.options as Array<{ value: string; label: string }>);
      }
    } else {
      setOptions([{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }]);
    }
  }, [field.options]);

  const updateOptions = (newOptions: Array<{ value: string; label: string }>) => {
    setOptions(newOptions);
    onChange({
      ...field,
      options: newOptions
    });
  };

  const addOption = () => {
    const newOption = { value: `option${options.length + 1}`, label: `Option ${options.length + 1}` };
    updateOptions([...options, newOption]);
  };

  const updateOption = (index: number, key: 'value' | 'label', value: string) => {
    const newOptions = [...options];
    newOptions[index][key] = value;
    updateOptions(newOptions);
  };

  const deleteOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    updateOptions(newOptions);
  };

  // Handle min length change - convert string to number
  const handleMinLengthChange = (value: string) => {
    const newMinLength = value ? parseInt(value, 10) : undefined;
    onChange({
      ...field,
      minLength: newMinLength
    });
  };

  // Handle max length change - convert string to number
  const handleMaxLengthChange = (value: string) => {
    const newMaxLength = value ? parseInt(value, 10) : undefined;
    onChange({
      ...field,
      maxLength: newMaxLength
    });
  };

  return (
    <div className="space-y-4">
      {options.map((option, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-right">
              {language === 'ar' ? 'القيمة' : 'Value'}
            </label>
            <Input
              type="text"
              className="w-full p-2 border rounded-md"
              value={option.value}
              onChange={(e) => updateOption(index, 'value', e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-right">
              {language === 'ar' ? 'التسمية' : 'Label'}
            </label>
            <Input
              type="text"
              className="w-full p-2 border rounded-md"
              value={option.label}
              onChange={(e) => updateOption(index, 'label', e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => deleteOption(index)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={addOption} className="w-full">
        {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
      </Button>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-right">
            {language === 'ar' ? 'الحد الأدنى للاختيارات' : 'Min Choices'}
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded-md"
            value={field.minLength !== undefined ? field.minLength : ''}
            onChange={(e) => handleMinLengthChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-right">
            {language === 'ar' ? 'الحد الأقصى للاختيارات' : 'Max Choices'}
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded-md"
            value={field.maxLength !== undefined ? field.maxLength : ''}
            onChange={(e) => handleMaxLengthChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default OptionFieldEditor;

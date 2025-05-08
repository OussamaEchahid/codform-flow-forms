
import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BaseFieldEditor from './BaseFieldEditor';

interface ImageFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const ImageFieldEditor = ({ field, onSave, onClose }: ImageFieldEditorProps) => {
  const { language } = useI18n();
  const [imagePosition, setImagePosition] = useState(field.imagePosition || 'top');

  const handleSaveField = (updatedField: FormField) => {
    updatedField.imagePosition = imagePosition;
    onSave(updatedField);
  };

  return (
    <BaseFieldEditor field={field} onSave={handleSaveField} onClose={onClose}>
      <div className="p-4 border rounded-md">
        <h4 className="text-sm font-medium mb-2">{language === 'ar' ? 'إعدادات الصورة' : 'Image Settings'}</h4>
        <div className="space-y-2">
          <FormLabel>{language === 'ar' ? 'موضع الصورة' : 'Image Position'}</FormLabel>
          <Select
            value={imagePosition}
            onValueChange={setImagePosition}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'ar' ? 'اختر الموضع' : 'Select position'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">{language === 'ar' ? 'أعلى' : 'Top'}</SelectItem>
              <SelectItem value="left">{language === 'ar' ? 'يسار' : 'Left'}</SelectItem>
              <SelectItem value="right">{language === 'ar' ? 'يمين' : 'Right'}</SelectItem>
              <SelectItem value="bottom">{language === 'ar' ? 'أسفل' : 'Bottom'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </BaseFieldEditor>
  );
};

export default ImageFieldEditor;

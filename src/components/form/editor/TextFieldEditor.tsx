
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { FormField as UIFormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import BaseFieldEditor, { FieldFormValues } from './BaseFieldEditor';

interface TextFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const TextFieldEditor = ({ field, onSave, onClose }: TextFieldEditorProps) => {
  const { language } = useI18n();

  return (
    <BaseFieldEditor field={field} onSave={onSave} onClose={onClose}>
      <UIFormField
        name="placeholder"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{language === 'ar' ? 'النص البديل' : 'Placeholder'}</FormLabel>
            <FormControl>
              <Input {...formField} placeholder={language === 'ar' ? 'مثال' : 'Example'} />
            </FormControl>
          </FormItem>
        )}
      />
      
      <UIFormField
        name="defaultValue"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{language === 'ar' ? 'القيمة الافتراضية' : 'Default Value'}</FormLabel>
            <FormControl>
              <Input {...formField} placeholder={language === 'ar' ? 'القيمة الافتراضية' : 'Default value'} />
            </FormControl>
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <UIFormField
          name="minLength"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'الحد الأدنى للطول' : 'Min Length'}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  onChange={(e) => formField.onChange(Number(e.target.value) || 0)}
                  value={Number(formField.value) || 0}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <UIFormField
          name="maxLength"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'الحد الأقصى للطول' : 'Max Length'}</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  onChange={(e) => formField.onChange(Number(e.target.value) || 0)}
                  value={Number(formField.value) || 0}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </BaseFieldEditor>
  );
};

export default TextFieldEditor;


import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Form, FormField as UIFormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';

export interface FieldFormValues {
  label: string;
  required: boolean;
  placeholder: string;
  helpText: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}

interface BaseFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
  children?: React.ReactNode;
}

const BaseFieldEditor = ({ field, onSave, onClose, children }: BaseFieldEditorProps) => {
  const { language } = useI18n();
  
  // Ensure numeric values are properly converted
  const minLengthValue = typeof field.minLength === 'string' 
    ? parseInt(field.minLength, 10) || 0 
    : (field.minLength || 0);

  const maxLengthValue = typeof field.maxLength === 'string'
    ? parseInt(field.maxLength, 10) || 0
    : (field.maxLength || 0);
  
  const form = useForm<FieldFormValues>({
    defaultValues: {
      label: field.label || '',
      required: field.required || false,
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
      defaultValue: field.defaultValue || '',
      minLength: minLengthValue,
      maxLength: maxLengthValue,
    },
  });

  const handleSubmit = (values: FieldFormValues) => {
    const updatedField: FormField = {
      ...field,
      label: values.label,
      required: values.required,
      placeholder: values.placeholder,
      helpText: values.helpText,
      defaultValue: values.defaultValue,
      // Ensure values are proper numbers
      minLength: typeof values.minLength === 'string' 
        ? parseInt(values.minLength, 10) || 0 
        : (values.minLength || 0),
      maxLength: typeof values.maxLength === 'string' 
        ? parseInt(values.maxLength, 10) || 0 
        : (values.maxLength || 0),
    };
    
    onSave(updatedField);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">
        {language === 'ar' ? `تعديل حقل ${field.label || field.type}` : `Edit ${field.label || field.type} Field`}
      </h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <UIFormField
            control={form.control}
            name="label"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'العنوان' : 'Label'}</FormLabel>
                <FormControl>
                  <Input {...formField} placeholder={language === 'ar' ? 'عنوان الحقل' : 'Field label'} />
                </FormControl>
              </FormItem>
            )}
          />
          
          {children}
          
          <UIFormField
            control={form.control}
            name="required"
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{language === 'ar' ? 'مطلوب' : 'Required'}</FormLabel>
                  <FormDescription className="text-xs">
                    {language === 'ar' ? 'هذا الحقل مطلوب للإرسال' : 'This field is required for submission'}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <UIFormField
            control={form.control}
            name="helpText"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'نص المساعدة' : 'Help Text'}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...formField} 
                    placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} 
                  />
                </FormControl>
                <FormDescription>
                  {language === 'ar' 
                    ? 'يظهر هذا النص أسفل الحقل لمساعدة المستخدمين' 
                    : 'This text appears below the field to help users'}
                </FormDescription>
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit">{language === 'ar' ? 'حفظ' : 'Save'}</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default BaseFieldEditor;


import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Form, FormField as UIFormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';

interface WhatsAppFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onCancel: () => void;
}

interface FieldFormValues {
  label: string;
  phoneNumber: string;
  message: string;
  backgroundColor: string;
  textColor: string;
}

const WhatsAppFieldEditor: React.FC<WhatsAppFieldEditorProps> = ({ field, onSave, onCancel }) => {
  const { language } = useI18n();
  
  const form = useForm<FieldFormValues>({
    defaultValues: {
      label: field.label || (language === 'ar' ? 'التواصل عبر واتساب' : 'Contact via WhatsApp'),
      phoneNumber: (field.whatsappNumber as string) || '',
      message: (field.message as string) || '',
      backgroundColor: field.style?.backgroundColor || '#25D366',
      textColor: field.style?.color || '#FFFFFF',
    },
  });
  
  const handleSubmit = (values: FieldFormValues) => {
    const updatedField: FormField = {
      ...field,
      label: values.label,
      whatsappNumber: values.phoneNumber,
      message: values.message,
      style: {
        ...(field.style || {}),
        backgroundColor: values.backgroundColor,
        color: values.textColor,
      },
    };
    
    onSave(updatedField);
  };
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">
        {language === 'ar' ? 'تعديل زر واتساب' : 'Edit WhatsApp Button'}
      </h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <UIFormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'عنوان الزر' : 'Button Label'}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <UIFormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={language === 'ar' ? 'مثال: 966500000000' : 'Example: 15551234567'} />
                </FormControl>
                <FormDescription>
                  {language === 'ar' 
                    ? 'أدخل رقم الواتساب متضمنًا رمز الدولة بدون + أو مسافات' 
                    : 'Enter WhatsApp number with country code, without + or spaces'}
                </FormDescription>
              </FormItem>
            )}
          />
          
          <UIFormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'الرسالة الافتراضية' : 'Default Message'}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={language === 'ar' ? 'أدخل الرسالة الافتراضية' : 'Enter default message'} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <UIFormField
            control={form.control}
            name="backgroundColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'لون الخلفية' : 'Background Color'}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <Input
                    type="color"
                    value={field.value}
                    onChange={field.onChange}
                    className="w-12 h-9 p-1"
                  />
                </div>
              </FormItem>
            )}
          />
          
          <UIFormField
            control={form.control}
            name="textColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'لون النص' : 'Text Color'}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <Input
                    type="color"
                    value={field.value}
                    onChange={field.onChange}
                    className="w-12 h-9 p-1"
                  />
                </div>
              </FormItem>
            )}
          />
          
          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit">
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default WhatsAppFieldEditor;

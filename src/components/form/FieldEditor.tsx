import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Form, FormField as UIFormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { AlertCircle, X } from 'lucide-react';
import WhatsAppFieldEditor from './editor/WhatsAppFieldEditor';

interface FieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

interface FieldFormValues {
  label: string;
  required: boolean;
  placeholder: string;
  helpText: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}

const FieldEditor = ({ field, onSave, onClose }: FieldEditorProps) => {
  const { language } = useI18n();
  const [currentField, setCurrentField] = useState<FormField>(field);
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

  const form = useForm<FieldFormValues>({
    defaultValues: {
      label: field.label || '',
      required: field.required || false,
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
      defaultValue: field.defaultValue || '',
      minLength: field.minLength || 0,
      maxLength: field.maxLength || 0,
    },
  });

  const handleSaveField = (updatedField: FormField) => {
    setCurrentField(updatedField);
    onSave(updatedField);
  };

  const handleSubmit = (values: FieldFormValues) => {
    const updatedField: FormField = {
      ...currentField,
      label: values.label,
      required: values.required,
      placeholder: values.placeholder,
      helpText: values.helpText,
      defaultValue: values.defaultValue,
      minLength: values.minLength,
      maxLength: values.maxLength,
    };
    
    // Add options for select, radio, checkbox types
    if (['select', 'radio', 'checkbox'].includes(currentField.type)) {
      updatedField.options = options;
    }
    
    handleSaveField(updatedField);
  };

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

  const renderTextBasedFields = () => (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">
        {language === 'ar' ? 'تعديل الحقل' : 'Edit Field'}
      </h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <UIFormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'العنوان' : 'Label'}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={language === 'ar' ? 'عنوان الحقل' : 'Field label'} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <UIFormField
            control={form.control}
            name="placeholder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'النص البديل' : 'Placeholder'}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={language === 'ar' ? 'مثال' : 'Example'} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <UIFormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'القيمة الافتراضية' : 'Default Value'}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={language === 'ar' ? 'القيمة الافتراضية' : 'Default value'} />
                </FormControl>
              </FormItem>
            )}
          />
          
          {['text', 'email', 'textarea'].includes(currentField.type) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <UIFormField
                  control={form.control}
                  name="minLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'الحد الأدنى للطول' : 'Min Length'}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          value={field.value}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <UIFormField
                  control={form.control}
                  name="maxLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'الحد الأقصى للطول' : 'Max Length'}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          value={field.value}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
          
          <UIFormField
            control={form.control}
            name="required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'نص المساعدة' : 'Help Text'}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
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

  const renderOptionBasedFields = () => (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">
        {language === 'ar' ? `تعديل حقل ${currentField.type}` : `Edit ${currentField.type} Field`}
      </h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <UIFormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'العنوان' : 'Label'}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={language === 'ar' ? 'عنوان الحقل' : 'Field label'} />
                </FormControl>
              </FormItem>
            )}
          />
          
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
          
          <UIFormField
            control={form.control}
            name="required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{language === 'ar' ? 'مطلوب' : 'Required'}</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <UIFormField
            control={form.control}
            name="helpText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'نص المساعدة' : 'Help Text'}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} 
                  />
                </FormControl>
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

  const renderImageField = () => (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">
        {language === 'ar' ? 'تعديل حقل الصورة' : 'Edit Image Field'}
      </h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <UIFormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'العنوان' : 'Label'}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={language === 'ar' ? 'عنوان الحقل' : 'Field label'} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="p-4 border rounded-md">
            <h4 className="text-sm font-medium mb-2">{language === 'ar' ? 'إعدادات الصورة' : 'Image Settings'}</h4>
            <div className="space-y-2">
              <Select
                value={currentField.imagePosition || 'top'}
                onValueChange={(value) => setCurrentField({...currentField, imagePosition: value})}
              >
                <FormLabel>{language === 'ar' ? 'موضع الصورة' : 'Image Position'}</FormLabel>
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
          
          <UIFormField
            control={form.control}
            name="required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{language === 'ar' ? 'مطلوب' : 'Required'}</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <UIFormField
            control={form.control}
            name="helpText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === 'ar' ? 'نص المساعدة' : 'Help Text'}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} 
                  />
                </FormControl>
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

  const renderEditorByType = () => {
    switch (currentField.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'textarea':
        return renderTextBasedFields();
      
      case 'select':
      case 'radio':
      case 'checkbox':
        return renderOptionBasedFields();
      
      case 'whatsapp':
        return (
          <WhatsAppFieldEditor
            field={currentField}
            onSave={handleSaveField}
            onCancel={onClose}
          />
        );
        
      case 'image':
        return renderImageField();
        
      default:
        return (
          <div className="p-4">
            <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-md">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <p>{language === 'ar' ? 'لا يوجد محرر متخصص لهذا النوع من الحقول' : 'No specialized editor available for this field type'}</p>
            </div>
            
            {renderTextBasedFields()}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-gray-100 p-2 flex items-center justify-between border-b z-10">
          <h3 className="font-medium text-gray-700">
            {language === 'ar' ? `تعديل حقل ${currentField.label || currentField.type}` : `Edit ${currentField.label || currentField.type} Field`}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {renderEditorByType()}
      </div>
    </div>
  );
};

export default FieldEditor;

import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Form, FormField as UIFormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import WhatsAppFieldEditor from './editor/WhatsAppFieldEditor';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
}

const FieldEditor = ({ field, onSave, onClose }: FieldEditorProps) => {
  const { language } = useI18n();
  const [currentField, setCurrentField] = useState<FormField>(field);

  const form = useForm<FieldFormValues>({
    defaultValues: {
      label: field.label || '',
      required: field.required || false,
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
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
    };
    handleSaveField(updatedField);
  };

  // Handle animation change for submit button
  const handleAnimationChange = (checked: boolean) => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        animation: checked
      }
    });
  };

  // Handle animation type change for submit button
  const handleAnimationTypeChange = (type: "pulse" | "shake" | "bounce" | "wiggle" | "flash") => {
    setCurrentField({
      ...currentField,
      style: {
        ...currentField.style,
        animationType: type
      }
    });
  };

  const renderEditorByType = () => {
    switch (currentField.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'textarea':
        return (
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
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                      <FormControl>
                        <Checkbox
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
                        <Input {...field} placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} />
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
      
      case 'whatsapp':
        return (
          <WhatsAppFieldEditor
            field={currentField}
            onSave={handleSaveField}
            onClose={onClose}
          />
        );
        
      case 'image':
        return (
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
                
                <UIFormField
                  control={form.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                      <FormControl>
                        <Checkbox
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
                        <Input {...field} placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} />
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
        
      case 'cart-items':
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'تعديل عنصر المنتج المختار' : 'Edit Selected Product Component'}
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
                        <Input {...field} placeholder={language === 'ar' ? 'المنتج المختار' : 'Selected Product'} />
                      </FormControl>
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
                        <Input {...field} placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} />
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
        
      case 'cart-summary':
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'تعديل ملخص الطلب' : 'Edit Order Summary'}
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
                        <Input {...field} placeholder={language === 'ar' ? 'ملخص الطلب' : 'Order Summary'} />
                      </FormControl>
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
                        <Input {...field} placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text for user'} />
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
        
      case 'submit':
        const animationTypes = [
          { value: "pulse" as const, label: language === 'ar' ? 'نبض' : 'Pulse' },
          { value: "shake" as const, label: language === 'ar' ? 'اهتزاز' : 'Shake' },
          { value: "bounce" as const, label: language === 'ar' ? 'ارتداد' : 'Bounce' },
          { value: "wiggle" as const, label: language === 'ar' ? 'تمايل' : 'Wiggle' },
          { value: "flash" as const, label: language === 'ar' ? 'وميض' : 'Flash' }
        ];
        
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'تعديل زر الإرسال' : 'Edit Submit Button'}
            </h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <UIFormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'نص الزر' : 'Button Text'}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={language === 'ar' ? 'إرسال الطلب الآن' : 'Submit Order Now'} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Animation controls */}
                <div className="space-y-4 border rounded-md p-4">
                  <h4 className="font-medium">
                    {language === 'ar' ? 'تأثيرات الرسوم المتحركة للزر' : 'Button Animation Effects'}
                  </h4>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="animation"
                      checked={currentField.style?.animation || false}
                      onCheckedChange={handleAnimationChange}
                    />
                    <label htmlFor="animation" className="text-sm font-medium cursor-pointer">
                      {language === 'ar' ? 'تفعيل الرسوم المتحركة' : 'Enable Animation'}
                    </label>
                  </div>
                  
                  {currentField.style?.animation && (
                    <div className="pt-2">
                      <FormLabel>{language === 'ar' ? 'نوع التأثير' : 'Animation Type'}</FormLabel>
                      <Select
                        value={currentField.style?.animationType || 'pulse'}
                        onValueChange={(value) => handleAnimationTypeChange(value as "pulse" | "shake" | "bounce" | "wiggle" | "flash")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'ar' ? 'اختر نوع التأثير' : 'Select animation type'} />
                        </SelectTrigger>
                        <SelectContent>
                          {animationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
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
        
      default:
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'تعديل الحقل' : 'Edit Field'}
            </h3>
            <p>{language === 'ar' ? 'لا يوجد محرر لهذا النوع من الحقول' : 'No editor available for this field type'}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {renderEditorByType()}
      </div>
    </div>
  );
};

export default FieldEditor;

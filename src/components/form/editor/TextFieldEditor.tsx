import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TextFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const TextFieldEditor: React.FC<TextFieldEditorProps> = ({ field, onSave, onClose }) => {
  const { language } = useI18n();
  const [currentField, setCurrentField] = React.useState<FormField>(field);

  const handleChange = (property: string, value: any) => {
    if (property.includes('.')) {
      const [parent, child] = property.split('.');
      setCurrentField({
        ...currentField,
        [parent]: {
          ...currentField[parent as keyof FormField],
          [child]: value
        }
      });
    } else {
      setCurrentField({
        ...currentField,
        [property]: value
      });
    }
  };

  const handleSave = () => {
    onSave(currentField);
    onClose();
  };

  // أيقونات مناسبة لحقول النص
  const textFieldIcons = [
    { value: "none", label: language === 'ar' ? 'بدون أيقونة' : 'No Icon' },
    { value: "user", label: language === 'ar' ? 'مستخدم' : 'User', icon: '👤' },
    { value: "mail", label: language === 'ar' ? 'بريد إلكتروني' : 'Email', icon: '📧' },
    { value: "phone", label: language === 'ar' ? 'هاتف' : 'Phone', icon: '📞' },
    { value: "id-card", label: language === 'ar' ? 'بطاقة هوية' : 'ID Card', icon: '🆔' },
    { value: "home", label: language === 'ar' ? 'منزل' : 'Home', icon: '🏠' },
    { value: "building", label: language === 'ar' ? 'مكتب' : 'Office', icon: '🏢' }
  ];

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-medium text-lg">
        {language === 'ar' ? 'إعدادات حقل النص' : 'Text Field Settings'}
      </h3>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">{language === 'ar' ? 'أساسي' : 'Basic'}</TabsTrigger>
          <TabsTrigger value="styling">{language === 'ar' ? 'تنسيق' : 'Styling'}</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="field-label">
              {language === 'ar' ? 'العنوان' : 'Label'}
            </Label>
            <Input
              id="field-label"
              value={currentField.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder={language === 'ar' ? 'عنوان الحقل' : 'Field label'}
            />
          </div>

          {/* Placeholder */}
          <div className="space-y-2">
            <Label htmlFor="field-placeholder">
              {language === 'ar' ? 'النص البديل' : 'Placeholder'}
            </Label>
            <Input
              id="field-placeholder"
              value={currentField.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
              placeholder={language === 'ar' ? 'مثال: أدخل اسمك' : 'Example: Enter your name'}
            />
          </div>

          {/* Help Text */}
          <div className="space-y-2">
            <Label htmlFor="field-help">
              {language === 'ar' ? 'نص المساعدة' : 'Help Text'}
            </Label>
            <Input
              id="field-help"
              value={currentField.helpText || ''}
              onChange={(e) => handleChange('helpText', e.target.value)}
              placeholder={language === 'ar' ? 'نص توضيحي للمستخدم' : 'Explanatory text'}
            />
          </div>

          {/* Required */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="field-required"
              checked={currentField.required || false}
              onCheckedChange={(checked) => handleChange('required', checked)}
            />
            <Label htmlFor="field-required">
              {language === 'ar' ? 'حقل مطلوب' : 'Required field'}
            </Label>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label htmlFor="field-icon">
              {language === 'ar' ? 'الأيقونة' : 'Icon'}
            </Label>
            <Select 
              value={currentField.icon || 'none'} 
              onValueChange={(value) => handleChange('icon', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر أيقونة' : 'Select icon'} />
              </SelectTrigger>
              <SelectContent>
                {textFieldIcons.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>
                    <div className="flex items-center gap-2">
                      {icon.icon && <span>{icon.icon}</span>}
                      <span>{icon.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="styling" className="space-y-4">
          {/* Label Color */}
          <div className="space-y-2">
            <Label htmlFor="label-color">
              {language === 'ar' ? 'لون التسمية' : 'Label Color'}
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="label-color"
                type="color"
                value={currentField.style?.labelColor || '#374151'}
                onChange={(e) => handleChange('style.labelColor', e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                type="text"
                value={currentField.style?.labelColor || '#374151'}
                onChange={(e) => handleChange('style.labelColor', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="font-size">
              {language === 'ar' ? 'حجم الخط' : 'Font Size'}
            </Label>
            <Select
              value={currentField.style?.fontSize || '16px'}
              onValueChange={(value) => handleChange('style.fontSize', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12px">12px</SelectItem>
                <SelectItem value="14px">14px</SelectItem>
                <SelectItem value="16px">16px</SelectItem>
                <SelectItem value="18px">18px</SelectItem>
                <SelectItem value="20px">20px</SelectItem>
                <SelectItem value="24px">24px</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Weight */}
          <div className="space-y-2">
            <Label htmlFor="font-weight">
              {language === 'ar' ? 'سمك الخط' : 'Font Weight'}
            </Label>
            <Select
              value={currentField.style?.labelFontWeight || 'normal'}
              onValueChange={(value) => handleChange('style.labelFontWeight', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{language === 'ar' ? 'عادي' : 'Normal'}</SelectItem>
                <SelectItem value="bold">{language === 'ar' ? 'عريض' : 'Bold'}</SelectItem>
                <SelectItem value="lighter">{language === 'ar' ? 'رفيع' : 'Light'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={handleSave}>
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default TextFieldEditor;

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormStyleEditorProps {
  formStyle: any;
  onStyleUpdate: (newStyle: any) => void;
}

const FormStyleEditor: React.FC<FormStyleEditorProps> = ({ formStyle = {}, onStyleUpdate }) => {
  const { language } = useI18n();
  
  const handleStyleChange = (key: string, value: string) => {
    onStyleUpdate({
      ...formStyle,
      [key]: value
    });
  };
  
  const presetColors = [
    '#9b87f5',  // Purple
    '#2563eb',  // Blue
    '#10b981',  // Green
    '#f59e0b',  // Orange
    '#ef4444'   // Red
  ];
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 text-center">
          {language === 'ar' ? 'تخصيص مظهر النموذج' : 'Customize Form Appearance'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="primaryColor">
              {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
            </Label>
            <div className="flex gap-2 items-center mt-1">
              <Input
                type="color"
                id="primaryColor"
                value={formStyle.primaryColor || '#9b87f5'}
                onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                className="w-10 h-10 p-1"
              />
              <Input
                type="text"
                value={formStyle.primaryColor || '#9b87f5'}
                onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 mt-2">
            {presetColors.map(color => (
              <div
                key={color}
                className={cn(
                  "h-8 rounded cursor-pointer transition-all",
                  (formStyle.primaryColor || '#9b87f5') === color ? "ring-2 ring-offset-2" : ""
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleStyleChange('primaryColor', color)}
              />
            ))}
          </div>
          
          <div>
            <Label htmlFor="borderRadius">
              {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
            </Label>
            <Select
              value={formStyle.borderRadius || '0.5rem'}
              onValueChange={(value) => handleStyleChange('borderRadius', value)}
            >
              <SelectTrigger id="borderRadius" className="mt-1">
                <SelectValue placeholder={language === 'ar' ? 'اختر استدارة الحواف' : 'Select border radius'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">
                  {language === 'ar' ? 'بدون استدارة' : 'No radius'}
                </SelectItem>
                <SelectItem value="0.25rem">
                  {language === 'ar' ? 'استدارة خفيفة' : 'Slight radius'}
                </SelectItem>
                <SelectItem value="0.5rem">
                  {language === 'ar' ? 'استدارة متوسطة' : 'Medium radius'}
                </SelectItem>
                <SelectItem value="1rem">
                  {language === 'ar' ? 'استدارة كبيرة' : 'Large radius'}
                </SelectItem>
                <SelectItem value="9999px">
                  {language === 'ar' ? 'دائري' : 'Full radius'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="fontSize">
              {language === 'ar' ? 'حجم الخط' : 'Font Size'}
            </Label>
            <Select
              value={formStyle.fontSize || '1rem'}
              onValueChange={(value) => handleStyleChange('fontSize', value)}
            >
              <SelectTrigger id="fontSize" className="mt-1">
                <SelectValue placeholder={language === 'ar' ? 'اختر حجم الخط' : 'Select font size'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.875rem">
                  {language === 'ar' ? 'صغير' : 'Small'}
                </SelectItem>
                <SelectItem value="1rem">
                  {language === 'ar' ? 'متوسط' : 'Medium'}
                </SelectItem>
                <SelectItem value="1.125rem">
                  {language === 'ar' ? 'كبير' : 'Large'}
                </SelectItem>
                <SelectItem value="1.25rem">
                  {language === 'ar' ? 'كبير جداً' : 'Extra Large'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="buttonStyle">
              {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
            </Label>
            <Select
              value={formStyle.buttonStyle || 'rounded'}
              onValueChange={(value) => handleStyleChange('buttonStyle', value)}
            >
              <SelectTrigger id="buttonStyle" className="mt-1">
                <SelectValue placeholder={language === 'ar' ? 'اختر نمط الأزرار' : 'Select button style'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rounded">
                  {language === 'ar' ? 'مستدير' : 'Rounded'}
                </SelectItem>
                <SelectItem value="square">
                  {language === 'ar' ? 'مربع' : 'Square'}
                </SelectItem>
                <SelectItem value="pill">
                  {language === 'ar' ? 'كبسولي' : 'Pill'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            className="w-full" 
            onClick={() => onStyleUpdate(formStyle)}
          >
            {language === 'ar' ? 'تطبيق التغييرات' : 'Apply Changes'}
          </Button>
        </div>
      </Card>
      
      <div className="text-sm text-gray-500 text-center">
        {language === 'ar' 
          ? 'قم بتخصيص مظهر النموذج باستخدام الخيارات أعلاه. ستظهر التغييرات مباشرة في المعاينة.' 
          : 'Customize your form appearance using the options above. Changes will be reflected in the preview.'}
      </div>
    </div>
  );
};

export default FormStyleEditor;

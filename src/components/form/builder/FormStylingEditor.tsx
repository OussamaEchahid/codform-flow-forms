
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { FormStyle } from '@/hooks/useFormStore';

interface FormStylingEditorProps {
  formStyle: FormStyle;
  onStyleChange: (updates: Partial<FormStyle>) => void;
}

const FormStylingEditor: React.FC<FormStylingEditorProps> = ({ formStyle, onStyleChange }) => {
  const { language } = useI18n();
  
  const handleChange = (property: keyof FormStyle, value: string | boolean) => {
    onStyleChange({ [property]: value });
  };
  
  // Color presets
  const colorPresets = ['#9b87f5', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#000000'];
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className={language === 'ar' ? 'text-right block' : 'block'}>
          {language === 'ar' ? 'لون العناصر الرئيسي' : 'Primary Color'} 
        </Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={formStyle.primaryColor}
            onChange={(e) => handleChange('primaryColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <Input
            value={formStyle.primaryColor}
            onChange={(e) => handleChange('primaryColor', e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {colorPresets.map((color) => (
            <div
              key={color}
              className="w-8 h-8 rounded cursor-pointer border border-gray-300 relative"
              style={{ backgroundColor: color }}
              onClick={() => handleChange('primaryColor', color)}
            >
              {formStyle.primaryColor === color && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {language === 'ar' 
            ? 'هذا اللون يطبق على الأزرار ولون الروابط'
            : 'This color is applied to buttons and accent elements'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'لون خلفية النموذج' : 'Form Background Color'}
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formStyle.backgroundColor || '#F9FAFB'}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <Input
              value={formStyle.backgroundColor || '#F9FAFB'}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {language === 'ar' 
              ? 'لون خلفية النموذج (لا يؤثر على خلفية العنوان)'
              : 'Form background color (does not affect title background)'}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'لون حدود النموذج' : 'Border Color'}
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formStyle.borderColor || '#9b87f5'}
              onChange={(e) => handleChange('borderColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <Input
              value={formStyle.borderColor || '#9b87f5'}
              onChange={(e) => handleChange('borderColor', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'سمك حدود النموذج' : 'Border Width'}
          </Label>
          <Input
            type="text"
            value={formStyle.borderWidth || '2px'}
            onChange={(e) => handleChange('borderWidth', e.target.value)}
            placeholder="2px"
          />
        </div>
        
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'تقويس زوايا النموذج' : 'Border Radius'}
          </Label>
          <Select 
            value={formStyle.borderRadius} 
            onValueChange={(value) => handleChange('borderRadius', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'ar' ? 'اختر حجم التقويس' : 'Select border radius'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">
                {language === 'ar' ? 'بدون تقويس' : 'No Radius'}
              </SelectItem>
              <SelectItem value="0.25rem">
                {language === 'ar' ? 'صغير جداً' : 'Extra Small'}
              </SelectItem>
              <SelectItem value="0.5rem">
                {language === 'ar' ? 'صغير' : 'Small'}
              </SelectItem>
              <SelectItem value="0.75rem">
                {language === 'ar' ? 'متوسط' : 'Medium'}
              </SelectItem>
              <SelectItem value="1rem">
                {language === 'ar' ? 'كبير' : 'Large'}
              </SelectItem>
              <SelectItem value="1.5rem">
                {language === 'ar' ? 'كبير جداً' : 'Extra Large'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'اتجاه النص' : 'Text Direction'}
          </Label>
          <Select 
            value={formStyle.formDirection} 
            onValueChange={(value: 'ltr' | 'rtl') => handleChange('formDirection', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'ar' ? 'اختر اتجاه النص' : 'Select text direction'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ltr">
                {language === 'ar' ? 'من اليسار إلى اليمين' : 'Left to Right (LTR)'}
              </SelectItem>
              <SelectItem value="rtl">
                {language === 'ar' ? 'من اليمين إلى اليسار' : 'Right to Left (RTL)'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'حجم الخط' : 'Font Size'}
          </Label>
          <Select 
            value={formStyle.fontSize} 
            onValueChange={(value) => handleChange('fontSize', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'ar' ? 'اختر حجم الخط' : 'Select font size'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.75rem">
                {language === 'ar' ? 'صغير جداً' : 'Extra Small'}
              </SelectItem>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'التباعد العلوي' : 'Top Padding'}
          </Label>
          <Input
            type="text"
            value={formStyle.paddingTop || '20px'}
            onChange={(e) => handleChange('paddingTop', e.target.value)}
            placeholder="20px"
          />
        </div>
        
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'التباعد السفلي' : 'Bottom Padding'}
          </Label>
          <Input
            type="text"
            value={formStyle.paddingBottom || '20px'}
            onChange={(e) => handleChange('paddingBottom', e.target.value)}
            placeholder="20px"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'التباعد الأيسر' : 'Left Padding'}
          </Label>
          <Input
            type="text"
            value={formStyle.paddingLeft || '20px'}
            onChange={(e) => handleChange('paddingLeft', e.target.value)}
            placeholder="20px"
          />
        </div>
        
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'التباعد الأيمن' : 'Right Padding'}
          </Label>
          <Input
            type="text"
            value={formStyle.paddingRight || '20px'}
            onChange={(e) => handleChange('paddingRight', e.target.value)}
            placeholder="20px"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={language === 'ar' ? 'text-right block' : 'block'}>
            {language === 'ar' ? 'المساحة بين الحقول' : 'Gap Between Fields'}
          </Label>
          <Input
            type="text"
            value={formStyle.formGap || '16px'}
            onChange={(e) => handleChange('formGap', e.target.value)}
            placeholder="16px"
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className={language === 'ar' ? 'text-right' : ''} htmlFor="floating-labels-toggle">
              {language === 'ar' ? 'تسميات عائمة للحقول' : 'Floating Labels'}
            </Label>
            <Switch
              id="floating-labels-toggle"
              checked={formStyle.floatingLabels || false}
              onCheckedChange={(checked) => handleChange('floatingLabels', checked)}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {language === 'ar' 
              ? 'عند التفعيل، تظهر تسميات الحقول كعناصر عائمة فوق الحقول'
              : 'When enabled, field labels appear as floating elements above the inputs'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormStylingEditor;

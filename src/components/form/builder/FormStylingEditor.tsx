
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { FormStyle } from '@/hooks/useFormStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormStylingEditorProps {
  formStyle: FormStyle;
  onStyleChange: (style: Partial<FormStyle>) => void;
}

const FormStylingEditor: React.FC<FormStylingEditorProps> = ({ 
  formStyle, 
  onStyleChange 
}) => {
  const { language } = useI18n();
  
  // Handle numeric slider changes with min/max boundaries
  const handleSliderChange = (
    key: keyof FormStyle, 
    value: number[], 
    min: number, 
    max: number, 
    unit: string = 'px'
  ) => {
    // Ensure value is within bounds
    const boundedValue = Math.max(min, Math.min(max, value[0]));
    onStyleChange({ [key]: `${boundedValue}${unit}` } as Partial<FormStyle>);
  };
  
  // Convert px string to number for slider
  const pxToNumber = (value: string): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', ''), 10) || 0;
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="border-color" className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'لون الحدود' : 'Border Color'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="border-color"
              type="color"
              value={formStyle.borderColor || '#e2e8f0'}
              onChange={(e) => onStyleChange({ borderColor: e.target.value })}
              className="w-12 h-10 p-1"
            />
            <Input
              type="text"
              value={formStyle.borderColor || '#e2e8f0'}
              onChange={(e) => onStyleChange({ borderColor: e.target.value })}
              className="flex-1"
              placeholder="#e2e8f0"
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="border-width" className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'عرض الحدود' : 'Border Width'} 
              <span className="text-sm text-gray-500 ml-2">
                ({pxToNumber(formStyle.borderWidth || '1px')}px)
              </span>
            </Label>
          </div>
          <Slider
            id="border-width"
            min={0}
            max={30}
            step={1}
            value={[pxToNumber(formStyle.borderWidth || '1px')]}
            onValueChange={(value) => handleSliderChange('borderWidth', value, 0, 30)}
            className="py-4"
          />
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="border-radius" className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'استدارة الحدود' : 'Border Radius'} 
              <span className="text-sm text-gray-500 ml-2">
                ({pxToNumber(formStyle.borderRadius || '8px')}px)
              </span>
            </Label>
          </div>
          <Slider
            id="border-radius"
            min={0}
            max={30}
            step={1}
            value={[pxToNumber(formStyle.borderRadius || '8px')]}
            onValueChange={(value) => handleSliderChange('borderRadius', value, 0, 30)}
            className="py-4"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="background-color" className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="background-color"
              type="color"
              value={formStyle.backgroundColor || '#ffffff'}
              onChange={(e) => onStyleChange({ backgroundColor: e.target.value })}
              className="w-12 h-10 p-1"
            />
            <Input
              type="text"
              value={formStyle.backgroundColor || '#ffffff'}
              onChange={(e) => onStyleChange({ backgroundColor: e.target.value })}
              className="flex-1"
              placeholder="#ffffff"
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="padding-top" className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'المسافة العلوية' : 'Padding Top'} 
              <span className="text-sm text-gray-500 ml-2">
                ({pxToNumber(formStyle.paddingTop || '20px')}px)
              </span>
            </Label>
          </div>
          <Slider
            id="padding-top"
            min={0}
            max={50}
            step={1}
            value={[pxToNumber(formStyle.paddingTop || '20px')]}
            onValueChange={(value) => handleSliderChange('paddingTop', value, 0, 50)}
            className="py-4"
          />
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="padding-bottom" className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'المسافة السفلية' : 'Padding Bottom'} 
              <span className="text-sm text-gray-500 ml-2">
                ({pxToNumber(formStyle.paddingBottom || '20px')}px)
              </span>
            </Label>
          </div>
          <Slider
            id="padding-bottom"
            min={0}
            max={50}
            step={1}
            value={[pxToNumber(formStyle.paddingBottom || '20px')]}
            onValueChange={(value) => handleSliderChange('paddingBottom', value, 0, 50)}
            className="py-4"
          />
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="padding-left" className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'المسافة من اليسار' : 'Padding Left'} 
              <span className="text-sm text-gray-500 ml-2">
                ({pxToNumber(formStyle.paddingLeft || '20px')}px)
              </span>
            </Label>
          </div>
          <Slider
            id="padding-left"
            min={0}
            max={50}
            step={1}
            value={[pxToNumber(formStyle.paddingLeft || '20px')]}
            onValueChange={(value) => handleSliderChange('paddingLeft', value, 0, 50)}
            className="py-4"
          />
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="padding-right" className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'المسافة من اليمين' : 'Padding Right'} 
              <span className="text-sm text-gray-500 ml-2">
                ({pxToNumber(formStyle.paddingRight || '20px')}px)
              </span>
            </Label>
          </div>
          <Slider
            id="padding-right"
            min={0}
            max={50}
            step={1}
            value={[pxToNumber(formStyle.paddingRight || '20px')]}
            onValueChange={(value) => handleSliderChange('paddingRight', value, 0, 50)}
            className="py-4"
          />
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="form-gap" className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'المسافة بين الحقول' : 'Form Gap'} 
              <span className="text-sm text-gray-500 ml-2">
                ({pxToNumber(formStyle.formGap || '16px')}px)
              </span>
            </Label>
          </div>
          <Slider
            id="form-gap"
            min={1}
            max={20}
            step={1}
            value={[pxToNumber(formStyle.formGap || '16px')]}
            onValueChange={(value) => handleSliderChange('formGap', value, 1, 20)}
            className="py-4"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="form-direction" className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'اتجاه النموذج' : 'Form Direction'}
          </Label>
          <Select 
            value={formStyle.formDirection || 'ltr'} 
            onValueChange={(value) => onStyleChange({ formDirection: value as 'ltr' | 'rtl' })}
          >
            <SelectTrigger id="form-direction" className="w-full">
              <SelectValue placeholder={language === 'ar' ? 'اختر اتجاه النموذج' : 'Select form direction'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ltr">
                {language === 'ar' ? 'من اليسار إلى اليمين (LTR)' : 'Left to Right (LTR)'}
              </SelectItem>
              <SelectItem value="rtl">
                {language === 'ar' ? 'من اليمين إلى اليسار (RTL)' : 'Right to Left (RTL)'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between py-4">
          <Label htmlFor="floating-labels" className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'تفعيل العناوين العائمة' : 'Floating Labels'}
          </Label>
          <Switch
            id="floating-labels"
            checked={formStyle.floatingLabels || false}
            onCheckedChange={(checked) => onStyleChange({ floatingLabels: checked })}
          />
        </div>
      </div>
    </div>
  );
};

export default FormStylingEditor;

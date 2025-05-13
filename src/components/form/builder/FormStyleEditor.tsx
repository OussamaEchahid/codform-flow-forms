
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface FormStyleEditorProps {
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  onStyleChange: (newStyle: any) => void;
}

const FormStyleEditor: React.FC<FormStyleEditorProps> = ({ 
  formStyle = {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded'
  }, 
  onStyleChange 
}) => {
  const { language } = useI18n();
  
  const handleStyleChange = (key: string, value: string) => {
    const updatedStyle = {
      ...formStyle,
      [key]: value
    };
    onStyleChange(updatedStyle);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'تخصيص مظهر النموذج' : 'Customize Form Appearance'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primary-color" className={language === 'ar' ? 'text-right block' : 'block'}>
              {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
            </Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: formStyle?.primaryColor || '#9b87f5' }}
              />
              <Input
                id="primary-color"
                type="text"
                value={formStyle?.primaryColor || '#9b87f5'}
                onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          
          {/* Border Radius */}
          <div className="space-y-2">
            <Label htmlFor="border-radius" className={language === 'ar' ? 'text-right block' : 'block'}>
              {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
            </Label>
            <Select 
              value={formStyle?.borderRadius || '0.5rem'} 
              onValueChange={(value) => handleStyleChange('borderRadius', value)}
            >
              <SelectTrigger id="border-radius">
                <SelectValue placeholder={language === 'ar' ? 'اختر استدارة الحواف' : 'Select border radius'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">
                  {language === 'ar' ? 'بدون استدارة' : 'No Radius'}
                </SelectItem>
                <SelectItem value="0.25rem">
                  {language === 'ar' ? 'استدارة خفيفة' : 'Slight Radius'}
                </SelectItem>
                <SelectItem value="0.5rem">
                  {language === 'ar' ? 'استدارة متوسطة' : 'Medium Radius'}
                </SelectItem>
                <SelectItem value="1rem">
                  {language === 'ar' ? 'استدارة كبيرة' : 'Large Radius'}
                </SelectItem>
                <SelectItem value="9999px">
                  {language === 'ar' ? 'دائري' : 'Circular'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="font-size" className={language === 'ar' ? 'text-right block' : 'block'}>
              {language === 'ar' ? 'حجم الخط' : 'Font Size'}
            </Label>
            <Select 
              value={formStyle?.fontSize || '1rem'} 
              onValueChange={(value) => handleStyleChange('fontSize', value)}
            >
              <SelectTrigger id="font-size">
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
          
          {/* Button Style */}
          <div className="space-y-2">
            <Label htmlFor="button-style" className={language === 'ar' ? 'text-right block' : 'block'}>
              {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
            </Label>
            <Select 
              value={formStyle?.buttonStyle || 'rounded'} 
              onValueChange={(value) => handleStyleChange('buttonStyle', value)}
            >
              <SelectTrigger id="button-style">
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
          
          {/* Color Presets */}
          <div className="space-y-2">
            <Label className={language === 'ar' ? 'text-right block' : 'block'}>
              {language === 'ar' ? 'ألوان مقترحة' : 'Color Presets'}
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {['#9b87f5', '#2563eb', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                <div
                  key={color}
                  className={cn(
                    "h-8 rounded cursor-pointer transition-all",
                    (formStyle?.primaryColor === color) ? "ring-2 ring-offset-2" : ""
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleStyleChange('primaryColor', color)}
                />
              ))}
            </div>
          </div>
          
          {/* Preview */}
          <div className="space-y-2 mt-6">
            <Label className={language === 'ar' ? 'text-right block' : 'block'}>
              {language === 'ar' ? 'معاينة' : 'Preview'}
            </Label>
            <div className="border rounded-md p-4">
              <div 
                style={{ borderRadius: formStyle?.borderRadius || '0.5rem' }}
                className="p-4 border mb-4"
              >
                <div style={{ fontSize: formStyle?.fontSize || '1rem' }}>
                  {language === 'ar' 
                    ? 'مثال على نص بالحجم المختار' 
                    : 'Example text with selected font size'}
                </div>
              </div>
              
              <button
                style={{
                  backgroundColor: formStyle?.primaryColor || '#9b87f5',
                  borderRadius: formStyle?.buttonStyle === 'rounded' 
                    ? formStyle?.borderRadius || '0.5rem'
                    : formStyle?.buttonStyle === 'pill' 
                      ? '9999px' 
                      : '0',
                  padding: '0.5rem 1rem',
                  color: 'white',
                  border: 'none',
                  width: '100%'
                }}
              >
                {language === 'ar' ? 'زر بالنمط المختار' : 'Button with selected style'}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormStyleEditor;

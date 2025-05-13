
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface FormStyleEditorProps {
  formStyle: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
  };
  onChange: (newStyle: any) => void;
}

const FormStyleEditor: React.FC<FormStyleEditorProps> = ({ formStyle, onChange }) => {
  const { language } = useI18n();
  const presetColors = ['#9b87f5', '#2563eb', '#10b981', '#f59e0b', '#ef4444'];
  
  const handleStyleChange = (key: string, value: string) => {
    onChange({
      ...formStyle,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'تخصيص المظهر' : 'Customize Appearance'}
        </h3>
        
        <div className={`form-group ${language === 'ar' ? 'text-right' : ''}`}>
          <Label htmlFor="primaryColor">
            {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
          </Label>
          <div className="flex items-center gap-3 mt-2">
            <div 
              className="w-10 h-10 rounded border"
              style={{ backgroundColor: formStyle.primaryColor }}
            />
            <Input
              id="primaryColor"
              type="text"
              value={formStyle.primaryColor}
              onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
            />
          </div>
        </div>
        
        <div className={`form-group mt-4 ${language === 'ar' ? 'text-right' : ''}`}>
          <Label htmlFor="borderRadius">
            {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
          </Label>
          <Select
            value={formStyle.borderRadius}
            onValueChange={(value) => handleStyleChange('borderRadius', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder={language === 'ar' ? 'اختر استدارة الحواف' : 'Select border radius'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">
                {language === 'ar' ? 'بدون استدارة' : 'No Radius'}
              </SelectItem>
              <SelectItem value="0.25rem">
                {language === 'ar' ? 'استدارة خفيفة' : 'Small Radius'}
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
        
        <div className={`form-group mt-4 ${language === 'ar' ? 'text-right' : ''}`}>
          <Label htmlFor="fontSize">
            {language === 'ar' ? 'حجم الخط' : 'Font Size'}
          </Label>
          <Select
            value={formStyle.fontSize}
            onValueChange={(value) => handleStyleChange('fontSize', value)}
          >
            <SelectTrigger className="mt-2">
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
        
        <div className={`form-group mt-4 ${language === 'ar' ? 'text-right' : ''}`}>
          <Label htmlFor="buttonStyle">
            {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
          </Label>
          <Select
            value={formStyle.buttonStyle}
            onValueChange={(value) => handleStyleChange('buttonStyle', value)}
          >
            <SelectTrigger className="mt-2">
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
        
        <div className="mt-6">
          <Label className={language === 'ar' ? 'block text-right mb-2' : 'block mb-2'}>
            {language === 'ar' ? 'ألوان مقترحة' : 'Suggested Colors'}
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                className={cn(
                  "h-8 rounded cursor-pointer transition-all",
                  formStyle.primaryColor === color ? "ring-2 ring-offset-2" : ""
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleStyleChange('primaryColor', color)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormStyleEditor;

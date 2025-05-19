
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export interface TitleConfig {
  title: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  descriptionColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontSize: string;
  descriptionFontSize: string;
}

interface FormTitleSectionProps {
  titleConfig: TitleConfig;
  onTitleChange: (config: TitleConfig) => void;
  formPrimaryColor: string;
  borderRadius: string;
}

const FormTitleSection: React.FC<FormTitleSectionProps> = ({
  titleConfig,
  onTitleChange,
  formPrimaryColor,
  borderRadius
}) => {
  const { language } = useI18n();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<TitleConfig>(titleConfig);
  
  // Update local config when props change
  useEffect(() => {
    setLocalConfig(titleConfig);
  }, [titleConfig]);
  
  // Handle input changes
  const handleChange = (field: keyof TitleConfig, value: string) => {
    const updatedConfig = {
      ...localConfig,
      [field]: value
    };
    setLocalConfig(updatedConfig);
    onTitleChange(updatedConfig);
  };
  
  // Toggle alignment buttons
  const handleAlignClick = (alignment: 'left' | 'center' | 'right') => {
    handleChange('textAlign', alignment);
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className={`text-lg ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
          {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
        </CardTitle>
        <Palette size={18} className="text-muted-foreground" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title" className={`block mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
          </Label>
          <Input 
            id="title"
            value={localConfig.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={language === 'ar' ? 'text-right' : ''}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
        
        <div>
          <Label htmlFor="description" className={`block mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
          </Label>
          <Textarea 
            id="description"
            value={localConfig.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={language === 'ar' ? 'text-right' : ''}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            rows={3}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label className={`block mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'محاذاة النص' : 'Text Alignment'}
            </Label>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button
                type="button"
                size="sm"
                variant={localConfig.textAlign === 'left' ? 'default' : 'outline'}
                onClick={() => handleAlignClick('left')}
                title={language === 'ar' ? 'محاذاة لليسار' : 'Align Left'}
              >
                <AlignLeft size={16} />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={localConfig.textAlign === 'center' ? 'default' : 'outline'}
                onClick={() => handleAlignClick('center')}
                title={language === 'ar' ? 'توسيط' : 'Align Center'}
              >
                <AlignCenter size={16} />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={localConfig.textAlign === 'right' ? 'default' : 'outline'}
                onClick={() => handleAlignClick('right')}
                title={language === 'ar' ? 'محاذاة لليمين' : 'Align Right'}
              >
                <AlignRight size={16} />
              </Button>
            </div>
          </div>
          
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="mt-4"
            >
              {language === 'ar' 
                ? (isAdvancedOpen ? 'إخفاء الخيارات المتقدمة' : 'خيارات متقدمة') 
                : (isAdvancedOpen ? 'Hide Advanced' : 'Advanced Options')}
            </Button>
          </div>
        </div>
        
        {isAdvancedOpen && (
          <div className="pt-4 border-t space-y-4">
            <div>
              <Label htmlFor="backgroundColor" className={`block mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
              </Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={localConfig.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer"
                />
                <Input
                  id="backgroundColor"
                  value={localConfig.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="textColor" className={`block mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'لون النص' : 'Text Color'}
              </Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={localConfig.textColor}
                  onChange={(e) => handleChange('textColor', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer"
                />
                <Input
                  id="textColor"
                  value={localConfig.textColor}
                  onChange={(e) => handleChange('textColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="descriptionColor" className={`block mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'لون الوصف' : 'Description Color'}
              </Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={localConfig.descriptionColor}
                  onChange={(e) => handleChange('descriptionColor', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer"
                />
                <Input
                  id="descriptionColor"
                  value={localConfig.descriptionColor}
                  onChange={(e) => handleChange('descriptionColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontSize" className={`block mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'حجم الخط للعنوان' : 'Title Font Size'}
                </Label>
                <select
                  id="fontSize"
                  value={localConfig.fontSize}
                  onChange={(e) => handleChange('fontSize', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="18px">18px - {language === 'ar' ? 'صغير' : 'Small'}</option>
                  <option value="24px">24px - {language === 'ar' ? 'متوسط' : 'Medium'}</option>
                  <option value="32px">32px - {language === 'ar' ? 'كبير' : 'Large'}</option>
                  <option value="40px">40px - {language === 'ar' ? 'كبير جداً' : 'X-Large'}</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="descriptionFontSize" className={`block mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'حجم خط الوصف' : 'Description Font Size'}
                </Label>
                <select
                  id="descriptionFontSize"
                  value={localConfig.descriptionFontSize}
                  onChange={(e) => handleChange('descriptionFontSize', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="12px">12px - {language === 'ar' ? 'صغير' : 'Small'}</option>
                  <option value="14px">14px - {language === 'ar' ? 'متوسط' : 'Medium'}</option>
                  <option value="16px">16px - {language === 'ar' ? 'كبير' : 'Large'}</option>
                  <option value="18px">18px - {language === 'ar' ? 'كبير جداً' : 'X-Large'}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FormTitleSection;

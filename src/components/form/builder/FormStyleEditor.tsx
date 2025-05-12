import React from 'react';
import { FormStyle } from '@/hooks/useFormStore';
import { FloatingButtonConfig } from '@/lib/form-utils';

interface FormStyleEditorProps {
  formStyle: FormStyle;
  onStyleChange: (newStyle: any) => void;
  onSave: () => void;
  floatingButton?: FloatingButtonConfig;
  onFloatingButtonChange?: (config: FloatingButtonConfig) => void;
  showFloatingButtonEditor?: boolean;
}

const FormStyleEditor: React.FC<FormStyleEditorProps> = ({ 
  formStyle, 
  onStyleChange, 
  onSave,
  floatingButton,
  onFloatingButtonChange,
  showFloatingButtonEditor = false 
}) => {
  const { language } = useI18n();
  
  // Update handler to create a new style object
  const handleStyleChange = (key: string, value: string) => {
    const newStyle = {
      ...formStyle,
      [key]: value
    };
    onStyleChange(newStyle);
  };
  
  return (
    <Tabs defaultValue="general">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">
          {language === 'ar' ? 'عام' : 'General'}
        </TabsTrigger>
        <TabsTrigger value="buttons">
          {language === 'ar' ? 'الأزرار' : 'Buttons'}
        </TabsTrigger>
        <TabsTrigger value="advanced">
          {language === 'ar' ? 'متقدم' : 'Advanced'}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="space-y-4 py-4">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="primary-color">
              {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                value={formStyle.primaryColor}
                onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={formStyle.primaryColor}
                onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="border-radius">
              {language === 'ar' ? 'تقويس الحواف' : 'Border Radius'}
            </Label>
            <Select 
              value={formStyle.borderRadius} 
              onValueChange={(value) => handleStyleChange('borderRadius', value)}
            >
              <SelectTrigger id="border-radius">
                <SelectValue placeholder={language === 'ar' ? 'اختر تقويس الحواف' : 'Select border radius'} />
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
          
          <div className="grid gap-2">
            <Label htmlFor="font-size">
              {language === 'ar' ? 'حجم الخط' : 'Font Size'}
            </Label>
            <Select 
              value={formStyle.fontSize} 
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
        </div>
      </TabsContent>
      
      <TabsContent value="buttons" className="space-y-4 py-4">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="button-style">
              {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
            </Label>
            <Select 
              value={formStyle.buttonStyle} 
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
                  {language === 'ar' ? 'كبسولة' : 'Pill'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Only show floating button section if specifically requested */}
        {showFloatingButtonEditor && floatingButton && (
          <>
            <Separator className="my-6" />
            <h3 className="text-lg font-medium mb-4">
              {language === 'ar' ? 'الزر العائم' : 'Floating Button'}
            </h3>
            
            <div className="grid gap-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="enable-floating"
                  checked={floatingButton.enabled}
                  onChange={(e) => onFloatingButtonChange({
                    ...floatingButton,
                    enabled: e.target.checked
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="enable-floating">
                  {language === 'ar' ? 'تفعيل الزر العائم' : 'Enable Floating Button'}
                </Label>
              </div>
              
              <Button 
                variant="secondary" 
                className="mt-4"
                onClick={() => {
                  // Logic to open full floating button editor
                }}
              >
                {language === 'ar' ? 'تخصيص الزر العائم' : 'Customize Floating Button'}
              </Button>
            </div>
          </>
        )}
      </TabsContent>
      
      <TabsContent value="advanced" className="space-y-4 py-4">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="custom-css">
              {language === 'ar' ? 'CSS مخصص' : 'Custom CSS'}
            </Label>
            <textarea
              id="custom-css"
              rows={10}
              className="w-full p-2 border rounded-md"
              placeholder={language === 'ar' ? 'أدخل CSS المخصص هنا...' : 'Enter custom CSS here...'}
            ></textarea>
            <p className="text-sm text-gray-500">
              {language === 'ar' 
                ? 'استخدم CSS المخصص لتخصيص مظهر النموذج بشكل أكبر.' 
                : 'Use custom CSS to further customize the appearance of your form.'}
            </p>
          </div>
          
          <Button onClick={onSave} className="w-full">
            {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default FormStyleEditor;

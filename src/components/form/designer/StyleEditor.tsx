
import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface StyleEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  style: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
  };
  onStyleChange: (style: StyleEditorProps['style']) => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({
  isOpen,
  onOpenChange,
  style,
  onStyleChange
}) => {
  const { language } = useI18n();
  const [localStyle, setLocalStyle] = React.useState({...style});
  
  React.useEffect(() => {
    setLocalStyle({...style});
  }, [style, isOpen]);
  
  const handleChange = (key: keyof typeof style, value: string) => {
    setLocalStyle(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSave = () => {
    onStyleChange(localStyle);
    onOpenChange(false);
  };
  
  const colorPresets = ['#9b87f5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تخصيص مظهر النموذج' : 'Customize Form Appearance'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="colors">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="colors">
              {language === 'ar' ? 'الألوان' : 'Colors'}
            </TabsTrigger>
            <TabsTrigger value="typography">
              {language === 'ar' ? 'الخطوط' : 'Typography'}
            </TabsTrigger>
            <TabsTrigger value="layout">
              {language === 'ar' ? 'التخطيط' : 'Layout'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="space-y-4">
            <div className="form-group">
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={localStyle.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={localStyle.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mt-4">
              {colorPresets.map((color) => (
                <div
                  key={color}
                  className={cn(
                    "h-8 rounded cursor-pointer transition-all",
                    localStyle.primaryColor === color ? "ring-2 ring-offset-2" : ""
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange('primaryColor', color)}
                />
              ))}
            </div>
            
            <div className="p-4 border rounded-md mt-4">
              <h4 className="font-medium mb-2">
                {language === 'ar' ? 'معاينة' : 'Preview'}
              </h4>
              <div className="flex flex-col gap-4">
                <div 
                  className="h-10 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: localStyle.primaryColor }}
                >
                  {language === 'ar' ? 'زر' : 'Button'}
                </div>
                <div className="h-6 w-24 rounded" style={{ backgroundColor: localStyle.primaryColor }} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="typography" className="space-y-4">
            <div className="form-group">
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'حجم الخط' : 'Font Size'}
              </label>
              <select
                className="w-full p-2 border rounded"
                value={localStyle.fontSize}
                onChange={(e) => handleChange('fontSize', e.target.value)}
              >
                <option value="0.875rem">{language === 'ar' ? 'صغير' : 'Small'} (14px)</option>
                <option value="1rem">{language === 'ar' ? 'متوسط' : 'Medium'} (16px)</option>
                <option value="1.125rem">{language === 'ar' ? 'كبير' : 'Large'} (18px)</option>
                <option value="1.25rem">{language === 'ar' ? 'كبير جداً' : 'Extra Large'} (20px)</option>
              </select>
            </div>
            
            <div className="p-4 border rounded-md">
              <h4 className="font-medium mb-2">
                {language === 'ar' ? 'معاينة' : 'Preview'}
              </h4>
              <div className="space-y-2">
                <div className="border-b pb-1 font-medium" style={{ fontSize: localStyle.fontSize }}>
                  {language === 'ar' ? 'عنوان الحقل' : 'Field Label'}
                </div>
                <div className="border rounded p-2" style={{ fontSize: localStyle.fontSize }}>
                  {language === 'ar' ? 'قيمة الحقل' : 'Field Value'}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="layout" className="space-y-4">
            <div className="form-group">
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'شكل الحواف' : 'Border Radius'}
              </label>
              <select
                className="w-full p-2 border rounded"
                value={localStyle.borderRadius}
                onChange={(e) => handleChange('borderRadius', e.target.value)}
              >
                <option value="0">{language === 'ar' ? 'بدون انحناء' : 'No Radius'} (0px)</option>
                <option value="0.25rem">{language === 'ar' ? 'صغير' : 'Small'} (4px)</option>
                <option value="0.5rem">{language === 'ar' ? 'متوسط' : 'Medium'} (8px)</option>
                <option value="0.75rem">{language === 'ar' ? 'كبير' : 'Large'} (12px)</option>
                <option value="1rem">{language === 'ar' ? 'كبير جداً' : 'Extra Large'} (16px)</option>
                <option value="9999px">{language === 'ar' ? 'دائري' : 'Pill'}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
              </label>
              <select
                className="w-full p-2 border rounded"
                value={localStyle.buttonStyle}
                onChange={(e) => handleChange('buttonStyle', e.target.value)}
              >
                <option value="rounded">{language === 'ar' ? 'منحني' : 'Rounded'}</option>
                <option value="square">{language === 'ar' ? 'مربع' : 'Square'}</option>
                <option value="pill">{language === 'ar' ? 'كبسولة' : 'Pill'}</option>
              </select>
            </div>
            
            <div className="p-4 border rounded-md">
              <h4 className="font-medium mb-2">
                {language === 'ar' ? 'معاينة' : 'Preview'}
              </h4>
              <div className="space-y-4">
                <div 
                  className="border p-2"
                  style={{ borderRadius: localStyle.borderRadius }}
                >
                  {language === 'ar' ? 'حقل نموذجي' : 'Sample field'}
                </div>
                <div 
                  className="text-white text-center p-2"
                  style={{ 
                    backgroundColor: localStyle.primaryColor,
                    borderRadius: localStyle.buttonStyle === 'pill' 
                      ? '9999px' 
                      : localStyle.buttonStyle === 'square' 
                        ? '0' 
                        : localStyle.borderRadius
                  }}
                >
                  {language === 'ar' ? 'زر' : 'Button'}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={handleSave}>
            {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StyleEditor;

import React, { useState, useEffect } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { X, Save, AlignLeft, AlignCenter, AlignRight, Type, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

interface FormTitleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  style: any;
  onSave: (title: string, description: string, style: any) => void;
  primaryColor: string;
  borderRadius: string;
  updateGlobalStyle?: (key: string, value: string) => void;
}

const FormTitleEditor: React.FC<FormTitleEditorProps> = ({
  isOpen,
  onClose,
  title,
  description,
  style: initialStyle,
  onSave,
  primaryColor,
  borderRadius,
  updateGlobalStyle
}) => {
  const { language } = useI18n();
  const { toast } = useToast();
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentDescription, setCurrentDescription] = useState(description);
  const [style, setStyle] = useState({
    backgroundColor: initialStyle?.backgroundColor || primaryColor,
    color: initialStyle?.color || "#ffffff",
    textAlign: initialStyle?.textAlign || (language === 'ar' ? 'right' : 'center'),
    fontSize: initialStyle?.fontSize || "24px",
    fontWeight: initialStyle?.fontWeight || "bold",
    descriptionColor: initialStyle?.descriptionColor || "rgba(255, 255, 255, 0.9)",
    descriptionFontSize: initialStyle?.descriptionFontSize || "14px",
    borderRadius: initialStyle?.borderRadius || borderRadius,
    paddingY: initialStyle?.paddingY || "16px",
    showTitle: initialStyle?.showTitle !== false, // Default to true if not explicitly set to false
    showDescription: initialStyle?.showDescription !== false, // Default to true if not explicitly set to false
  });

  // Update local state when external props change
  useEffect(() => {
    setCurrentTitle(title);
    setCurrentDescription(description);
    setStyle({
      backgroundColor: initialStyle?.backgroundColor || primaryColor,
      color: initialStyle?.color || "#ffffff",
      textAlign: initialStyle?.textAlign || (language === 'ar' ? 'right' : 'center'),
      fontSize: initialStyle?.fontSize || "24px",
      fontWeight: initialStyle?.fontWeight || "bold",
      descriptionColor: initialStyle?.descriptionColor || "rgba(255, 255, 255, 0.9)",
      descriptionFontSize: initialStyle?.descriptionFontSize || "14px",
      borderRadius: initialStyle?.borderRadius || borderRadius,
      paddingY: initialStyle?.paddingY || "16px",
      showTitle: initialStyle?.showTitle !== false,
      showDescription: initialStyle?.showDescription !== false,
    });
  }, [initialStyle, primaryColor, borderRadius, title, description, language]);

  const handleStyleChange = (property: string, value: string | boolean) => {
    const newStyle = {
      ...style,
      [property]: value
    };
    setStyle(newStyle);
    
    // IMPORTANT CHANGE: Don't update global backgroundColor from title editor
    // This prevents title's backgroundColor from affecting the entire form
    // We still update primaryColor to keep other elements in sync
    if (property === 'backgroundColor' && updateGlobalStyle && typeof value === 'string') {
      updateGlobalStyle('primaryColor', value);
    }
  };

  const handleSave = () => {
    const updatedStyle = { ...style };
    
    // Save the field-specific style and title/description
    onSave(currentTitle, currentDescription, updatedStyle);
    
    // IMPORTANT CHANGE: Don't update global backgroundColor from title editor
    // Only update primaryColor to keep buttons and other elements in sync
    if (updateGlobalStyle && style.backgroundColor) {
      updateGlobalStyle('primaryColor', style.backgroundColor);
    }
    
    toast({
      description: language === 'ar' 
        ? "تم حفظ إعدادات العنوان بنجاح" 
        : "Title settings saved successfully",
      duration: 3000,
    });
    
    onClose();
  };

  // Common color presets
  const colorPresets = ['#9b87f5', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#000000', '#ff3b30', '#ff9500', '#34c759'];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'تحرير عنوان النموذج' : 'Edit Form Title'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="content" className="mt-4 w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">
              {language === 'ar' ? 'المحتوى' : 'Content'}
            </TabsTrigger>
            <TabsTrigger value="style">
              {language === 'ar' ? 'المظهر' : 'Style'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="show-title" 
                checked={style.showTitle} 
                onCheckedChange={(checked) => handleStyleChange('showTitle', !!checked)}
              />
              <Label 
                htmlFor="show-title" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {language === 'ar' ? 'إظهار العنوان' : 'Show title'}
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title" className={language === 'ar' ? 'text-right block' : 'block'}>
                {language === 'ar' ? 'العنوان' : 'Title'}
              </Label>
              <Input
                id="title"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                disabled={!style.showTitle}
              />
            </div>
            
            <div className="flex items-center space-x-2 mt-6 mb-4">
              <Checkbox 
                id="show-description" 
                checked={style.showDescription} 
                onCheckedChange={(checked) => handleStyleChange('showDescription', !!checked)}
              />
              <Label 
                htmlFor="show-description" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {language === 'ar' ? 'إظهار الوصف' : 'Show description'}
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className={language === 'ar' ? 'text-right block' : 'block'}>
                {language === 'ar' ? 'الوصف' : 'Description'}
              </Label>
              <Textarea
                id="description"
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                rows={3}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                disabled={!style.showDescription}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className={language === 'ar' ? 'text-right block' : 'block'}>
                {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.backgroundColor}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={style.backgroundColor}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {colorPresets.map((color) => (
                  <div
                    key={color}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-300 relative"
                    style={{ backgroundColor: color }}
                    onClick={() => handleStyleChange('backgroundColor', color)}
                  >
                    {style.backgroundColor === color && (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                {language === 'ar' 
                  ? 'هذا اللون يؤثر فقط على خلفية العنوان وليس النموذج بأكمله'
                  : 'This color affects only the title background, not the entire form'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right block' : 'block'}>
                  {language === 'ar' ? 'لون النص' : 'Text Color'}
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.color}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <Input
                    value={style.color}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right block' : 'block'}>
                  {language === 'ar' ? 'محاذاة النص' : 'Text Alignment'}
                </Label>
                <div className="flex items-center gap-2 border rounded-md p-1">
                  <Button
                    type="button"
                    variant={style.textAlign === 'left' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStyleChange('textAlign', 'left')}
                  >
                    <AlignLeft size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant={style.textAlign === 'center' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStyleChange('textAlign', 'center')}
                  >
                    <AlignCenter size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant={style.textAlign === 'right' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStyleChange('textAlign', 'right')}
                  >
                    <AlignRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right block' : 'block'}>
                  {language === 'ar' ? 'حجم الخط' : 'Font Size'}
                </Label>
                <Input
                  type="text"
                  value={style.fontSize}
                  onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right block' : 'block'}>
                  {language === 'ar' ? 'وزن الخط' : 'Font Weight'}
                </Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={style.fontWeight}
                  onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="800">Extra-Bold (800)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right block' : 'block'}>
                  {language === 'ar' ? 'لون وصف النموذج' : 'Description Color'}
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.descriptionColor}
                    onChange={(e) => handleStyleChange('descriptionColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <Input
                    value={style.descriptionColor}
                    onChange={(e) => handleStyleChange('descriptionColor', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right block' : 'block'}>
                  {language === 'ar' ? 'حجم خط الوصف' : 'Description Font Size'}
                </Label>
                <Input
                  type="text"
                  value={style.descriptionFontSize}
                  onChange={(e) => handleStyleChange('descriptionFontSize', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right block' : 'block'}>
                  {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
                </Label>
                <Input
                  type="text"
                  value={style.borderRadius}
                  onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right block' : 'block'}>
                  {language === 'ar' ? 'التباعد العمودي' : 'Vertical Padding'}
                </Label>
                <Input
                  type="text"
                  value={style.paddingY}
                  onChange={(e) => handleStyleChange('paddingY', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="pt-4 mt-4 border-t">
          <div 
            className="p-4 rounded"
            style={{
              backgroundColor: style.backgroundColor,
              borderRadius: style.borderRadius,
              textAlign: style.textAlign as any
            }}
          >
            {style.showTitle && (
              <h3 style={{ color: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight as any, margin: 0 }}>
                {currentTitle || (language === 'ar' ? 'عنوان النموذج' : 'Form Title')}
              </h3>
            )}
            {style.showDescription && currentDescription && (
              <p style={{ color: style.descriptionColor, fontSize: style.descriptionFontSize, margin: '8px 0 0 0' }}>
                {currentDescription}
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="button" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormTitleEditor;

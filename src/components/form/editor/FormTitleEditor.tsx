
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export interface FormTitleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  style: {
    backgroundColor?: string;
    color?: string;
    textAlign?: 'left' | 'right' | 'center';
    fontWeight?: string;
    fontSize?: string;
    descriptionColor?: string;
    descriptionFontSize?: string;
    showTitle?: boolean;
    showDescription?: boolean;
    borderRadius?: string;
    paddingY?: string;
    fontFamily?: string;
  };
  onSave: (title: string, description: string, style: any) => void;
  primaryColor: string;
  borderRadius?: string;
  updateGlobalStyle?: (key: string, value: string) => void; // Add this prop for global style updates
}

const FormTitleEditor: React.FC<FormTitleEditorProps> = ({
  isOpen,
  onClose,
  title,
  description,
  style,
  onSave,
  primaryColor,
  borderRadius,
  updateGlobalStyle
}) => {
  const { language } = useI18n();
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description);
  const [localStyle, setLocalStyle] = useState({ ...style });
  const [syncWithGlobal, setSyncWithGlobal] = useState(false);
  
  const handleBackgroundColorChange = (color: string) => {
    setLocalStyle({ ...localStyle, backgroundColor: color });
    
    // Only update global primary color if sync is enabled
    if (syncWithGlobal && updateGlobalStyle) {
      updateGlobalStyle('primaryColor', color);
    }
  };
  
  const handleStyleChange = (key: string, value: any) => {
    // For boolean values like showTitle, we need to handle them differently
    if (typeof value === 'boolean') {
      setLocalStyle({
        ...localStyle,
        [key]: value
      });
    } else {
      setLocalStyle({
        ...localStyle,
        [key]: value
      });
    }
  };
  
  const handleSaveClick = () => {
    // Create a deep copy of the style to prevent reference issues
    const styleCopy = JSON.parse(JSON.stringify(localStyle));
    
    // Ensure backgroundColor is explicitly set
    if (!styleCopy.backgroundColor) {
      styleCopy.backgroundColor = primaryColor;
    }
    
    // CRITICAL: Always explicitly mark this style as title-specific
    // This flag will be used across components to prevent affecting form background
    styleCopy._titleStyleOnly = true;
    
    console.log('Saving form title with style:', styleCopy);
    
    // Alert user about title-only changes
    toast.success(
      language === 'ar' 
        ? 'تم حفظ إعدادات العنوان بنجاح. هذه الإعدادات تؤثر فقط على العنوان وليس النموذج بالكامل.'
        : 'Title settings saved successfully. These settings only affect the title, not the entire form.'
    );
    
    onSave(localTitle, localDescription, styleCopy);
  };
  
  // Ensure we always have some default values
  const effectiveStyle = {
    backgroundColor: localStyle.backgroundColor || primaryColor || '#9b87f5',
    color: localStyle.color || '#ffffff',
    textAlign: localStyle.textAlign || (language === 'ar' ? 'right' : 'center'),
    fontSize: localStyle.fontSize || '24px',
    fontWeight: localStyle.fontWeight || 'bold',
    descriptionColor: localStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize: localStyle.descriptionFontSize || '16px',
    showTitle: localStyle.showTitle !== undefined ? localStyle.showTitle : true,
    showDescription: localStyle.showDescription !== undefined ? localStyle.showDescription : true,
    borderRadius: localStyle.borderRadius || borderRadius || '8px',
    paddingY: localStyle.paddingY || '16px',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'تعديل عنوان النموذج' : 'Edit Form Title'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="content" className="w-full">
          <TabsList>
            <TabsTrigger value="content">{language === 'ar' ? 'المحتوى' : 'Content'}</TabsTrigger>
            <TabsTrigger value="style">{language === 'ar' ? 'التصميم' : 'Style'}</TabsTrigger>
            <TabsTrigger value="visibility">{language === 'ar' ? 'الظهور' : 'Visibility'}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className={`flex flex-col space-y-1.5 ${language === 'ar' ? 'text-right' : ''}`}>
                <Label htmlFor="title" className="mb-1">
                  {language === 'ar' ? 'العنوان' : 'Title'}
                </Label>
                <Input 
                  id="title" 
                  value={localTitle} 
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className={`flex flex-col space-y-1.5 ${language === 'ar' ? 'text-right' : ''}`}>
                <Label htmlFor="description" className="mb-1">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </Label>
                <Textarea 
                  id="description" 
                  value={localDescription} 
                  onChange={(e) => setLocalDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل وصفاً للنموذج (اختياري)' : 'Enter form description (optional)'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className={`text-lg font-medium mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                {language === 'ar' ? 'معاينة' : 'Preview'}
              </h3>
              <div 
                className="rounded p-4" 
                style={{
                  backgroundColor: effectiveStyle.backgroundColor,
                  borderRadius: effectiveStyle.borderRadius,
                  textAlign: effectiveStyle.textAlign as 'left' | 'right' | 'center',
                  padding: `${effectiveStyle.paddingY} 16px`,
                  direction: language === 'ar' ? 'rtl' : 'ltr'
                }}
              >
                {effectiveStyle.showTitle && (
                  <h3 style={{ 
                    color: effectiveStyle.color,
                    fontSize: effectiveStyle.fontSize,
                    fontWeight: effectiveStyle.fontWeight as any,
                    margin: 0
                  }}>
                    {localTitle || (language === 'ar' ? 'عنوان النموذج' : 'Form Title')}
                  </h3>
                )}
                
                {effectiveStyle.showDescription && localDescription && (
                  <p style={{ 
                    color: effectiveStyle.descriptionColor,
                    fontSize: effectiveStyle.descriptionFontSize,
                    margin: '8px 0 0 0'
                  }}>
                    {localDescription}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="style" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className={`flex flex-col space-y-1.5 ${language === 'ar' ? 'text-right' : ''}`}>
                <Label htmlFor="backgroundColor" className="mb-1 font-bold text-amber-700">
                  {language === 'ar' ? 'لون خلفية العنوان فقط' : 'Title Background Color Only'}
                </Label>
                <div className="flex gap-2">
                  <div 
                    className="w-10 h-10 rounded border cursor-pointer" 
                    style={{ backgroundColor: localStyle.backgroundColor || primaryColor }}
                    onClick={() => document.getElementById('colorPicker')?.click()}
                  />
                  <Input 
                    id="backgroundColor" 
                    value={localStyle.backgroundColor || primaryColor} 
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="flex-1"
                  />
                  <input 
                    type="color" 
                    id="colorPicker"
                    value={localStyle.backgroundColor || primaryColor} 
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="hidden"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    id="syncWithGlobal"
                    checked={syncWithGlobal}
                    onCheckedChange={setSyncWithGlobal}
                  />
                  <Label htmlFor="syncWithGlobal" className="text-xs text-gray-600">
                    {language === 'ar' 
                      ? 'استخدام هذا اللون أيضًا كلون أساسي للنموذج'
                      : 'Also use this color as form primary color'}
                  </Label>
                </div>
                <p className="text-xs text-amber-600 mt-1 font-bold">
                  {language === 'ar' 
                    ? 'هذا اللون يؤثر على لون خلفية العنوان فقط وليس النموذج بأكمله'
                    : 'This color affects ONLY the title background, NOT the entire form'}
                </p>
              </div>
              
              <div className={`flex flex-col space-y-1.5 ${language === 'ar' ? 'text-right' : ''}`}>
                <Label htmlFor="textAlign" className="mb-1">
                  {language === 'ar' ? 'محاذاة النص' : 'Text Alignment'}
                </Label>
                <Select 
                  value={localStyle.textAlign || (language === 'ar' ? 'right' : 'center')} 
                  onValueChange={(value) => handleStyleChange('textAlign', value)}
                >
                  <SelectTrigger id="textAlign">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">{language === 'ar' ? 'يسار' : 'Left'}</SelectItem>
                    <SelectItem value="center">{language === 'ar' ? 'وسط' : 'Center'}</SelectItem>
                    <SelectItem value="right">{language === 'ar' ? 'يمين' : 'Right'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className={`flex flex-col space-y-1.5 ${language === 'ar' ? 'text-right' : ''}`}>
                <Label htmlFor="titleColor" className="mb-1">
                  {language === 'ar' ? 'لون العنوان' : 'Title Color'}
                </Label>
                <div className="flex gap-2">
                  <div 
                    className="w-10 h-10 rounded border cursor-pointer" 
                    style={{ backgroundColor: localStyle.color || '#ffffff' }}
                    onClick={() => document.getElementById('titleColorPicker')?.click()}
                  />
                  <Input 
                    id="titleColor" 
                    value={localStyle.color || '#ffffff'} 
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="flex-1"
                  />
                  <input 
                    type="color" 
                    id="titleColorPicker"
                    value={localStyle.color || '#ffffff'} 
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className={`flex flex-col space-y-1.5 ${language === 'ar' ? 'text-right' : ''}`}>
                <Label htmlFor="fontSize" className="mb-1">
                  {language === 'ar' ? 'حجم خط العنوان' : 'Title Font Size'}
                </Label>
                <Select 
                  value={localStyle.fontSize || '24px'} 
                  onValueChange={(value) => handleStyleChange('fontSize', value)}
                >
                  <SelectTrigger id="fontSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16px">{language === 'ar' ? 'صغير' : 'Small'}</SelectItem>
                    <SelectItem value="20px">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                    <SelectItem value="24px">{language === 'ar' ? 'كبير' : 'Large'}</SelectItem>
                    <SelectItem value="28px">{language === 'ar' ? 'كبير جداً' : 'Extra Large'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className={`flex flex-col space-y-1.5 ${language === 'ar' ? 'text-right' : ''}`}>
                <Label htmlFor="fontWeight" className="mb-1">
                  {language === 'ar' ? 'سمك الخط' : 'Font Weight'}
                </Label>
                <Select 
                  value={localStyle.fontWeight || 'bold'} 
                  onValueChange={(value) => handleStyleChange('fontWeight', value)}
                >
                  <SelectTrigger id="fontWeight">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">{language === 'ar' ? 'عادي' : 'Normal'}</SelectItem>
                    <SelectItem value="bold">{language === 'ar' ? 'غامق' : 'Bold'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className={`flex flex-col space-y-1.5 ${language === 'ar' ? 'text-right' : ''}`}>
                <Label htmlFor="borderRadius" className="mb-1">
                  {language === 'ar' ? 'استدارة الزوايا' : 'Border Radius'}
                </Label>
                <Select 
                  value={localStyle.borderRadius || borderRadius || '8px'} 
                  onValueChange={(value) => handleStyleChange('borderRadius', value)}
                >
                  <SelectTrigger id="borderRadius">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{language === 'ar' ? 'بدون استدارة' : 'No Radius'}</SelectItem>
                    <SelectItem value="4px">{language === 'ar' ? 'استدارة صغيرة' : 'Small'}</SelectItem>
                    <SelectItem value="8px">{language === 'ar' ? 'استدارة متوسطة' : 'Medium'}</SelectItem>
                    <SelectItem value="16px">{language === 'ar' ? 'استدارة كبيرة' : 'Large'}</SelectItem>
                    <SelectItem value="24px">{language === 'ar' ? 'استدارة كبيرة جداً' : 'Extra Large'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className={`flex flex-col space-y-1.5 ${language === 'ar' ? 'text-right' : ''}`}>
                <Label htmlFor="paddingY" className="mb-1">
                  {language === 'ar' ? 'المساحة الداخلية' : 'Padding'}
                </Label>
                <Select 
                  value={localStyle.paddingY || '16px'} 
                  onValueChange={(value) => handleStyleChange('paddingY', value)}
                >
                  <SelectTrigger id="paddingY">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8px">{language === 'ar' ? 'صغيرة' : 'Small'}</SelectItem>
                    <SelectItem value="16px">{language === 'ar' ? 'متوسطة' : 'Medium'}</SelectItem>
                    <SelectItem value="24px">{language === 'ar' ? 'كبيرة' : 'Large'}</SelectItem>
                    <SelectItem value="32px">{language === 'ar' ? 'كبيرة جداً' : 'Extra Large'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="visibility" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Label htmlFor="showTitle">
                  {language === 'ar' ? 'إظهار العنوان' : 'Show Title'}
                </Label>
                <Switch 
                  id="showTitle" 
                  checked={effectiveStyle.showTitle} 
                  onCheckedChange={(checked) => handleStyleChange('showTitle', checked)}
                />
              </div>
              
              <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Label htmlFor="showDescription">
                  {language === 'ar' ? 'إظهار الوصف' : 'Show Description'}
                </Label>
                <Switch 
                  id="showDescription" 
                  checked={effectiveStyle.showDescription} 
                  onCheckedChange={(checked) => handleStyleChange('showDescription', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className={language === 'ar' ? 'justify-start' : ''}>
          <Button variant="outline" onClick={onClose} className="ml-2">
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSaveClick} className="bg-amber-600 hover:bg-amber-700">
            {language === 'ar' ? 'حفظ إعدادات العنوان فقط' : 'Save Title Settings Only'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormTitleEditor;

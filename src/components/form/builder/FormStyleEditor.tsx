
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormStyle } from '@/hooks/useFormStore';

interface FormStyleEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formStyle: FormStyle;
  onStyleChange: (key: string, value: string) => void;
  onSave: () => void;
}

const FormStyleEditor: React.FC<FormStyleEditorProps> = ({
  isOpen,
  onOpenChange,
  formStyle,
  onStyleChange,
  onSave
}) => {
  const { language } = useI18n();
  const isRTL = language === 'ar';
  
  const handleRTLChange = (checked: boolean) => {
    onStyleChange('direction', checked ? 'rtl' : 'ltr');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>
          {isRTL ? 'تخصيص مظهر النموذج' : 'Customize Form Style'}
        </DialogTitle>
        <DialogDescription>
          {isRTL ? 'قم بتخصيص مظهر النموذج لتناسب هويتك التجارية. هذه الإعدادات خاصة بهذا النموذج فقط.' : 'Customize the form appearance to match your brand identity. These settings apply to this form only.'}
        </DialogDescription>
        
        <Tabs defaultValue="colors">
          <TabsList className="w-full">
            <TabsTrigger value="colors">{isRTL ? 'الألوان' : 'Colors'}</TabsTrigger>
            <TabsTrigger value="layout">{isRTL ? 'التخطيط' : 'Layout'}</TabsTrigger>
            <TabsTrigger value="animation">{isRTL ? 'الحركة' : 'Animation'}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="primary-color" className="text-sm font-medium">
                {isRTL ? 'اللون الرئيسي' : 'Primary Color'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="primary-color"
                  type="color"
                  value={formStyle.primaryColor}
                  onChange={(e) => onStyleChange('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded"
                />
                <input
                  type="text"
                  value={formStyle.primaryColor}
                  onChange={(e) => onStyleChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="border-color" className="text-sm font-medium">
                {isRTL ? 'لون الحدود' : 'Border Color'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="border-color"
                  type="color"
                  value={formStyle.borderColor || '#e2e8f0'}
                  onChange={(e) => onStyleChange('borderColor', e.target.value)}
                  className="w-10 h-10 rounded"
                />
                <input
                  type="text"
                  value={formStyle.borderColor || '#e2e8f0'}
                  onChange={(e) => onStyleChange('borderColor', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="background-color" className="text-sm font-medium">
                {isRTL ? 'لون الخلفية' : 'Background Color'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="background-color"
                  type="color"
                  value={formStyle.backgroundColor || '#ffffff'}
                  onChange={(e) => onStyleChange('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded"
                />
                <input
                  type="text"
                  value={formStyle.backgroundColor || '#ffffff'}
                  onChange={(e) => onStyleChange('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2 mt-4">
              {['#9b87f5', '#2563eb', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                <div
                  key={color}
                  className={`h-8 rounded cursor-pointer transition-all ${formStyle.primaryColor === color ? 'ring-2 ring-offset-2' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onStyleChange('primaryColor', color)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="layout" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="border-radius" className="text-sm font-medium">
                  {isRTL ? 'استدارة الحواف' : 'Border Radius'}
                </label>
                <select
                  id="border-radius"
                  value={formStyle.borderRadius}
                  onChange={(e) => onStyleChange('borderRadius', e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="0">None</option>
                  <option value="0.25rem">Small</option>
                  <option value="0.5rem">Medium</option>
                  <option value="1rem">Large</option>
                  <option value="9999px">Round</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="border-width" className="text-sm font-medium">
                  {isRTL ? 'عرض الحدود' : 'Border Width'}
                </label>
                <select
                  id="border-width"
                  value={formStyle.borderWidth || '1px'}
                  onChange={(e) => onStyleChange('borderWidth', e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="0px">None</option>
                  <option value="1px">Thin</option>
                  <option value="2px">Medium</option>
                  <option value="3px">Thick</option>
                  <option value="4px">Extra Thick</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="element-gap" className="text-sm font-medium">
                  {isRTL ? 'الفجوة بين العناصر' : 'Element Gap'}
                </label>
                <select
                  id="element-gap"
                  value={formStyle.elementGap || '1rem'}
                  onChange={(e) => onStyleChange('elementGap', e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="0.5rem">Small</option>
                  <option value="1rem">Medium</option>
                  <option value="1.5rem">Large</option>
                  <option value="2rem">Extra Large</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="font-size" className="text-sm font-medium">
                  {isRTL ? 'حجم الخط' : 'Font Size'}
                </label>
                <select
                  id="font-size"
                  value={formStyle.fontSize}
                  onChange={(e) => onStyleChange('fontSize', e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="0.875rem">Small</option>
                  <option value="1rem">Medium</option>
                  <option value="1.125rem">Large</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="padding-top" className="text-sm font-medium">
                  {isRTL ? 'الحشوة العلوية' : 'Top Padding'}
                </label>
                <select
                  id="padding-top"
                  value={formStyle.paddingTop || '1rem'}
                  onChange={(e) => onStyleChange('paddingTop', e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="0.5rem">Small</option>
                  <option value="1rem">Medium</option>
                  <option value="1.5rem">Large</option>
                  <option value="2rem">Extra Large</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="padding-bottom" className="text-sm font-medium">
                  {isRTL ? 'الحشوة السفلية' : 'Bottom Padding'}
                </label>
                <select
                  id="padding-bottom"
                  value={formStyle.paddingBottom || '1rem'}
                  onChange={(e) => onStyleChange('paddingBottom', e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="0.5rem">Small</option>
                  <option value="1rem">Medium</option>
                  <option value="1.5rem">Large</option>
                  <option value="2rem">Extra Large</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="padding-left" className="text-sm font-medium">
                  {isRTL ? 'الحشوة اليسرى' : 'Left Padding'}
                </label>
                <select
                  id="padding-left"
                  value={formStyle.paddingLeft || '1rem'}
                  onChange={(e) => onStyleChange('paddingLeft', e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="0.5rem">Small</option>
                  <option value="1rem">Medium</option>
                  <option value="1.5rem">Large</option>
                  <option value="2rem">Extra Large</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="padding-right" className="text-sm font-medium">
                  {isRTL ? 'الحشوة اليمنى' : 'Right Padding'}
                </label>
                <select
                  id="padding-right"
                  value={formStyle.paddingRight || '1rem'}
                  onChange={(e) => onStyleChange('paddingRight', e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="0.5rem">Small</option>
                  <option value="1rem">Medium</option>
                  <option value="1.5rem">Large</option>
                  <option value="2rem">Extra Large</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox 
                id="rtl-direction" 
                checked={formStyle.direction === 'rtl'} 
                onCheckedChange={handleRTLChange}
              />
              <label htmlFor="rtl-direction" className="text-sm font-medium">
                {isRTL ? 'اتجاه من اليمين إلى اليسار (RTL)' : 'Right to Left Direction (RTL)'}
              </label>
            </div>
          </TabsContent>
          
          <TabsContent value="animation" className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="button-style" className="text-sm font-medium">
                {isRTL ? 'نمط الأزرار' : 'Button Style'}
              </label>
              <select
                id="button-style"
                value={formStyle.buttonStyle}
                onChange={(e) => onStyleChange('buttonStyle', e.target.value)}
                className="px-3 py-2 border rounded"
              >
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
                <option value="pill">Pill</option>
              </select>
            </div>

            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-medium mb-3">
                {isRTL ? 'تأثيرات الرسوم المتحركة للزر' : 'Button Animation Effects'}
              </h3>
              <AnimationSection 
                field={{ style: { animation: formStyle.buttonStyle ? true : false, animationType: 'pulse' } }} 
                onChange={() => {}} 
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={onSave}>
            {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AnimationSectionProps {
  field: {
    style?: {
      animation?: boolean;
      animationType?: string;
    };
  };
  onChange: (updatedField: any) => void;
}

const AnimationSection: React.FC<AnimationSectionProps> = ({ field, onChange }) => {
  const { language } = useI18n();
  const animationTypes = [
    { value: 'pulse', label: language === 'ar' ? 'نبض' : 'Pulse' },
    { value: 'shake', label: language === 'ar' ? 'اهتزاز' : 'Shake' },
    { value: 'bounce', label: language === 'ar' ? 'ارتداد' : 'Bounce' },
    { value: 'wiggle', label: language === 'ar' ? 'تمايل' : 'Wiggle' },
    { value: 'flash', label: language === 'ar' ? 'وميض' : 'Flash' }
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Checkbox
          id="animation"
          checked={field.style?.animation || false}
          onCheckedChange={(checked) => {
            onChange({
              ...field,
              style: { ...field.style, animation: !!checked }
            });
          }}
        />
        <label htmlFor="animation" className="ml-2 text-sm font-medium">
          {language === 'ar' ? 'تفعيل الرسوم المتحركة' : 'Enable Animation'}
        </label>
      </div>
      
      {field.style?.animation && (
        <Select
          value={field.style?.animationType || 'pulse'}
          onValueChange={(value) => {
            onChange({
              ...field,
              style: { ...field.style, animationType: value }
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={language === 'ar' ? 'اختر نوع التأثير' : 'Select animation type'} />
          </SelectTrigger>
          <SelectContent>
            {animationTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="grid grid-cols-5 gap-2 mt-4">
        {animationTypes.map((type) => (
          <div 
            key={type.value}
            className={`relative overflow-hidden border rounded p-2 cursor-pointer hover:bg-gray-50 ${field.style?.animationType === type.value ? 'ring-2 ring-primary' : ''}`}
            onClick={() => {
              onChange({
                ...field,
                style: { ...field.style, animation: true, animationType: type.value }
              });
            }}
          >
            <div 
              className={`w-full py-2 bg-[#9b87f5] text-white text-xs font-medium rounded ${type.value}-animation`}
            >
              {type.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormStyleEditor;

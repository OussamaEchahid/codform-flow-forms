
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
}

interface FormStyleEditorProps {
  formStyle: Partial<FormStyle>;
  onStyleChange: (style: Partial<FormStyle>) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: () => void;
}

const FormStyleEditor: React.FC<FormStyleEditorProps> = ({
  isOpen,
  onOpenChange,
  formStyle,
  onStyleChange,
  onSave
}) => {
  const { language } = useI18n();
  
  // Handle individual style property changes
  const handleStyleChange = (key: keyof FormStyle, value: string) => {
    onStyleChange({ ...formStyle, [key]: value });
  };

  // If it's used inline without dialog
  if (isOpen === undefined) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <label htmlFor="primary-color" className="text-sm font-medium">
            {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="primary-color"
              type="color"
              value={formStyle.primaryColor || '#9b87f5'}
              onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
              className="w-10 h-10 rounded"
            />
            <input
              type="text"
              value={formStyle.primaryColor || '#9b87f5'}
              onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <label htmlFor="border-radius" className="text-sm font-medium">
            {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
          </label>
          <select
            id="border-radius"
            value={formStyle.borderRadius || '0.5rem'}
            onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
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
          <label htmlFor="font-size" className="text-sm font-medium">
            {language === 'ar' ? 'حجم الخط' : 'Font Size'}
          </label>
          <select
            id="font-size"
            value={formStyle.fontSize || '1rem'}
            onChange={(e) => handleStyleChange('fontSize', e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="0.875rem">Small</option>
            <option value="1rem">Medium</option>
            <option value="1.125rem">Large</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <label htmlFor="button-style" className="text-sm font-medium">
            {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
          </label>
          <select
            id="button-style"
            value={formStyle.buttonStyle || 'rounded'}
            onChange={(e) => handleStyleChange('buttonStyle', e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="rounded">Rounded</option>
            <option value="square">Square</option>
            <option value="pill">Pill</option>
          </select>
        </div>
      </div>
    );
  }

  // Dialog version
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>
          {language === 'ar' ? 'تخصيص مظهر النموذج' : 'Customize Form Style'}
        </DialogTitle>
        <DialogDescription>
          {language === 'ar' ? 'قم بتخصيص مظهر النموذج لتناسب هويتك التجارية' : 'Customize the form appearance to match your brand identity'}
        </DialogDescription>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="primary-color" className="text-sm font-medium">
              {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="primary-color"
                type="color"
                value={formStyle.primaryColor || '#9b87f5'}
                onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                className="w-10 h-10 rounded"
              />
              <input
                type="text"
                value={formStyle.primaryColor || '#9b87f5'}
                onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="border-radius" className="text-sm font-medium">
              {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
            </label>
            <select
              id="border-radius"
              value={formStyle.borderRadius || '0.5rem'}
              onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
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
            <label htmlFor="font-size" className="text-sm font-medium">
              {language === 'ar' ? 'حجم الخط' : 'Font Size'}
            </label>
            <select
              id="font-size"
              value={formStyle.fontSize || '1rem'}
              onChange={(e) => handleStyleChange('fontSize', e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="0.875rem">Small</option>
              <option value="1rem">Medium</option>
              <option value="1.125rem">Large</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="button-style" className="text-sm font-medium">
              {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
            </label>
            <select
              id="button-style"
              value={formStyle.buttonStyle || 'rounded'}
              onChange={(e) => handleStyleChange('buttonStyle', e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="rounded">Rounded</option>
              <option value="square">Square</option>
              <option value="pill">Pill</option>
            </select>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onSave}>
            {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormStyleEditor;

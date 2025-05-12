import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Checkbox, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
}

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
            <label htmlFor="border-radius" className="text-sm font-medium">
              {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
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
            <label htmlFor="font-size" className="text-sm font-medium">
              {language === 'ar' ? 'حجم الخط' : 'Font Size'}
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
          
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="button-style" className="text-sm font-medium">
              {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
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

const AnimationSection = ({ field, onChange }) => {
  const animationTypes = [
    { value: 'pulse', label: 'Pulse' },
    { value: 'shake', label: 'Shake' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'wiggle', label: 'Wiggle' },
    { value: 'flash', label: 'Flash' }
  ];
  
  return (
    <div className="space-y-2">
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
        <label htmlFor="animation" className="ml-2 text-sm font-medium">Enable Animation</label>
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
            <SelectValue placeholder="Select animation type" />
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
    </div>
  );
};

export default FormStyleEditor;

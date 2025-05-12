
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
          {language === 'ar' ? 'قم بتخصيص مظهر النموذج لتناسب هويتك التجارية. هذه الإعدادات خاصة بهذا النموذج فقط.' : 'Customize the form appearance to match your brand identity. These settings apply to this form only.'}
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

          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-medium mb-3">
              {language === 'ar' ? 'تأثيرات الرسوم المتحركة للزر' : 'Button Animation Effects'}
            </h3>
            <AnimationSection field={{ style: { animation: false, animationType: 'pulse' } }} onChange={() => {}} />
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
            <button 
              className={`w-full py-2 bg-[#9b87f5] text-white text-xs font-medium rounded ${type.value}-animation`}
            >
              {type.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormStyleEditor;

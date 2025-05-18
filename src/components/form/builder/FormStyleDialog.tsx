
import React from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface FormStyleDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  formStyle: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
  };
  handleStyleChange: (key: string, value: string) => void;
}

const FormStyleDialog: React.FC<FormStyleDialogProps> = ({
  open,
  setOpen,
  formStyle,
  handleStyleChange
}) => {
  const { language } = useI18n();

  const colorPresets = ['#9b87f5', '#2563eb', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-right">
          {language === 'ar' ? 'تخصيص مظهر النموذج' : 'Customize Form Appearance'}
        </DialogTitle>
        
        <div className="space-y-4 py-4 text-right">
          <div className="form-control">
            <label className="form-label">
              {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={formStyle.primaryColor}
                onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                className="h-8 w-8 rounded"
              />
              <input
                type="text"
                value={formStyle.primaryColor}
                onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                className="flex-1 form-input"
              />
            </div>
          </div>
          
          <div className="form-control">
            <label className="form-label">
              {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
            </label>
            <select
              className="form-select"
              value={formStyle.borderRadius}
              onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
            >
              <option value="0">{language === 'ar' ? 'بدون استدارة' : 'No Rounding'}</option>
              <option value="0.25rem">{language === 'ar' ? 'استدارة خفيفة' : 'Light Rounding'}</option>
              <option value="0.5rem">{language === 'ar' ? 'استدارة متوسطة' : 'Medium Rounding'}</option>
              <option value="1rem">{language === 'ar' ? 'استدارة كبيرة' : 'Large Rounding'}</option>
              <option value="9999px">{language === 'ar' ? 'دائري' : 'Circular'}</option>
            </select>
          </div>
          
          <div className="form-control">
            <label className="form-label">
              {language === 'ar' ? 'حجم الخط' : 'Font Size'}
            </label>
            <select
              className="form-select"
              value={formStyle.fontSize}
              onChange={(e) => handleStyleChange('fontSize', e.target.value)}
            >
              <option value="0.875rem">{language === 'ar' ? 'صغير' : 'Small'}</option>
              <option value="1rem">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
              <option value="1.125rem">{language === 'ar' ? 'كبير' : 'Large'}</option>
              <option value="1.25rem">{language === 'ar' ? 'كبير جداً' : 'Extra Large'}</option>
            </select>
          </div>
          
          <div className="form-control">
            <label className="form-label">
              {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
            </label>
            <select
              className="form-select"
              value={formStyle.buttonStyle}
              onChange={(e) => handleStyleChange('buttonStyle', e.target.value)}
            >
              <option value="rounded">{language === 'ar' ? 'مستدير' : 'Rounded'}</option>
              <option value="square">{language === 'ar' ? 'مربع' : 'Square'}</option>
              <option value="pill">{language === 'ar' ? 'كبسولي' : 'Pill'}</option>
            </select>
          </div>
          
          <div className="mt-4 grid grid-cols-5 gap-2">
            {colorPresets.map(color => (
              <div
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
        
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>
            {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormStyleDialog;

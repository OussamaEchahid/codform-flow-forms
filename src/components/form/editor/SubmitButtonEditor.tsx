import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface SubmitButtonEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const SubmitButtonEditor: React.FC<SubmitButtonEditorProps> = ({ field, onSave, onClose }) => {
  const { language } = useI18n();
  const [currentField, setCurrentField] = React.useState<FormField>(field);

  const handleChange = (property: string, value: any) => {
    if (property.includes('.')) {
      const [parent, child] = property.split('.');
      setCurrentField({
        ...currentField,
        [parent]: {
          ...currentField[parent as keyof FormField],
          [child]: value
        }
      });
    } else {
      setCurrentField({
        ...currentField,
        [property]: value
      });
    }
  };

  const handleSave = () => {
    onSave(currentField);
    onClose();
  };

  // أيقونات خاصة بأزرار الإرسال
  const submitIcons = [
    { value: "none", label: language === 'ar' ? 'بدون أيقونة' : 'No Icon' },
    { value: "shopping-cart", label: language === 'ar' ? 'سلة التسوق' : 'Shopping Cart', icon: '🛒' },
    { value: "shopping-bag", label: language === 'ar' ? 'حقيبة تسوق' : 'Shopping Bag', icon: '🛍️' },
    { value: "credit-card", label: language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card', icon: '💳' },
    { value: "handshake", label: language === 'ar' ? 'دفع عند الاستلام' : 'Cash on Delivery', icon: '🤝' },
    { value: "truck", label: language === 'ar' ? 'توصيل سريع' : 'Fast Delivery', icon: '🚚' },
    { value: "check", label: language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order', icon: '✅' },
    { value: "send", label: language === 'ar' ? 'إرسال الطلب' : 'Send Order', icon: '📤' },
    { value: "zap", label: language === 'ar' ? 'طلب فوري' : 'Instant Order', icon: '⚡' }
  ];

  const animationTypes = [
    { value: "pulse", label: language === 'ar' ? 'نبض' : 'Pulse' },
    { value: "bounce", label: language === 'ar' ? 'ارتداد' : 'Bounce' },
    { value: "shake", label: language === 'ar' ? 'اهتزاز' : 'Shake' },
    { value: "wiggle", label: language === 'ar' ? 'تمايل' : 'Wiggle' },
    { value: "flash", label: language === 'ar' ? 'وميض' : 'Flash' }
  ];

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-medium text-lg">
        {language === 'ar' ? 'إعدادات زر الإرسال' : 'Submit Button Settings'}
      </h3>

      {/* Button Text */}
      <div className="space-y-2">
        <Label htmlFor="button-text">
          {language === 'ar' ? 'نص الزر' : 'Button Text'}
        </Label>
        <Input
          id="button-text"
          value={currentField.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder={language === 'ar' ? 'إرسال الطلب' : 'Submit Order'}
        />
      </div>

      {/* Button Color */}
      <div className="space-y-2">
        <Label htmlFor="button-bg-color">
          {language === 'ar' ? 'لون الخلفية' : 'Background Color'}
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            id="button-bg-color"
            type="color"
            value={currentField.style?.backgroundColor || '#9b87f5'}
            onChange={(e) => handleChange('style.backgroundColor', e.target.value)}
            className="w-12 h-8 p-1"
          />
          <Input
            type="text"
            value={currentField.style?.backgroundColor || '#9b87f5'}
            onChange={(e) => handleChange('style.backgroundColor', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <Label htmlFor="button-text-color">
          {language === 'ar' ? 'لون النص' : 'Text Color'}
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            id="button-text-color"
            type="color"
            value={currentField.style?.color || '#ffffff'}
            onChange={(e) => handleChange('style.color', e.target.value)}
            className="w-12 h-8 p-1"
          />
          <Input
            type="text"
            value={currentField.style?.color || '#ffffff'}
            onChange={(e) => handleChange('style.color', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Icon Selection */}
      <div className="space-y-2">
        <Label htmlFor="button-icon">
          {language === 'ar' ? 'الأيقونة' : 'Icon'}
        </Label>
        <Select 
          value={currentField.style?.icon || 'none'} 
          onValueChange={(value) => {
            handleChange('style.icon', value === 'none' ? undefined : value);
            handleChange('style.showIcon', value !== 'none');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={language === 'ar' ? 'اختر أيقونة' : 'Select icon'} />
          </SelectTrigger>
          <SelectContent>
            {submitIcons.map((icon) => (
              <SelectItem key={icon.value} value={icon.value}>
                <div className="flex items-center gap-2">
                  {icon.icon && <span>{icon.icon}</span>}
                  <span>{icon.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Icon Position */}
      {currentField.style?.icon && currentField.style?.icon !== 'none' && (
        <div className="space-y-2">
          <Label htmlFor="icon-position">
            {language === 'ar' ? 'موضع الأيقونة' : 'Icon Position'}
          </Label>
          <Select
            value={currentField.style?.iconPosition || 'left'}
            onValueChange={(value) => handleChange('style.iconPosition', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">{language === 'ar' ? 'يسار' : 'Left'}</SelectItem>
              <SelectItem value="right">{language === 'ar' ? 'يمين' : 'Right'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Icon Color */}
      {currentField.style?.icon && currentField.style?.icon !== 'none' && (
        <div className="space-y-2">
          <Label htmlFor="icon-color">
            {language === 'ar' ? 'لون الأيقونة' : 'Icon Color'}
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="icon-color"
              type="color"
              value={currentField.style?.iconColor || '#ffffff'}
              onChange={(e) => handleChange('style.iconColor', e.target.value)}
              className="w-12 h-8 p-1"
            />
            <Input
              type="text"
              value={currentField.style?.iconColor || '#ffffff'}
              onChange={(e) => handleChange('style.iconColor', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      )}

      {/* Icon Size */}
      {currentField.style?.icon && currentField.style?.icon !== 'none' && (
        <div className="space-y-2">
          <Label htmlFor="icon-size">
            {language === 'ar' ? 'حجم الأيقونة' : 'Icon Size'}
          </Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[parseInt(String(currentField.style?.iconSize || '18').replace('px',''))]}
              onValueChange={(value) => handleChange('style.iconSize', `${value[0]}px`)}
              max={48}
              min={12}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground min-w-[50px]">
              {parseInt(String(currentField.style?.iconSize || '18').replace('px',''))}px
            </span>
          </div>
        </div>
      )}

      {/* Font Size */}
      <div className="space-y-2">
        <Label htmlFor="font-size">
          {language === 'ar' ? 'حجم الخط' : 'Font size'}
        </Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[parseInt(currentField.style?.fontSize?.replace('px', '') || '16')]}
            onValueChange={(value) => handleChange('style.fontSize', `${value[0]}px`)}
            max={60}
            min={10}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground min-w-[50px]">
            {parseInt(currentField.style?.fontSize?.replace('px', '') || '16')}px
          </span>
        </div>
      </div>

      {/* Padding Y */}
      <div className="space-y-2">
        <Label htmlFor="padding-y">
          {language === 'ar' ? 'الحشو العمودي' : 'Padding Y'}
        </Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[parseInt(currentField.style?.paddingY?.replace('px', '') || '10')]}
            onValueChange={(value) => handleChange('style.paddingY', `${value[0]}px`)}
            max={80}
            min={0}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground min-w-[50px]">
            {parseInt(currentField.style?.paddingY?.replace('px', '') || '10')}px
          </span>
        </div>
      </div>

      {/* Font Weight */}
      <div className="space-y-2">
        <Label htmlFor="font-weight">
          {language === 'ar' ? 'سُمك الخط' : 'Font Weight'}
        </Label>
        <Select value={currentField.style?.fontWeight || '700'} onValueChange={(value) => handleChange('style.fontWeight', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="400">{language === 'ar' ? 'عادي (400)' : 'Normal (400)'}</SelectItem>
            <SelectItem value="500">{language === 'ar' ? 'متوسط (500)' : 'Medium (500)'}</SelectItem>
            <SelectItem value="600">{language === 'ar' ? 'نصف عريض (600)' : 'Semi Bold (600)'}</SelectItem>
            <SelectItem value="700">{language === 'ar' ? 'عريض (700)' : 'Bold (700)'}</SelectItem>
            <SelectItem value="800">{language === 'ar' ? 'عريض جداً (800)' : 'Extra Bold (800)'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Animation */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Checkbox
          id="button-animation"
          checked={currentField.style?.animation || false}
          onCheckedChange={(checked) => handleChange('style.animation', checked)}
        />
        <Label htmlFor="button-animation">
          {language === 'ar' ? 'تفعيل الحركة' : 'Enable Animation'}
        </Label>
      </div>

      {/* Animation Type */}
      {currentField.style?.animation && (
        <div className="space-y-2">
          <Label htmlFor="animation-type">
            {language === 'ar' ? 'نوع الحركة' : 'Animation Type'}
          </Label>
          <Select
            value={currentField.style?.animationType || 'pulse'}
            onValueChange={(value) => handleChange('style.animationType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {animationTypes.map((anim) => (
                <SelectItem key={anim.value} value={anim.value}>
                  {anim.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={handleSave}>
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default SubmitButtonEditor;
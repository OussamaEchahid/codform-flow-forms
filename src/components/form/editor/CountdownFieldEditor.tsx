import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X, Clock } from 'lucide-react';

interface CountdownFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const CountdownFieldEditor: React.FC<CountdownFieldEditorProps> = ({ 
  field, 
  onSave, 
  onClose 
}) => {
  const { language } = useI18n();
  
  const [currentField, setCurrentField] = useState<FormField>({
    ...field,
    label: field.label || (language === 'ar' ? 'العرض ينتهي خلال' : 'Offer ends in'),
    style: {
      backgroundColor: '#d4ff00',
      borderColor: '#b8e600',
      color: '#000000',
      fontSize: '18px',
      fontWeight: '700',
      fontFamily: 'Tajawal',
      textAlign: 'center',
      borderRadius: '8px',
      counterColor: '#000000',
      counterBackgroundColor: '#ffffff',
      counterFontSize: '24px',
      counterFontWeight: '700',
      counterLineHeight: '1.2',
      titleSize: '18px',
      titleWeight: '700',
      titleColor: '#000000',
      endDate: '',
      daysLabel: language === 'ar' ? 'أيام' : 'Days',
      hoursLabel: language === 'ar' ? 'ساعات' : 'Hrs',
      minutesLabel: language === 'ar' ? 'دقائق' : 'Mins',
      secondsLabel: language === 'ar' ? 'ثواني' : 'Secs',
      ...field.style
    }
  });

  const handleStyleChange = (property: string, value: any) => {
    setCurrentField(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [property]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(currentField);
  };

  const fontFamilies = [
    { value: 'Tajawal', label: 'Tajawal' },
    { value: 'Cairo', label: 'Cairo' },
    { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">
            {language === 'ar' ? 'إعدادات العداد التنازلي' : 'Countdown Configuration'}
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Title Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">
            {language === 'ar' ? 'إعدادات العنوان' : 'Title Settings'}
          </h3>
          
          <div>
            <Label>{language === 'ar' ? 'النص' : 'Title'}</Label>
            <Input
              value={currentField.label || ''}
              onChange={(e) => setCurrentField(prev => ({ ...prev, label: e.target.value }))}
              placeholder={language === 'ar' ? 'العرض ينتهي خلال' : 'Offer ends in'}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'لون العنوان' : 'Title Color'}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={currentField.style?.titleColor || '#000000'}
                  onChange={(e) => handleStyleChange('titleColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={currentField.style?.titleColor || '#000000'}
                  onChange={(e) => handleStyleChange('titleColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'حجم العنوان' : 'Title Size'}</Label>
              <div className="mt-2">
                <Slider
                  value={[parseInt(currentField.style?.titleSize?.replace('px', '') || '18')]}
                  onValueChange={(value) => handleStyleChange('titleSize', `${value[0]}px`)}
                  max={36}
                  min={12}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {currentField.style?.titleSize || '18px'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>{language === 'ar' ? 'وزن العنوان' : 'Title Weight'}</Label>
            <div className="mt-2">
              <Slider
                value={[parseInt(currentField.style?.titleWeight || '700')]}
                onValueChange={(value) => handleStyleChange('titleWeight', value[0].toString())}
                max={900}
                min={100}
                step={100}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">
                {currentField.style?.titleWeight || '700'}
              </div>
            </div>
          </div>
        </div>

        {/* Countdown End Date */}
        <div>
          <Label>{language === 'ar' ? 'تاريخ انتهاء العداد' : 'Countdown End Date'}</Label>
          <Input
            type="datetime-local"
            value={currentField.style?.endDate || ''}
            onChange={(e) => handleStyleChange('endDate', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Counter Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">
            {language === 'ar' ? 'إعدادات العداد' : 'Counter Settings'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'لون الأرقام' : 'Counter Color'}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={currentField.style?.counterColor || '#000000'}
                  onChange={(e) => handleStyleChange('counterColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={currentField.style?.counterColor || '#000000'}
                  onChange={(e) => handleStyleChange('counterColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'لون خلفية العداد' : 'Counter Background'}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={currentField.style?.counterBackgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('counterBackgroundColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={currentField.style?.counterBackgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('counterBackgroundColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'حجم خط العداد' : 'Counter Font Size'}</Label>
              <div className="mt-2">
                <Slider
                  value={[parseInt(currentField.style?.counterFontSize?.replace('px', '') || '24')]}
                  onValueChange={(value) => handleStyleChange('counterFontSize', `${value[0]}px`)}
                  max={48}
                  min={16}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {currentField.style?.counterFontSize || '24px'}
                </div>
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'وزن خط العداد' : 'Counter Font Weight'}</Label>
              <div className="mt-2">
                <Slider
                  value={[parseInt(currentField.style?.counterFontWeight || '700')]}
                  onValueChange={(value) => handleStyleChange('counterFontWeight', value[0].toString())}
                  max={900}
                  min={100}
                  step={100}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {currentField.style?.counterFontWeight || '700'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>{language === 'ar' ? 'ارتفاع السطر' : 'Counter Line Height'}</Label>
            <div className="mt-2">
              <Slider
                value={[parseFloat(currentField.style?.counterLineHeight || '1.2') * 100]}
                onValueChange={(value) => handleStyleChange('counterLineHeight', (value[0] / 100).toString())}
                max={200}
                min={80}
                step={10}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">
                {currentField.style?.counterLineHeight || '1.2'}
              </div>
            </div>
          </div>
        </div>

        {/* Background Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">
            {language === 'ar' ? 'إعدادات الخلفية' : 'Background Settings'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'لون الخلفية' : 'Background Color'}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={currentField.style?.backgroundColor || '#d4ff00'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={currentField.style?.backgroundColor || '#d4ff00'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'لون الحدود' : 'Border Color'}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={currentField.style?.borderColor || '#b8e600'}
                  onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={currentField.style?.borderColor || '#b8e600'}
                  onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>{language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}</Label>
            <div className="mt-2">
              <Slider
                value={[parseInt(currentField.style?.borderRadius?.replace('px', '') || '8')]}
                onValueChange={(value) => handleStyleChange('borderRadius', `${value[0]}px`)}
                max={24}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">
                {currentField.style?.borderRadius || '8px'}
              </div>
            </div>
          </div>
        </div>

        {/* Font Family */}
        <div>
          <Label>{language === 'ar' ? 'نوع الخط' : 'Font Family'}</Label>
          <Select
            value={currentField.style?.fontFamily || 'Tajawal'}
            onValueChange={(value) => handleStyleChange('fontFamily', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Labels */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">
            {language === 'ar' ? 'تسميات الوحدات' : 'Unit Labels'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'تسمية الأيام' : 'Days Label'}</Label>
              <Input
                value={currentField.style?.daysLabel || (language === 'ar' ? 'أيام' : 'Days')}
                onChange={(e) => handleStyleChange('daysLabel', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'تسمية الساعات' : 'Hours Label'}</Label>
              <Input
                value={currentField.style?.hoursLabel || (language === 'ar' ? 'ساعات' : 'Hrs')}
                onChange={(e) => handleStyleChange('hoursLabel', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'تسمية الدقائق' : 'Minutes Label'}</Label>
              <Input
                value={currentField.style?.minutesLabel || (language === 'ar' ? 'دقائق' : 'Mins')}
                onChange={(e) => handleStyleChange('minutesLabel', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'تسمية الثواني' : 'Seconds Label'}</Label>
              <Input
                value={currentField.style?.secondsLabel || (language === 'ar' ? 'ثواني' : 'Secs')}
                onChange={(e) => handleStyleChange('secondsLabel', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
          {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default CountdownFieldEditor;
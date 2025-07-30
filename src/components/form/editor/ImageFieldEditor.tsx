import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface ImageFieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const ImageFieldEditor: React.FC<ImageFieldEditorProps> = ({ field, onSave, onClose }) => {
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

  const handleSaveField = () => {
    onSave(currentField);
    onClose();
  };

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    handleChange('style.textAlign', alignment);
  };

  const currentWidth = typeof currentField.width === 'string' ? parseInt(currentField.width) : (currentField.width || 100);
  const currentAlignment = currentField.style?.textAlign || 'center';

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-medium text-lg">
        {language === 'ar' ? 'إعدادات الصورة' : 'Image Settings'}
      </h3>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image-url">
          {language === 'ar' ? 'رابط الصورة' : 'Image URL'}
        </Label>
        <Input
          id="image-url"
          type="url"
          value={currentField.src || ''}
          onChange={(e) => handleChange('src', e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full"
        />
      </div>

      {/* Image Alt Text */}
      <div className="space-y-2">
        <Label htmlFor="image-alt">
          {language === 'ar' ? 'نص بديل للصورة' : 'Alt Text'}
        </Label>
        <Input
          id="image-alt"
          value={currentField.alt || ''}
          onChange={(e) => handleChange('alt', e.target.value)}
          placeholder={language === 'ar' ? 'وصف الصورة' : 'Image description'}
          className="w-full"
        />
      </div>

      {/* Image Width Slider */}
      <div className="space-y-2">
        <Label htmlFor="image-width">
          {language === 'ar' ? `عرض الصورة (${currentWidth}%)` : `Image Width (${currentWidth}%)`}
        </Label>
        <div className="px-2">
          <Slider
            id="image-width"
            min={10}
            max={100}
            step={5}
            value={[currentWidth]}
            onValueChange={(value) => handleChange('width', value[0].toString())}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-2">
        <Label>
          {language === 'ar' ? 'المحاذاة' : 'Alignment'}
        </Label>
        <div className="flex gap-2">
          <Button
            variant={currentAlignment === 'left' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAlignmentChange('left')}
            className="flex items-center gap-1"
          >
            <AlignLeft size={16} />
            {language === 'ar' ? 'يسار' : 'Left'}
          </Button>
          <Button
            variant={currentAlignment === 'center' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAlignmentChange('center')}
            className="flex items-center gap-1"
          >
            <AlignCenter size={16} />
            {language === 'ar' ? 'وسط' : 'Center'}
          </Button>
          <Button
            variant={currentAlignment === 'right' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleAlignmentChange('right')}
            className="flex items-center gap-1"
          >
            <AlignRight size={16} />
            {language === 'ar' ? 'يمين' : 'Right'}
          </Button>
        </div>
      </div>

      {/* Image Label */}
      <div className="space-y-2">
        <Label htmlFor="image-label">
          {language === 'ar' ? 'تسمية الصورة (اختياري)' : 'Image Label (Optional)'}
        </Label>
        <Input
          id="image-label"
          value={currentField.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder={language === 'ar' ? 'اسم الصورة' : 'Image name'}
          className="w-full"
        />
      </div>

      {/* Help Text */}
      <div className="space-y-2">
        <Label htmlFor="image-help">
          {language === 'ar' ? 'نص المساعدة (اختياري)' : 'Help Text (Optional)'}
        </Label>
        <Input
          id="image-help"
          value={currentField.helpText || ''}
          onChange={(e) => handleChange('helpText', e.target.value)}
          placeholder={language === 'ar' ? 'وصف إضافي للصورة' : 'Additional image description'}
          className="w-full"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={handleSaveField}>
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default ImageFieldEditor;
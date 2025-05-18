
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ColorSelector from './ColorSelector';
import TextAlignmentSelector from './TextAlignmentSelector';
import TitlePreview from './TitlePreview';
import { Slider } from '@/components/ui/slider';

interface TitleEditorFormProps {
  title: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  descriptionColor: string;
  textAlign: string;
  showDescription?: boolean;
  showTitle?: boolean;
  titleFontSize?: string;
  descriptionFontSize?: string;
  formDirection?: 'ltr' | 'rtl';
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onBackgroundColorChange: (color: string) => void;
  onTextColorChange: (color: string) => void;
  onDescriptionColorChange: (color: string) => void;
  onTextAlignChange: (align: 'left' | 'center' | 'right') => void;
  onShowDescriptionChange?: (show: boolean) => void;
  onShowTitleChange?: (show: boolean) => void;
  onTitleFontSizeChange?: (size: string) => void;
  onDescriptionFontSizeChange?: (size: string) => void;
  onSave: () => void;
  onCancel?: () => void;
  language: string;
}

const TitleEditorForm: React.FC<TitleEditorFormProps> = ({
  title,
  description,
  backgroundColor,
  textColor,
  descriptionColor,
  textAlign,
  showDescription = true,
  showTitle = true,
  titleFontSize = '1.5rem',
  descriptionFontSize = '0.875rem',
  formDirection,
  onTitleChange,
  onDescriptionChange,
  onBackgroundColorChange,
  onTextColorChange,
  onDescriptionColorChange,
  onTextAlignChange,
  onShowDescriptionChange,
  onShowTitleChange,
  onTitleFontSizeChange,
  onDescriptionFontSizeChange,
  onSave,
  onCancel,
  language
}) => {
  // تحويل حجم الخط من رقم مع بكسل إلى رقم فقط للسلايدر
  const getTitleFontSizeValue = () => {
    const size = titleFontSize?.replace('px', '').replace('rem', '');
    return parseFloat(size || '24');
  };

  const getDescFontSizeValue = () => {
    const size = descriptionFontSize?.replace('px', '').replace('rem', '');
    return parseFloat(size || '14');
  };

  // تحديث حجم الخط
  const handleTitleFontSizeChange = (value: number[]) => {
    if (onTitleFontSizeChange) {
      onTitleFontSizeChange(`${value[0]}px`);
    }
  };

  const handleDescFontSizeChange = (value: number[]) => {
    if (onDescriptionFontSizeChange) {
      onDescriptionFontSizeChange(`${value[0]}px`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* العمود الأول - الإعدادات الأساسية */}
        <div className="space-y-4">
          {/* عنوان النموذج */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="block text-sm font-medium">
                {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
              </Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Label htmlFor="show-title" className="text-xs text-gray-500">
                  {language === 'ar' ? 'إظهار' : 'Show'}
                </Label>
                <Switch
                  id="show-title"
                  checked={showTitle}
                  onCheckedChange={onShowTitleChange}
                  size="sm"
                />
              </div>
            </div>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full"
              placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
              disabled={!showTitle}
            />
          </div>

          {/* حجم خط العنوان */}
          {showTitle && onTitleFontSizeChange && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>
                  {language === 'ar' ? 'حجم خط العنوان' : 'Title Font Size'}
                </Label>
                <span className="text-sm">{getTitleFontSizeValue()}px</span>
              </div>
              <Slider
                value={[getTitleFontSizeValue()]}
                min={12}
                max={48}
                step={1}
                onValueChange={handleTitleFontSizeChange}
              />
            </div>
          )}

          {/* وصف النموذج */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="block text-sm font-medium">
                {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
              </Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Label htmlFor="show-description" className="text-xs text-gray-500">
                  {language === 'ar' ? 'إظهار' : 'Show'}
                </Label>
                <Switch
                  id="show-description"
                  checked={showDescription}
                  onCheckedChange={onShowDescriptionChange}
                  size="sm"
                  disabled={!showTitle}
                />
              </div>
            </div>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full"
              placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
              disabled={!showTitle || !showDescription}
            />
          </div>

          {/* حجم خط الوصف */}
          {showTitle && showDescription && onDescriptionFontSizeChange && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>
                  {language === 'ar' ? 'حجم خط الوصف' : 'Description Font Size'}
                </Label>
                <span className="text-sm">{getDescFontSizeValue()}px</span>
              </div>
              <Slider
                value={[getDescFontSizeValue()]}
                min={10}
                max={24}
                step={1}
                onValueChange={handleDescFontSizeChange}
              />
            </div>
          )}
        </div>

        {/* العمود الثاني - خيارات التنسيق والألوان */}
        <div className="space-y-4">
          {/* لون الخلفية */}
          <ColorSelector
            label={language === 'ar' ? 'لون الخلفية' : 'Background Color'}
            color={backgroundColor}
            onChange={onBackgroundColorChange}
            language={language}
          />
          
          {/* لون العنوان */}
          {showTitle && (
            <ColorSelector
              label={language === 'ar' ? 'لون العنوان' : 'Title Color'}
              color={textColor}
              onChange={onTextColorChange}
              language={language}
            />
          )}
          
          {/* لون الوصف */}
          {showTitle && showDescription && (
            <ColorSelector
              label={language === 'ar' ? 'لون الوصف' : 'Description Color'}
              color={descriptionColor}
              onChange={onDescriptionColorChange}
              language={language}
            />
          )}
          
          {/* محاذاة النص */}
          <TextAlignmentSelector
            textAlign={textAlign}
            onChange={onTextAlignChange}
            language={language}
          />
        </div>
      </div>

      {/* أزرار الحفظ والإلغاء */}
      <div className="flex justify-end space-x-2 rtl:space-x-reverse">
        {onCancel && (
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        )}
        <Button onClick={onSave}>
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default TitleEditorForm;
